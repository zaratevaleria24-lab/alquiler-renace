-- Un lugar puede vivir en más de una categoría (Guuao: licores de día, sitio
-- para pasar la noche). La principal sigue en `categoria`; las demás acá.
ALTER TABLE guia_lugares ADD COLUMN IF NOT EXISTS categorias_extra text[] NOT NULL DEFAULT '{}';
