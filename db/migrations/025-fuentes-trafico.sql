-- De dónde llega la gente (2026-09-14).
--
-- EL PROBLEMA QUE RESUELVE: el medidor mandaba solo `window.location.pathname`,
-- sin la parte de la URL que trae los parámetros. Justo ahí viaja lo único que
-- distingue al visitante que vino del enlace de Instagram (?utm_source=ig) o
-- del QR del apartamento (?desde=qr). Se perdía en el navegador y nunca llegaba
-- a la base: el panel solo podía enseñar `referrer_host`, que en la app de
-- Instagram viene vacío la mayoría de las veces. La pregunta de negocio —«¿el
-- link de la bio trae gente?»— no tenía respuesta.
--
-- POR QUÉ UNA COLUMNA Y NO GUARDAR LA URL ENTERA: la URL completa puede llevar
-- cualquier cosa pegada por quien comparte el enlace. Se clasifica en el
-- servidor y se guarda SOLO la etiqueta resultante ('instagram', 'qr',
-- 'google', 'directo'…), que es lo que el panel necesita. Misma línea que
-- guardar el host de procedencia y no el referrer completo (ver migración 007).
--
-- CÓMO SE LEE EN EL PANEL: la fuente se atribuye por la PRIMERA visita de cada
-- visitante del día. Al navegar dentro del sitio la procedencia se vuelve el
-- propio dominio y contaría como «directo», que taparía a la fuente real.

ALTER TABLE page_views ADD COLUMN IF NOT EXISTS fuente text;

COMMENT ON COLUMN page_views.fuente IS
  'De dónde llegó la visita: utm_source, ?desde=qr o el host de procedencia, ya clasificado. Nunca la URL completa.';

-- El panel agrupa por fuente dentro de una ventana de tiempo.
CREATE INDEX IF NOT EXISTS page_views_fuente_idx
  ON page_views (fuente, created_at DESC);

-- Las filas viejas no tienen cómo saberlo: quedan en NULL y el panel las cuenta
-- aparte como «sin registrar», en vez de inventarles un origen.
