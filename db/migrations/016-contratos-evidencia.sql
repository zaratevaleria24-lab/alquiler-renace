-- Contratos «nivel DocuSign»: detalle de pago (tarifa, limpieza, tasa de
-- referencia), integrantes del grupo, huella del documento, código de
-- verificación por correo, evidencia de la firma y sello del servidor, más una
-- bitácora de eventos para peritaje.
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS integrantes jsonb NOT NULL DEFAULT '[]',        -- [{nombre, documento}]
  ADD COLUMN IF NOT EXISTS tarifa_noche numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS limpieza_usd numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tasa_bs numeric(12,4),                          -- Bs por US$ al crear (referencia)
  ADD COLUMN IF NOT EXISTS tasa_fuente text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS metodo_pago text NOT NULL DEFAULT 'Zelle / Binance (USDT) / Pago Móvil / Efectivo',
  ADD COLUMN IF NOT EXISTS doc_hash text NOT NULL DEFAULT '',              -- sha256 del texto del contrato al enviarse
  ADD COLUMN IF NOT EXISTS codigo text NOT NULL DEFAULT '',                -- OTP por correo (6 dígitos)
  ADD COLUMN IF NOT EXISTS codigo_expira timestamptz,
  ADD COLUMN IF NOT EXISTS codigo_verificado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS abierto_at timestamptz,                         -- primera apertura del enlace
  ADD COLUMN IF NOT EXISTS evidencia jsonb NOT NULL DEFAULT '{}',          -- ip, agente, idioma, zona horaria, pantalla, hash de la imagen…
  ADD COLUMN IF NOT EXISTS sello text NOT NULL DEFAULT '',                 -- firma Ed25519 del servidor sobre firma_hash
  ADD COLUMN IF NOT EXISTS sello_clave text NOT NULL DEFAULT '';           -- clave pública (PEM) con la que se verifica

CREATE TABLE IF NOT EXISTS contratos_eventos (
  id          bigserial PRIMARY KEY,
  contrato_id uuid NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  tipo        text NOT NULL,   -- creado, enviado_correo, enviado_whatsapp, enlace_copiado, abierto, codigo_enviado, codigo_verificado, firmado, anulado, copia_enviada
  at          timestamptz NOT NULL DEFAULT now(),
  datos       jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS contratos_eventos_idx ON contratos_eventos (contrato_id, at);
