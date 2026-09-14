# AGENTES.md — el arnés de trabajo del agente

`PRINCIPIOS.md` dice **qué** se construye y con qué calidad. Este documento dice
**cómo trabaja un agente** dentro de este repositorio: cómo se entera de la
verdad, qué hace antes de romper algo, y cuándo puede decir que terminó.

Existe porque un agente falla distinto a una persona. No se cansa ni se
distrae, pero sí hace tres cosas que un empleado no haría: se cree la
documentación que encuentra, actúa sobre una foto del sistema tomada hace diez
minutos, y presenta un número sin haberlo desglosado. Las cinco reglas de abajo
salieron de que las tres pasaron acá, en producción.

---

## Las cinco reglas

### 1. La realidad manda sobre la documentación

Los documentos envejecen; la base de datos y el proceso que corre, no. Cuando
un documento y el sistema no coinciden, **el sistema tiene razón y el documento
se arregla en el mismo cambio**.

Hasta el 2026-09-14 este mismo archivo vecino, `CLAUDE.md`, decía «no hay base
de datos, no hay API, nada se guarda» mientras el sitio corría sobre Postgres
con panel, contratos y CRM. Un agente que lo leyera y lo creyera empezaba a
trabajar con un modelo mental falso del producto entero.

Antes de opinar sobre el estado de algo, míralo:

```bash
docker exec margarita_postgres psql -U margarita -d margarita -c "\dt"   # qué tablas hay
pm2 describe margarita-renace                                            # qué corre
curl -sI https://margaritarenace.com.ve | head -1                        # qué responde
```

### 2. Vuelve a mirar justo antes de romper algo

Entre que investigas y que ejecutas pasa tiempo, y este sistema **tiene una
persona trabajando dentro**. El 2026-09-14, mientras se preparaba el borrado de
las fotos de banco, la dueña borró desde el panel la foto propia de Agua Mar.
El plan hecho a las 12:40 —«todos los publicados conservan su foto real»— dejó
de ser cierto a las 13:29 sin que nada avisara. Se detectó porque el conteo
cambió entre dos consultas.

La regla: **la última consulta antes de un borrado o una migración destructiva
se hace en el mismo paso que el borrado**, no diez minutos antes. Si el estado
no es el que esperabas, para y cuéntalo.

### 3. Todo lo irreversible necesita su vuelta atrás **antes**

No después, no «si hace falta». Antes.

```bash
# volcar la tabla que se va a tocar, con fecha y motivo en el nombre
docker exec margarita_postgres pg_dump -U margarita -d margarita \
  --data-only --table=property_images > /root/backups/margarita/property_images-antes-de-X-AAAAMMDD.sql
```

Lo que **no** está en git y solo se recupera del respaldo diario de las 03:45:
las fotos subidas desde el panel (`/var/www/margarita-uploads`), la base entera,
y los secretos de `/etc/margarita-renace/`. Retención de 7 días. El 2026-09-14
la foto de Agua Mar se recuperó de `uploads-20260914-0345.tar.gz`; si el borrado
hubiera sido una semana antes, no habría existido.

Y el cambio destructivo se escribe como **migración numerada con su porqué**, no
como un comando suelto en una terminal: así queda en git, se aplica igual en una
base nueva y se puede leer dentro de seis meses.

### 4. No reportes un número que no separaste

Un total sin desglosar es peor que no tener número, porque se decide sobre él.

El 2026-09-14 se informó que el sitio recibía «3.300 peticiones diarias de
visitantes reales». Era el total del log de nginx. Al separarlo: de 23.381
peticiones en siete días, **9.143 eran la propia IP del servidor** (la dueña
navegando por su proxy), 5.015 locales de pruebas y del cron, 3.475 de un
escáner buscando la API de Docker, y unas 3.000 de bots declarados. Personas
reales ajenas al negocio: **139, con 389 páginas en toda la semana**. Dos
órdenes de magnitud de diferencia, y una decisión de negocio distinta.

Antes de dar una cifra de tráfico o de uso, réstale: la IP del servidor
(`46.224.138.26`), `127.0.0.1`, los bots por *user-agent*, y los escáneres. Si no
puedes separarlos, di que no puedes en vez de dar el bruto.

### 5. Cierra el lazo: no está hecho hasta que lo viste funcionando

Que el código compile no dice que funcione, y que la instrumentación exista no
dice que mida.

El medidor de visitas llevaba **desde agosto guardando la procedencia vacía en
las 703 filas**: el aviso de métricas sale de la propia página, así que su
cabecera `Referer` apuntaba al propio sitio y nunca al enlace que trajo a la
persona. Nadie lo notó porque nadie miró la tabla después de instalarlo. Se
arregló el 2026-09-14 mandando `document.referrer` desde el navegador.

**Instrumentar y verificar la instrumentación son dos tareas.** Después de tocar
algo que mide, provoca un evento y comprueba que llegó:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://127.0.0.1:3002/api/visita \
  -H 'Host: margaritarenace.com.ve' -H 'Content-Type: application/json' \
  -H 'X-Real-IP: 203.0.113.7' -H 'User-Agent: Mozilla/5.0 (iPhone…) Safari/604.1' \
  -d '{"path":"/enlaces","query":"?utm_source=ig","ref":"https://l.instagram.com/"}'
docker exec margarita_postgres psql -U margarita -d margarita \
  -c "select path, fuente from page_views order by created_at desc limit 3"
```

Y borra después las filas de prueba.

---

## El bucle de trabajo

```bash
npx tsc --noEmit                      # 1. tipos limpios (los errores NO se ignoran)
                                      # 2. migraciones aplicadas, si las hay
