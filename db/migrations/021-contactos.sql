-- CRM propio: quien deja su correo en el cupón de bienvenida (o en el futuro,
-- en el formulario de reserva) queda aquí, con su código de descuento y su
-- consentimiento para recibir correos. Sirve para email marketing desde el
-- panel y para saber de dónde vino cada contacto.
CREATE TABLE IF NOT EXISTS contactos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        text NOT NULL DEFAULT '',
  email         text NOT NULL,
  telefono      text NOT NULL DEFAULT '',
  cupon         text NOT NULL UNIQUE,
  descuento_pct integer NOT NULL DEFAULT 5,
  origen        text NOT NULL DEFAULT 'popup',      -- popup, reservas, contrato…
  pagina        text NOT NULL DEFAULT '',           -- ruta donde se registró
  utm           jsonb NOT NULL DEFAULT '{}',        -- utm_source/medium/campaign si venía de un anuncio
  consentimiento boolean NOT NULL DEFAULT true,     -- acepta correos nuestros
  correo_enviado_at timestamptz,
  cupon_usado_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS contactos_email_idx ON contactos (lower(email));
GRANT SELECT, INSERT, UPDATE, DELETE ON contactos TO margarita_app;
