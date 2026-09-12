-- Calendario de reservas y sincronización iCal (2026-08-03).
--
-- POR QUÉ EXISTE: las reservas reales viven hoy en la cabeza de la dueña y en
-- el calendario de Airbnb. Sin una fuente única, la web no puede mostrar
-- disponibilidad y el panel no puede decir "cómo vamos este mes". Estas tablas
-- son esa fuente única.
--
-- CÓMO SE HABLA CON AIRBNB: por iCal, en las dos direcciones. Airbnb publica
-- por listado una URL .ics de solo lectura (Calendario → Disponibilidad →
-- Conectar otro sitio web) que acá se importa; y acepta importar una URL
-- nuestra, que exporta las reservas manuales (/api/ical/<token>). No hay API
-- oficial de Airbnb para anfitriones sueltos — iCal es el mecanismo que ellos
-- mismos ofrecen. El mismo esquema sirve para Booking u otro canal: una fila
-- más en ical_feeds, ninguna tabla nueva.
--
-- LA SINCRONIZACIÓN ES A DEMANDA, no un demonio (mismo razonamiento que la
-- migración 005 de tasas): se refresca al abrir el calendario del panel o al
-- consultar disponibilidad pública, solo si lo guardado está viejo. Ver
-- lib/calendario.ts.

-- ── Fuentes iCal por propiedad ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ical_feeds (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  -- 'Airbnb', 'Booking'… Etiqueta para la dueña, no una clave del sistema.
  nombre       text NOT NULL DEFAULT 'Airbnb',
  url          text NOT NULL,
  activo       boolean NOT NULL DEFAULT true,
  -- Estado del último intento, para que el panel diga la verdad: una fuente
  -- que lleva tres días fallando es un aviso, no un detalle interno.
  sync_at      timestamptz,
  sync_ok      boolean,
  sync_error   text NOT NULL DEFAULT '',
  sync_eventos int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, url)
);

-- ── Reservas y bloqueos ─────────────────────────────────────────────────────
-- Una fila por estadía, manual o importada. check_out es EXCLUSIVO (la noche
-- del check_out ya no está ocupada), que es la convención de iCal y la de
-- Airbnb: así los rangos se comparan sin sumar ni restar días en cada consulta.

CREATE TABLE IF NOT EXISTS reservas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  -- 'manual' = creada en el panel. 'ical' = importada de un feed; el panel la
  -- muestra pero NO la edita: su dueño es Airbnb y el próximo sync la repondría.
  origen       text NOT NULL DEFAULT 'manual' CHECK (origen IN ('manual','ical')),
  -- 'bloqueo' = fechas cerradas sin huésped (mantenimiento, uso propio).
  tipo         text NOT NULL DEFAULT 'reserva' CHECK (tipo IN ('reserva','bloqueo')),
  -- 'tentativa' = apalabrada por WhatsApp sin confirmar. Para el público
  -- también bloquea (mostrar libre lo apalabrado invita al doble alquiler);
  -- la distinción es para la dueña.
  estado       text NOT NULL DEFAULT 'confirmada' CHECK (estado IN ('confirmada','tentativa')),

  huesped      text NOT NULL DEFAULT '',
  telefono     text NOT NULL DEFAULT '',
  notas        text NOT NULL DEFAULT '',
  -- NULL = calcular noches × price_per_night. Se guarda solo si la dueña pactó
  -- otro monto; así el ingreso del mes sale de lo pactado, no de una tarifa
  -- que quizás cambió después.
  total_usd    numeric(10,2) CHECK (total_usd IS NULL OR total_usd >= 0),

  check_in     date NOT NULL,
  check_out    date NOT NULL,
  CHECK (check_out > check_in),

  -- Solo en filas importadas: de qué feed vino y con qué UID, para reponer sin
  -- duplicar y borrar lo cancelado. ON DELETE CASCADE: quitar el feed limpia
  -- sus reservas importadas (las manuales tienen feed_id NULL y no se tocan).
  feed_id      uuid REFERENCES ical_feeds(id) ON DELETE CASCADE,
  ical_uid     text,
  -- El SUMMARY del evento ('Reserved', 'Airbnb (Not available)'…), tal cual,
  -- para depurar sin ir a buscar el .ics.
  ical_summary text NOT NULL DEFAULT '',

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- El upsert del sync ancla en (feed, uid). Parcial: las manuales no traen uid.
CREATE UNIQUE INDEX IF NOT EXISTS reservas_feed_uid
  ON reservas(feed_id, ical_uid) WHERE ical_uid IS NOT NULL;

-- Toda consulta del calendario es "reservas de X que tocan el rango [a, b)".
CREATE INDEX IF NOT EXISTS reservas_prop_fechas
  ON reservas(property_id, check_in, check_out);

DROP TRIGGER IF EXISTS reservas_touch ON reservas;
CREATE TRIGGER reservas_touch BEFORE UPDATE ON reservas
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── Token de exportación por propiedad ──────────────────────────────────────
-- La URL /api/ical/<token> que se le da a Airbnb lleva un secreto por
-- propiedad: el calendario de ocupación no es público en crudo (los rangos sí
-- se sirven al widget, pero agregados y sin distinguir origen ni estado).

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS ical_token text UNIQUE NOT NULL
  DEFAULT encode(gen_random_bytes(16), 'hex');
