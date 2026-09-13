-- El CRM también guarda aliados (negocios de la red) y no solo huéspedes.
ALTER TABLE contactos
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'huesped' CHECK (tipo IN ('huesped','aliado','prospecto')),
  ADD COLUMN IF NOT EXISTS comercio text NOT NULL DEFAULT '',   -- nombre del negocio (aliados)
  ADD COLUMN IF NOT EXISTS notas text NOT NULL DEFAULT '';
GRANT SELECT, INSERT, UPDATE, DELETE ON contactos TO margarita_app;
