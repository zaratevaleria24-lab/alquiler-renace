# En venta — inmuebles propios y prospectos de Marketplace

Creado el 2026-09-12. Sección nueva de Margarita Renace: **/en-venta** en la web y
**En venta** en el panel (`/admin/ventas`).

## La regla que ordena todo (revisada el mismo 2026-09-12)

| | Prospectos (`prospectos_venta`) | Inmuebles propios (`inmuebles_venta`) |
|---|---|---|
| De dónde salen | Scraper de Facebook Marketplace (Apify) | La dueña, a mano o "captando" un prospecto |
| Se publican en `/en-venta` | **Sí**, con precio y fotos copiadas al servidor, **con `noindex`** | Sí, indexables |
| Contacto que ve el público | **Ninguno del vendedor**: el botón escribe a Margarita Renace | WhatsApp de Margarita Renace |
| Contacto que ve el panel | Teléfono del vendedor (leído del texto) + enlace a Facebook | — |

Decisión de la dueña: lo que está en venta en la isla se muestra en la web, y
el contacto queda en el panel — el negocio es gestionar ese contacto. Lo que se
hizo para que eso no dañe el sitio:

- **`noindex, follow`** en las fichas de Marketplace: se ven y se comparten por
  WhatsApp/Instagram, pero no compiten en Google con texto y fotos de terceros.
  Tampoco entran al sitemap. Solo lo propio (captado, con fotos de la dueña) se
  indexa.
- **`textoPublico()`** quita del anuncio teléfonos, correos y enlaces antes de
  mostrarlo.
- **Las fotos se copian al servidor en el momento de la búsqueda**
  (`descargarFotosProspecto` → `/var/www/margarita-uploads/prospectos/<fb_id>/`),
  máximo 8 por anuncio. Verificado: las URLs de galería de Facebook devuelven
  403 en menos de dos horas; la de portada dura más. Si una búsqueda no se hace
  con detalle, solo se salva la portada.
- Se puede **ocultar** cualquier anuncio desde el panel («Ocultar de la web»);
  «Descartado» y «Captado» también lo sacan del listado automático.
- Slug público: título limpio + últimos 6 dígitos del id (`casa-en-venta-092457`).

## El hallazgo que hace útil el scraper

Facebook **no entrega datos del vendedor** (el campo llega vacío siempre). Pero
los vendedores los escriben en la descripción: `Ref, 45000 $ · 0424/8839740`.
`lib/ventas.ts` lee del texto: **teléfono** (formato venezolano, normalizado a
`58…` para wa.me), **precio en US$**, m², habitaciones y baños. Y de las
coordenadas exactas asigna la **zona** del sitio. Con eso cada anuncio es un
prospecto contactable con un clic ("WhatsApp 0424…").

Probado con los anuncios reales del 2026-09-12: la casa de Brisas Margarita salió
con teléfono, US$ 45.000, 72 m², 3 hab, 2 baños, zona Porlamar. Correcto.

## Costos (Apify)

- Token en **`/etc/margarita-renace/apify.env`** (600, root). Lo lee
  `lib/ventas.ts` al momento — pm2 no relee el entorno con un restart.
- Actor `apify/facebook-marketplace-scraper`: US$ 6,20 por 1.000 anuncios + cómputo.
  Con 1 GB de memoria, 6 anuncios en modo lista costaron ~US$ 0,04 y 2 en modo
  detalle ~US$ 0,04. **Siempre se usa modo detalle** (es el único que trae
  descripción, teléfono y coordenadas).
- Cuenta FREE: US$ 5/mes. El panel muestra el saldo restante y el costo estimado
  antes de cada búsqueda, y **la búsqueda solo la dispara la dueña a mano**: no
  hay cron, para que el crédito nunca se gaste sin que lo vea.
- URL de búsqueda: categoría `propertyforsale` con `latitude=10.98&longitude=-63.85&radius=40`
  (la isla entera). **No usar el slug `/marketplace/porlamar/`**: no existe y
  Facebook cae a la ubicación del proxy (California). Costó una corrida descubrirlo.

## Precio en cuatro monedas (`components/PrecioVenta.tsx`)

Se guarda **solo el precio en US$**. Bolívares, USDT y euros se calculan al vuelo
con `lib/tasas.ts` (BCV, euro BCV, Binance P2P). Matiz deliberado: en alquiler el
sitio convierte al BCV porque el huésped paga al oficial; **una casa no se vende al
BCV** (sería regalar la brecha), así que la cifra de mercado va como "lo que se
paga en bolívares" y la del BCV como referencia oficial, con la brecha visible.

## Migración y archivos

- `db/migrations/010-ventas.sql` — `prospectos_venta`, `ventas_corridas`,
  `inmuebles_venta`, `inmuebles_venta_images`. Aplicada el 2026-09-12.
- `lib/ventas.ts` — tipos, lectores de texto, Apify, consultas, precios.
- `app/admin/(panel)/ventas/` — prospectos, inmuebles (CRUD + fotos), actions.
- `app/en-venta/` — landing (con FAQ de compra y bloque "¿Vendés?") y ficha.
- `lib/schema.ts` → `ventaSchema()`: `RealEstateListing` + `Offer` (legítimo: es
  nuestro anuncio).
- Fotos de inmuebles: `/var/www/margarita-uploads/properties/venta-<slug>/`.