npm run deploy                        # 3. build + pm2 restart + IndexNow, en un paso
curl -s -o /dev/null -w '%{http_code}' https://margaritarenace.com.ve/<ruta tocada>
```

Después de cualquier cambio visible, las tres páginas que siempre se comprueban:
`/`, la ficha de un apartamento, y `/guia`. Y una captura real a 390 px y
1440 px con el Chrome headless del servidor si el cambio es visual — el diseño
no se juzga con `grep` (`PRINCIPIOS.md` §1).

Si tocaste el esquema, levanta una base de prueba y aplica
`schema.sql` + todas las migraciones + `seed.sql` en orden. Es la única forma de
saber que una instalación nueva sigue funcionando; el 2026-09-14 ese paso
detectó que la semilla iba a reintroducir las fotos de banco recién borradas.

## El estado se calcula, no se escribe a mano

Una lista de pendientes escrita a mano se queda vieja en una semana y después
miente. Este proyecto ya resolvió eso: `lib/pendientes.ts` **deriva** los
pendientes del estado real de la base —falta el WhatsApp, hay enlaces sin
destino, quedan listados de relleno— y solo las tareas que el sitio no puede
observar (abrir la ficha de Google, verificar el dominio) se marcan a mano.

Aplica el mismo criterio a lo que escribas: si un dato se puede consultar, se
consulta; si lo escribes en un `.md`, ponle fecha y acepta que caduca. `ESTADO.md`
lleva fecha por eso.

## Trabajar al lado de una persona

La dueña usa el panel mientras el agente trabaja, y sus cambios son tan válidos
como los del agente. De ahí tres costumbres:

- **No deshagas lo que hizo una persona** porque contradiga tu plan. Cuéntalo y
  pregunta. Lo que sí se puede es recuperar de un respaldo lo que ella pida.
- **Un `pm2 restart` corta las peticiones en curso.** Es de segundos, pero no se
  reinicia «por si acaso»: solo cuando hace falta aplicar algo.
- **Cuidado con fail2ban.** Ya baneó a la dueña una vez durante un build; el jail
  `nginx-bad-request` está en 30/10m por eso (`SEGURIDAD.md`).

## Escribir para el próximo agente

El próximo agente llega sin memoria y con la mitad del contexto. Lo que le
sirve no es qué cambiaste —eso está en el diff— sino **por qué**, y sobre todo
**qué descartaste y por qué no funcionaba**.

- El mensaje del commit explica el problema y la causa, no la lista de archivos.
- El comentario de una migración explica la decisión, no la sintaxis.
- Un comentario que explica lo que el código ya dice es ruido; uno que explica
  por qué **no** se hizo de la forma obvia es el que evita que se deshaga.
- Documentación del módulo y `ESTADO.md` se actualizan **en el mismo commit**. Un
  documento que se corrige «después» no se corrige.

## Lo que nunca se hace

- **Inventar datos**: precios, reseñas, valoraciones, disponibilidad, o una foto
  de otro apartamento como si fuera de este. Vale «a consultar»; vale «Fotos al
  consultar». No vale un número plausible.
- **Guardar la IP de un visitante.** Ni cifrada. Solo el hash con sal del día,
  que se borra (migración 007). Una base con las IPs de quién visitó el sitio es
  exposición de los visitantes, no del negocio.
- **Apuntar un recurso a un CDN externo.** Venezuela los bloquea.
- **Poner un secreto en el repo.** Van a `/etc/margarita-renace/*.env` (600).
- **Emitir `aggregateRating`, `Review` u `Offer`** mientras haya listados de
  relleno: es marcado de reseñas fabricadas y se castiga en todo el dominio.
- **Marcar algo como hecho sin haberlo visto responder.**

---

## Cómo componer un arnés así en otro proyecto

La receta, en orden, para que sirva fuera de acá:

1. **Un solo punto de entrada que sea un mapa, no un manual.** Se carga en cada
   sesión: si crece, deja de leerse. Aquí es `CLAUDE.md`, y todo lo que dice
   apunta a otro documento.
2. **Separa las tres capas.** Qué es el negocio (`MARCA.md`, `IDENTIDAD.md`),
   cómo se construye (`PRINCIPIOS.md`), cómo opera el agente (este archivo). Se
   mezclan solas si no se separan a propósito, y entonces nadie las lee.
3. **Un documento con fecha para el estado**, distinto de los documentos de
   criterio. El criterio dura años; el estado caduca en días. Mezclarlos hace
   que se desconfíe de los dos.
4. **Deriva del sistema todo lo que se pueda derivar.** Cada lista escrita a mano
   es deuda. `lib/pendientes.ts` es el ejemplo bueno de este repositorio.
5. **Convierte cada fallo real en una regla con su historia.** Una regla sin el
   incidente que la originó se lee como burocracia y se salta; con el incidente
   se entiende y se respeta. Todas las de arriba llevan fecha y caso.
6. **Escribe el bucle de verificación como comandos que se puedan copiar.** «Hay
   que probarlo» no es una instrucción; `npx tsc --noEmit` sí lo es.
7. **Deja explícito qué es irreversible y dónde está la vuelta atrás.** Un agente
   no distingue solo entre un `DELETE` recuperable y uno que no lo es.
8. **Di qué está prohibido, no solo qué se recomienda.** Las prohibiciones cortas
   y absolutas sobreviven a la compresión del contexto; los matices, no.

Y una advertencia sobre el arnés mismo: **envejece igual que el código**. Si una
regla de acá se contradice con lo que hace el sistema, el sistema tiene razón
(regla 1) y esta página se corrige.
