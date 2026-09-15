-- Las fotos subidas pasan a servirse desde el bucket (2026-09-15).
--
-- QUÉ CAMBIA: las filas que guardaban la ruta relativa `/uploads/…` pasan a
-- guardar la URL completa `https://media.margaritarenace.com.ve/…`. Los 353
-- archivos ya se subieron al bucket conservando la misma ruta como clave, así
-- que la correspondencia es exacta: solo cambia el prefijo.
--
-- POR QUÉ UN DOMINIO NUESTRO Y NO LA URL QUE DA R2: Venezuela bloquea los
-- dominios de CDN ajenos. En julio las fotos estaban en Unsplash y no cargaban
-- para el público del sitio; por eso se autohospedaron las 26. Un subdominio
-- propio detrás de Cloudflare no tiene ese problema — es el mismo camino por el
-- que ya llega margaritarenace.com.ve. Ver lib/r2.ts.
--
-- LOS ARCHIVOS SIGUEN EN DISCO. No se borran: son lo que recoge el respaldo
-- nocturno (`uploads-*.tar.gz`) y la única copia bajo nuestro control. nginx
-- sigue sirviendo /uploads/*, así que revertir esta migración es cambiar el
-- prefijo de vuelta y nada más.

BEGIN;

UPDATE property_images
   SET path = replace(path, '/uploads/', 'https://media.margaritarenace.com.ve/')
 WHERE path LIKE '/uploads/%';

UPDATE site_settings
   SET value = replace(value, '/uploads/', 'https://media.margaritarenace.com.ve/')
 WHERE value LIKE '/uploads/%';

UPDATE inmuebles_venta_images
   SET path = replace(path, '/uploads/', 'https://media.margaritarenace.com.ve/')
 WHERE path LIKE '/uploads/%';

UPDATE vehicle_images
   SET path = replace(path, '/uploads/', 'https://media.margaritarenace.com.ve/')
 WHERE path LIKE '/uploads/%';

-- La guía guarda un array de objetos {path, alt, credito, licencia, fuente}:
-- se reescribe el texto del jsonb entero y se vuelve a convertir. Es seguro
-- porque «/uploads/» no aparece en ningún otro campo de ese objeto.
UPDATE guia_lugares
   SET fotos = replace(fotos::text, '/uploads/', 'https://media.margaritarenace.com.ve/')::jsonb
 WHERE fotos::text LIKE '%/uploads/%';

-- Los prospectos guardan un text[] con las rutas.
UPDATE prospectos_venta
   SET fotos_locales = (
         SELECT array_agg(replace(f, '/uploads/', 'https://media.margaritarenace.com.ve/')
                          ORDER BY orden)
         FROM unnest(fotos_locales) WITH ORDINALITY AS t(f, orden)
       )
 WHERE array_to_string(fotos_locales, ',') LIKE '%/uploads/%';

COMMIT;
