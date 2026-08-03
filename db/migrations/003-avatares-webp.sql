-- Avatares de anfitrión: .jpg → .webp
--
-- Encontrado el 2026-08-03 revisando la consola del navegador en una página de
-- propiedad: /images/photo-1507003211169.jpg devolvía 404. Los 11 anfitriones
-- de relleno tenían la ruta en .jpg, pero en disco solo existen los .webp.
--
-- POR QUÉ PASÓ: las 26 imágenes se convirtieron a WebP el 2026-07-26 y las
-- referencias se reescribieron en lib/listings.ts y en db/seed.sql —que sí dice
-- .webp—, pero la base ya se había cargado con las rutas viejas. El seed usa
-- ON CONFLICT (name) DO NOTHING, así que volver a correrlo no las corrigió: el
-- anfitrión ya existía y la fila se saltaba en silencio.
--
-- Se hace por sufijo y no host por host para que valga también si aparece otra
-- ruta rezagada. No toca /logo-avatar.png, que es un PNG de verdad.
UPDATE hosts
SET avatar_path = regexp_replace(avatar_path, '\.jpg$', '.webp')
WHERE avatar_path LIKE '/images/%.jpg';
