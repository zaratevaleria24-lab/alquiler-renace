-- De dónde salió cada tasa (2026-08-03).
--
-- POR QUÉ: el origen se devolvía solo en la misma petición que hacía la
-- consulta, así que la pantalla lo perdía en el siguiente render —cuando el
-- caché ya estaba fresco— y nunca llegaba a avisar "esto vino por consulta
-- directa porque Siberia no respondió". Guardándolo con el dato, el aviso vale
-- mientras el dato valga.
--
-- Detectado probando el respaldo con el puerto de Siberia apuntando a la nada:
-- el respaldo funcionaba pero la pantalla seguía diciendo que venía de Siberia.
ALTER TABLE tasas
  ADD COLUMN IF NOT EXISTS origen text NOT NULL DEFAULT 'apis'
    CHECK (origen IN ('siberia', 'apis'));

COMMENT ON COLUMN tasas.origen IS
  'siberia = tomado del histórico del otro producto por localhost; apis = consulta directa de respaldo.';
