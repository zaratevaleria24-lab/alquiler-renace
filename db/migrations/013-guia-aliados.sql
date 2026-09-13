-- Aliados de la guía: negocios con los que Margarita Renace tiene trato
-- directo (Ventura, Caribest, Ketchup Hot…). Van primero en su categoría y con
-- sello «Recomendado». No es un ranking pagado: es a quien llamamos nosotros.
ALTER TABLE guia_lugares ADD COLUMN IF NOT EXISTS aliado boolean NOT NULL DEFAULT false;
