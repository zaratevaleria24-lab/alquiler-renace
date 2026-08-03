-- Contenido editable del sitio (2026-08-03).
--
-- Hasta ahora la foto del hero, los textos de portada y los datos de contacto
-- vivían en el CÓDIGO: la foto como una ruta fija en app/HomeClient.tsx y el
-- contacto en la constante CONTACT de lib/site.ts, con todo en null. Cambiar el
-- número de WhatsApp exigía editar TypeScript, compilar y reiniciar — es decir,
-- me necesitaba a mí. Eso no es un CMS.
--
-- FORMA: clave/valor y no una columna por dato. La lista de "cosas de la
-- página" va a crecer (mañana el logo, un aviso de temporada, el enlace de
-- Instagram) y con clave/valor eso no cuesta una migración cada vez. Los
-- valores por defecto y los tipos NO viven acá sino en lib/settings.ts, que es
-- quien sabe qué significa cada clave; la base solo guarda texto.
--
-- Sin fila = usar el valor por defecto del código. Así el sitio nunca queda
-- vacío por una clave que falte, y borrar una fila es volver al original.
CREATE TABLE IF NOT EXISTS site_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE site_settings IS
  'Contenido del sitio editable desde /admin/contenido. Claves definidas en lib/settings.ts.';
