-- Contratos de hospedaje: se generan desde el panel, el huésped los firma en un
-- enlace propio (/contrato/<token>) y queda constancia de firma. Las cláusulas
-- viven en el código (lib/contratos-clausulas.ts) con número de versión; el
-- contrato guarda qué versión firmó y un hash del texto para probar que no
-- cambió después.
CREATE TABLE IF NOT EXISTS contratos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token         text NOT NULL UNIQUE,
  property_id   uuid NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  reserva_id    uuid REFERENCES reservas(id) ON DELETE SET NULL,
  huesped       text NOT NULL,
  documento     text NOT NULL DEFAULT '',   -- cédula o pasaporte (lo llena el huésped al firmar si viene vacío)
  email         text NOT NULL DEFAULT '',
  telefono      text NOT NULL DEFAULT '',
  huespedes     integer NOT NULL DEFAULT 2 CHECK (huespedes > 0),
  check_in      date NOT NULL,
  check_out     date NOT NULL CHECK (check_out > check_in),
  total_usd     numeric(10,2) NOT NULL CHECK (total_usd >= 0),
  anticipo_usd  numeric(10,2) NOT NULL DEFAULT 0 CHECK (anticipo_usd >= 0),
  deposito_usd  numeric(10,2) NOT NULL DEFAULT 0 CHECK (deposito_usd >= 0),
  notas         text NOT NULL DEFAULT '',   -- condiciones particulares, van al final del contrato
  version_clausulas text NOT NULL,
  estado        text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','enviado','firmado','anulado')),
  enviado_at    timestamptz,
  firmado_at    timestamptz,
  firma_nombre  text NOT NULL DEFAULT '',
  firma_documento text NOT NULL DEFAULT '',
  firma_imagen  text NOT NULL DEFAULT '',   -- PNG en data URL, dibujada por el huésped
  firma_hash    text NOT NULL DEFAULT '',   -- sha256 del texto firmado + fecha
  firma_agente  text NOT NULL DEFAULT '',   -- navegador (User-Agent), sin IP
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contratos_estado_idx ON contratos (estado, created_at DESC);
