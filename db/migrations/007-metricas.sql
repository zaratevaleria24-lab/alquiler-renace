-- Recolector de métricas propio (2026-08-03). Paso 5 del CMS-PLAN.
--
-- Las tablas `page_views` y `events` ya existían con `visitor_day`; acá se suma
-- lo que faltaba y, sobre todo, LA SAL.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- POR QUÉ NO SE GUARDA NINGUNA IP
--
-- Decisión del 2026-08-03, en la misma línea que descartar el registro ante el
-- Estado (ver ESTRATEGIA.md §1.1): una base con las IPs de quién visitó el sitio
-- es exposición — y no tuya, sino DE TUS VISITANTES. Si alguien la pide o
-- accede a ella, el problema es del negocio.
--
-- Y no hace falta. Para contar visitantes únicos basta
--     visitor_day = hash(IP + navegador + sal_del_día)
-- que identifica a alguien DENTRO del día sin poder saber quién es, y como la
-- sal cambia cada día, no permite seguir a nadie entre días ni queriendo.
--
-- La sal vieja se BORRA (ver la función de limpieza abajo): sin ella, los hashes
-- de días pasados dejan de poder recalcularse aunque se tenga la IP. Es lo que
-- convierte la promesa en algo comprobable.
--
-- Sin cookies, así que tampoco hace falta banner de consentimiento.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS metricas_sal (
  dia   date PRIMARY KEY,
  sal   text NOT NULL
);

COMMENT ON TABLE metricas_sal IS
  'Sal diaria para la huella de visitante. Se borran las de más de 2 días: sin la sal, los visitor_day viejos ya no se pueden recalcular.';

-- Ciudad y región, para cuando haya una base geográfica local. Hoy se llena
-- solo `country`, que Cloudflare regala en la cabecera CF-IPCountry.
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS city   text;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS region text;

-- Cuenta de visitantes únicos por día: es la consulta del dashboard.
CREATE INDEX IF NOT EXISTS page_views_visitante_idx
  ON page_views (visitor_day, created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_pais_idx
  ON page_views (country, created_at DESC);
CREATE INDEX IF NOT EXISTS events_visitante_idx
  ON events (visitor_day, created_at DESC);
