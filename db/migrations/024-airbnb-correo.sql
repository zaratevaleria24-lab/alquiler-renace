-- Buzón de Airbnb como fuente de eventos (ver AIRBNB-CORREO.md).
-- Cada correo que Cloudflare reenvía al webhook queda guardado crudo, se
-- entienda o no: si Airbnb cambia el formato, el dato no se pierde y se
-- reprocesa después. Las reservas que nacen de un correo llevan origen
-- 'airbnb-correo' y desaparecen cuando el iCal trae la misma estadía.
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_origen_check;
ALTER TABLE reservas ADD CONSTRAINT reservas_origen_check
  CHECK (origen IN ('manual', 'ical', 'airbnb-correo'));

CREATE TABLE IF NOT EXISTS airbnb_eventos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recibido_at  timestamptz NOT NULL DEFAULT now(),
  remitente    text NOT NULL DEFAULT '',
  destinatario text NOT NULL DEFAULT '',
  asunto       text NOT NULL DEFAULT '',
  tipo         text NOT NULL DEFAULT 'otro',   -- confirmada | solicitud | cancelada | cambio | llegada | resena | mensaje | pago | verificacion | otro
  codigo       text,                            -- código de confirmación HM…
  property_id  uuid REFERENCES properties(id) ON DELETE SET NULL,
  huesped      text NOT NULL DEFAULT '',
  check_in     date,
  check_out    date,
  crudo        text NOT NULL,                   -- el correo completo (RFC 822)
  resultado    text NOT NULL DEFAULT '',        -- qué se hizo con él
  error        text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS airbnb_eventos_recibido ON airbnb_eventos (recibido_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON airbnb_eventos TO margarita_app;
