# La página de enlaces (el «link en la bio»)

Añadida el 2026-08-09. Es la dirección que se pega en Instagram y TikTok, donde
solo cabe una: **margaritarenace.com.ve/enlaces**. `/links`, `/linktree` y
`/bio` redirigen ahí, porque es como la gente la nombra y la teclea.

Se edita entera desde el panel, en **/admin/enlaces**.

## Las piezas

| Pieza | Archivo | Qué hace |
|---|---|---|
| Migración | `db/migrations/009-enlaces.sql` | Tabla `enlaces`, con los cinco botones sembrados |
| Tipos | `lib/tipos-enlace.ts` | Icono, color y ayuda de cada tipo. Seguro para cliente |
| Lógica | `lib/enlaces.ts` | Consultas, resolución de la URL y CRUD. Solo servidor |
| Página | `app/enlaces/page.tsx` | La pantalla pública: retrato, frase, tira de redes y botones |
| Botones | `components/BotonesEnlaces.tsx` | Lo único con JavaScript, y solo para contar los clics |
| Panel | `app/admin/(panel)/enlaces/` | Alta, edición, orden, borrado y frase |

## Por qué no Linktree

1. **El dominio es tuyo.** La bio dice tu marca y la visita cae en tu sitio, no
   en el de un intermediario que después te la cobra.
2. **Carga en Venezuela.** Linktree trae fuentes, iconos y scripts de CDNs de
   terceros; acá no hay una sola petición a un servidor ajeno, por el mismo
   motivo por el que las fotos se bajaron a `public/images` (ver CLAUDE.md).
3. **Los clics son tuyos**, con el recolector propio: sin cookies y sin IPs.
4. Sin cuota, sin límite de enlaces y con el aspecto del sitio.

## Reglas que conviene no olvidar

- **Un enlace sin dirección SE VE IGUAL, pero no lleva a nada.** Se probó
  esconderlo —un botón que no lleva a ninguna parte es un botón roto— y la
  decisión del 2026-08-09 fue la contraria: la página se ve entera mientras se
  consiguen las direcciones, y quien no quiera enseñar uno lo apaga con
  «Visible en la página». La decisión es del panel, no del código. El que falta
  se marca en la lista y aparece en /admin/pendientes.
  Se dibuja como `<div>`, no como `<a href="">`: un enlace vacío recarga la
  página al tocarlo y los lectores de pantalla lo anuncian como enlace real.
- **WhatsApp e Instagram no guardan su URL.** Salen del número y del perfil de
  /admin/contenido, que son los mismos que encienden los botones de reservar de
  todo el sitio. Un dato en dos sitios es un dato que se queda viejo en uno.
  Si se escribe una URL propia, esa manda.
- **El slug no cambia nunca.** Los clics se cuentan por slug, así que renombrar
  el botón («Escríbenos» → «Habla con nosotros») no parte su historial en dos.
- **Se pega sin `https://` y se arregla solo.** Instagram y TikTok muestran los
  perfiles como `tiktok.com/@cuenta` y así se copian; `normalizarUrl` les pone
  el esquema. Lo que no se entiende no se guarda: el panel avisa en vez de
  aceptar algo que después desaparecería sin explicación.
- **Solo un destacado.** Al marcar uno se desmarca el anterior: dos botones con
  borde de tinta no destacan ninguno.
- **`javascript:` está prohibido en el campo URL.** Hoy solo entra la dueña,
  pero un campo de texto que termina en un `href` se valida siempre.
- **El orden se cambia con flechas, no arrastrando.** Arrastrar exige
  JavaScript y una biblioteca, y es justo lo que peor funciona en teléfono, que
  es desde donde se va a tocar esto.
- **La página va `noindex, follow`** y fuera del sitemap: quien busca la marca
  en Google debe caer en los alojamientos, no en un menú de botones. Los
  enlaces internos sí se siguen.
- **Sin pie de página.** El layout raíz lo esconde en esta ruta —la ruta se la
  pasa el middleware en la cabecera `x-ruta`—: el pie del sitio sería más largo
  que la propia página.

