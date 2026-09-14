# Principios de ingeniería — el arnés para decidir bien siempre

> `IDENTIDAD.md` dice quiénes somos y cómo hablamos. Este archivo dice **cómo
> construimos**. Antes de publicar cualquier cambio en Margarita Renace, se pasa
> por esta lista. Si algo no la cumple, no sale. Escrito el 2026-09-13 a pedido
> de la dueña («un arnés para siempre tomar las mejores decisiones»).
>
> Son tres capas y conviene no mezclarlas: `MARCA.md` e `IDENTIDAD.md` son el
> negocio, este archivo es la ingeniería, y **`AGENTES.md` es cómo opera un
> agente** —cómo verifica, qué hace antes de algo irreversible, cuándo puede
> decir que terminó—. El estado del día, con fecha, está en `ESTADO.md`.

## 1. Se mide antes de opinar
- Cada cambio visual se mira en **captura real** (Chrome headless del servidor,
  390 px y 1440 px) antes de darlo por bueno. No se juzga diseño con `grep`.
- «Se siente lento» se convierte en números: TTFB, KB de HTML, KB de imágenes de
  la primera pantalla, cantidad de peticiones. Ejemplo: la guía pesaba 16 MB de
  fotos de tarjeta (276 KB cada una) → miniaturas de 480 px (~30 KB).

## 2. Presupuesto de rendimiento (para conexión venezolana)
- Primera pantalla ≤ **1 MB** total. Imagen de tarjeta ≤ **60 KB**; de galería ≤ 300 KB.
- TTFB ≤ 300 ms: las consultas públicas van con `unstable_cache` etiquetada y el
  panel las invalida (`revalidateTag`). Una consulta de tasas por página, no una por tarjeta.
- Nada que no se vea se carga: `loading="lazy"`, `content-visibility:auto`, el
  mapa de Google solo al tocar «Ver en el mapa».
- Cero CDNs externos (Venezuela los bloquea): fotos, fuentes y scripts se sirven
  desde nuestro dominio. Lo de Google va por proxy propio.

## 3. Fluidez
- Listados largos (`/en-venta`, `/guia`): **scroll nativo, sin Lenis**. Panel de
  filtros `sticky` con `self-start`, sin scroll interno.
- Filtrar es instantáneo: en cliente si los datos ya están en la página
  (`FiltroGuia`), o con navegación de cliente sin mover el scroll (`FiltrosFluidos`).
- Paginación = scroll infinito con enlace de respaldo sin JavaScript.
- Efectos sutiles: fundidos de 300–700 ms, `prefers-reduced-motion` respetado.
  Nada que se mueva solo mientras se lee.

## 4. Datos y derechos
- Texto propio siempre; contenido de terceros marcado y con `noindex`.
- Google Places: `place_id` para siempre, el resto ≤30 días (refrescar), fotos
  nunca guardadas (proxy). Wikimedia: solo licencias libres, con crédito,
  **revisadas a ojo** (la búsqueda por nombre se equivoca). Instagram: nunca se
  republican fotos; sirve para descubrir y enlazar.
- Nada inventado: ni precios, ni reseñas, ni inventario. «A consultar» antes que un número falso.

## 5. Sin romper lo que anda
- `npx tsc --noEmit` antes de compilar; compilar antes de reiniciar; verificar
  con `curl` las rutas tocadas y las 3 páginas más importantes después.
- Migraciones numeradas e idempotentes; secretos en `/etc/margarita-renace/*.env`
  (600), jamás en el repo. Commit con explicación del **por qué**, y push.
- Una sola fuente de verdad por cosa: tokens en `globals.css`, contacto en
  `site_settings`, textos de la guía en la base.

## 6. Cómo decidir cuando hay dudas
1. ¿Lo pidió la dueña con esas palabras? → sus palabras ganan.
2. ¿Encaja con `IDENTIDAD.md`? → si no, se reescribe.
3. ¿Cumple el presupuesto de rendimiento? → si no, se optimiza antes.
4. ¿Se puede medir? → se mide y se muestra el número.
5. ¿Es reversible? → si no, se pregunta antes.

## Lista rápida antes de publicar
- [ ] tsc limpio · build OK · pm2 online
- [ ] captura móvil + escritorio revisadas
- [ ] TTFB y peso de la primera pantalla dentro del presupuesto
- [ ] textos con la voz de IDENTIDAD.md
- [ ] fuentes/licencias en orden, nada inventado
- [ ] commit + push · doc del módulo actualizada · memoria del proyecto al día
