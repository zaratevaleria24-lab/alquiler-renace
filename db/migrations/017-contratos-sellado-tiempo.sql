-- Prueba de tiempo independiente de nuestro servidor:
--  · tsa_*: sello de tiempo RFC 3161 emitido por una autoridad pública (DigiCert
--    u otra) sobre la huella de la firma. Se verifica con openssl y la raíz del
--    sistema, sin depender de margaritarenace.com.ve.
--  · ots_*: anclaje en la cadena de Bitcoin vía OpenTimestamps (la prueba queda
--    «pendiente» hasta que la incluyen en un bloque, normalmente en horas).
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS tsa_token text NOT NULL DEFAULT '',      -- .tsr en base64
  ADD COLUMN IF NOT EXISTS tsa_autoridad text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tsa_hora timestamptz,
  ADD COLUMN IF NOT EXISTS ots_prueba text NOT NULL DEFAULT '',     -- .ots en base64
  ADD COLUMN IF NOT EXISTS ots_estado text NOT NULL DEFAULT '',     -- '', pendiente, anclado
  ADD COLUMN IF NOT EXISTS ots_intento_at timestamptz;