## La forma redonda

El sistema del sitio evita la pastilla por defecto (`globals.css` explica por
qué: 37 `rounded-full` eran parte de lo que hacía que la página anterior se
viera de plantilla). Acá se pidió circular, y se resuelve sin caer en eso: el
círculo va acompañado del borde de tinta y la sombra dura de la casa. Pastilla
con sombra dura no es el aspecto de un generador de enlaces; pastilla sola, sí.

Los iconos de WhatsApp, TikTok y Airbnb **no son los logotipos oficiales**:
Lucide —el juego de iconos del sitio— retiró las marcas por licencia. El color
de cada plataforma hace el trabajo de reconocimiento, y cada botón lleva su
nombre al lado. Si algún día se quieren los originales, se cambian en
`lib/tipos-enlace.ts` y en ningún sitio más.


## Rediseño Amanecer (2026-09-13)

Fondo `.bg-luz`, emblema nuevo en azulejo (`/logo-mark-teal.svg`) sin anillos,
«Renace» en terracota, botones con línea fina y sombra suave; el destacado
(WhatsApp) va lleno de azul profundo. Se retiró la sombra dura.

Botones actuales: **Reserva directa por WhatsApp** (destacado) · **Guía turística**
(tipo nuevo `guia`, /guia) · **Alquilar por Airbnb** · redondos Instagram y TikTok.
«Reservar con nosotros» (/) quedó apagado a pedido del dueño: en la bio no se
enlaza el inicio. Airbnb y TikTok siguen **pendientes de URL** (se ven sin enlace
hasta que se peguen en /admin/enlaces).

Pendientes que pidió el dueño y NO están hechas: correo corporativo con plantilla
de contrato/cláusulas para firma del cliente (dos features aparte).

- 2026-09-13 (noche): logotipos reales de WhatsApp, Airbnb, Instagram y TikTok
  (Simple Icons, CC0, en `lib/tipos-enlace.tsx`); botones más finos (medallón de
  40 px con el logo en su color sobre blanco, sin relleno pesado); orden: Agendar
  por WhatsApp (destacado) · Agendar con nosotros (/) · Guía · Reservar por Airbnb ·
  redondos Instagram/TikTok. Airbnb y TikTok siguen sin URL.
- «Reservar por Airbnb» ya no salta a ciegas: se despliega (Motion) un carrusel
  horizontal con los apartamentos publicados —portada, zona, nombre— y cada uno
  lleva a su anuncio (`properties.airbnb_url`, migración 018, se edita en
  Propiedades → «Enlace del anuncio en Airbnb»). Sin URL sale «Pronto en Airbnb».
  `/enlaces#airbnb` abre el carrusel directo. Los clics se cuentan como
  `airbnb:<slug>`.
- Confianza de Airbnb sin su iframe (migración 019: `airbnb_rating`,
  `airbnb_resenas`, `airbnb_detalle`, se copian a mano en Propiedades): el botón
  muestra «★ 5.0 en Airbnb · N reseñas · 4 apartamentos» antes de tocar; cada
  tarjeta del carrusel lleva la estrella, las reseñas y el resumen («2 habitaciones
  · 3 camas · 2 baños») sobre la foto. El embed oficial de Airbnb se descartó:
  script externo (se bloquea en Venezuela), 450×300 fijo, rastreo de terceros.
- **Datos originales de Airbnb, automáticos** (`lib/airbnb.ts`): se lee la
  etiqueta og:title del anuncio («Condo in Pampatar · ★5.0 · 2 bedrooms · 3 beds ·
  2 baths») y el «N reviews» del HTML, se traduce y se guarda; se refresca al
  guardar la propiedad y como mucho una vez al día al abrir /enlaces
  (`airbnb_sync_at`, migración 020). El anuncio 1553769675039954102 es **Bahía
  Mágica** (★5.0, 3 reseñas). Solo falta pegar la URL de los otros tres.
