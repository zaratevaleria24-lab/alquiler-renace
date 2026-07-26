# Datos que faltan para que el sitio sea real

Creado el 2026-07-26. **Rellena esto y yo lo cargo.**

No invento inventario. Es la misma razón que está en `SEO.md`: los 11 listados de
relleno que hay publicados —con anfitriones inventados, fotos de stock y
valoraciones que no vienen de ninguna reseña— son hoy el mayor lastre de SEO del
sitio, y en GEO es peor, porque los motores que verifican datos descubren que
esas propiedades no existen y dejan de citarlo.

Un sitio con 4 propiedades reales posiciona mejor que uno con 12 inventadas.

---

## 1. Los 4 apartamentos reales

Copia este bloque 4 veces y rellénalo. Lo que no sepas, déjalo vacío: es mejor
un campo en blanco que un dato inventado.

```
NOMBRE:            (ej. Los Geranios A)
ZONA:              (Pampatar · Porlamar · Costa Azul · Playa Parguito ·
                    Playa Caribe · Juan Griego · Playa El Yaque ·
                    Playa Guacuco · Manzanillo — o dime una nueva)
DIRECCIÓN:         (ej. Urb. Maneiro, Pampatar — sin número exacto si prefieres)
DESCRIPCIÓN:       (3-5 líneas. Qué tiene, qué hay cerca, para quién encaja)

PRECIO POR NOCHE:  (en US$, o escribe "consultar")
MÍNIMO DE NOCHES:  (ej. 2)
¿PRECIO MENSUAL?   (si aplica, cuánto — es un segmento grande en Margarita)

CAPACIDAD:         (adultos / niños)
CATEGORÍAS:        (elige de: Playa · Frente al Mar · Piscina · Vista al Mar ·
                    Centro · Familiar · Lujo · Económico)
AMENIDADES:        (lista libre: Wi-Fi, aire acondicionado, piscina, parrilla,
                    seguridad 24/7, estacionamiento, cocina equipada…)

FOTOS:             (ver abajo cómo pasármelas)
```

### Sobre las valoraciones

**No pongas una valoración si no viene de reseñas reales.** La columna acepta
vacío a propósito. Marcar valoraciones inventadas como datos estructurados se
castiga con acción manual de Google, y eso quita los resultados enriquecidos de
**todo el dominio**, no solo del listado infractor.

Cuando tengas reseñas de verdad, se agregan con su número real de opiniones.

---

## 2. Los 5 vehículos

La estructura ya está creada en la base (tabla `vehicles`). Faltan los datos:

```
MARCA Y MODELO:    (ej. Toyota Corolla)
AÑO:
TRANSMISIÓN:       (automática / sincrónica)
PUESTOS:           (ej. 5)
PUERTAS:
AIRE ACONDICIONADO: (sí / no)
COMBUSTIBLE:       (gasolina / gasoil / híbrido)
TIPO:              (sedán / SUV / hatchback / camioneta)

PRECIO POR DÍA:    (en US$, o "consultar")
MÍNIMO DE DÍAS:
DEPÓSITO/GARANTÍA: (ej. "US$100 reembolsable" — es la pregunta que todos hacen
                    y que casi ningún sitio responde antes de escribir)

DÓNDE SE ENTREGA:  (zona, y si hay entrega en el aeropuerto)
EXTRAS:            (de: aire acondicionado, Bluetooth, cámara de reversa,
                    puesto para niño, maletero amplio, GPS, kilometraje libre,
                    seguro incluido)
DESCRIPCIÓN:       (2-3 líneas)
FOTOS:
```

Dato útil que salió al investigar el mercado: **a los viajeros se les recomienda
reservar el vehículo con antelación en temporada alta**. Si en la ficha dices
claramente el depósito y el mínimo de días, resuelves la duda que hace que la
gente no escriba.

---

## 3. Cómo pasarme las fotos

Cualquiera de estas tres sirve:

1. **Súbelas al servidor** por SFTP o `scp` a
   `/root/proyectos/margarita-renace/uploads/`, en una carpeta por propiedad o
   vehículo. Yo las optimizo (a WebP, redimensionadas) y las cargo.
2. **Pásamelas por el chat** y las guardo yo.
3. **Espera al panel**: el CMS tendrá subida de fotos con optimización
   automática. Es lo más cómodo a la larga, pero tarda más en estar listo.

**Nunca enlaces una foto a un servicio externo** (Google Drive, Dropbox,
Instagram). Venezuela bloquea los CDNs de terceros: la foto simplemente no
cargaría para tu público. Todas las imágenes del sitio se sirven desde el propio
dominio, y por eso hubo que descargar las 26 que venían de Unsplash.

### Qué fotos funcionan

- **Una principal por propiedad** en horizontal, luminosa, que muestre el
  espacio y no un detalle.
- **3 a 6 más**: sala, cocina, cada habitación, baño, y la vista o la piscina si
  la hay.
- De los vehículos: tres cuartos delantero (la clásica de catálogo), interior y
  maletero.
- Con luz de día y sin filtros fuertes. Las fotos propias, incluso imperfectas,
  generan más confianza que el stock — y son las que pueden posicionar en Google
  Imágenes, cosa que una foto de Unsplash usada por mil sitios no hace.

---

## 4. Otros datos que desbloquean cosas

| Dato | Para qué | Estado |
|---|---|---|
| **WhatsApp** | El botón de contacto, y medir conversión en el dashboard | falta |
| **Correo** | Contacto y `LocalBusiness` en datos estructurados | falta |
| **Dirección física** | SEO local y Google Business Profile | falta |
| **Instagram / Facebook** | `sameAs` en datos estructurados; refuerza la identidad de la marca ante Google | falta |
| **Código de Google Search Console** | Ver qué búsquedas traen tráfico de verdad | falta |

Los tres primeros van en `CONTACT` de `lib/site.ts`, que hoy está en `null` a
propósito, y desde ahí se propagan solos al JSON-LD y al footer.

**Google Business Profile** es, de toda esta lista, lo que más mueve la aguja
para un alquiler turístico local: es lo que mete el negocio en el mapa y en el
paquete de resultados locales. No se puede hacer desde el código.
