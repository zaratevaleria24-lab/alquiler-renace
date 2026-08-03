-- Caché de tasas de cambio (2026-08-03).
--
-- POR QUÉ HACE FALTA: el negocio cobra en dólares y el cliente paga en
-- bolívares. Sin la tasa del día a mano, cada conversación de WhatsApp obliga a
-- ir a buscarla afuera. Es la herramienta que la dueña abriría todos los días.
--
-- POR QUÉ CACHÉ EN POSTGRES Y NO UN DEMONIO QUE CONSULTA CADA MINUTO:
-- Siberia sí tiene un proceso Rust que sondea sin parar, porque su producto ES
-- el gráfico en vivo minuto a minuto. Acá no: el panel se abre unas veces al día
-- y a un alquiler no le cambia nada que la tasa tenga tres minutos. Con caché en
-- base se consulta A DEMANDA y solo si lo guardado está viejo — sin sumar un
-- proceso más a un servidor de 3.7GB con tres productos.
--
-- Una fila por fuente, sobrescrita en cada refresco. No se guarda histórico: el
-- histórico de tasas es el producto de Siberia (ver su history.jsonl), y
-- duplicarlo acá sería tener dos versiones de la misma verdad.
CREATE TABLE IF NOT EXISTS tasas (
  -- 'bcv_usd', 'bcv_eur', 'binance', 'binance_pm', 'paralelo'
  fuente      text PRIMARY KEY,
  -- Bolívares por una unidad de esa moneda.
  valor       numeric(18,6) NOT NULL CHECK (valor > 0),
  -- Cuándo lo dijo la FUENTE (el BCV publica una vez al día).
  fuente_at   timestamptz,
  -- Cuándo lo trajimos nosotros. Es lo que decide si el caché está vencido, y
  -- lo que se le muestra al usuario: una tasa sin hora no es un dato, es un
  -- rumor.
  obtenido_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE tasas IS
  'Caché de tasas VES. Se refresca a demanda desde lib/tasas.ts. Sin histórico: eso es Siberia.';
