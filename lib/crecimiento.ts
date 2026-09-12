// Serie mensual del negocio, para la pantalla de crecimiento. SOLO SERVIDOR.
//
// PARA QUÉ EXISTE: enseñarle la trayectoria a un inversionista. La pregunta
// que responde no es "cómo va este mes" (eso es el calendario) sino "cómo ha
// venido creciendo mes a mes" — ingresos, noches, estadías y ocupación.
//
// DE DÓNDE SALEN LOS DATOS: de la tabla `reservas`, la misma del calendario.
// El histórico importado (Notion, planillas) entra ahí como reservas manuales
// con su monto pactado, y estas consultas no distinguen: una noche vendida es
// una noche vendida, la haya traído Airbnb, WhatsApp o una importación.
//
// Las estadías que cruzan de mes se PRORRATEAN por noches (una quincena que
// empieza el 25 reparte sus noches y su plata entre los dos meses): sin eso,
// el mes del check-in se infla y el siguiente aparece muerto.

import { rows } from './db';

export interface MesCrecimiento {
  /** 'YYYY-MM'. */
  mes: string;
  ingresoUsd: number;
  noches: number;
  estadias: number;
  /** 0–100. Contra el inventario real ACTUAL: ver nota en la pantalla. */
  ocupacionPct: number;
}

export interface Crecimiento {
  meses: MesCrecimiento[];
  /** Total de los últimos 12 meses. */
  ingreso12m: number;
  noches12m: number;
  estadias12m: number;
  ocupacion12mPct: number;
  /** Variación % de ingresos vs los 12 meses anteriores. Null si no hay historia. */
  variacionInteranual: number | null;
  propiedadesReales: number;
}

/**
 * La serie completa, un punto por mes desde la primera reserva registrada
 * (tope: 36 meses, más que eso no cabe en una gráfica legible) hasta hoy.
 * Meses sin actividad salen en cero — un hueco en la serie es información,
 * no un dato que ocultar.
 */
export async function getCrecimiento(): Promise<Crecimiento> {
  const serie = await rows<{
    mes: string;
    ingreso: string | null;
    noches: string | null;
    estadias: string;
    dias_mes: number;
  }>(`
    WITH props AS (
      SELECT id, price_per_night FROM properties WHERE is_real
    ),
    rango AS (
      SELECT GREATEST(
               date_trunc('month', COALESCE(
                 (SELECT min(r.check_in) FROM reservas r JOIN props p ON p.id = r.property_id),
                 CURRENT_DATE)),
               date_trunc('month', CURRENT_DATE) - interval '35 months'
             ) AS inicio
    ),
    meses AS (
      SELECT d::date AS mes, (d + interval '1 month')::date AS fin
      FROM rango, generate_series(rango.inicio, date_trunc('month', CURRENT_DATE), interval '1 month') d
    )
    SELECT
      to_char(m.mes, 'YYYY-MM') AS mes,
      (m.fin - m.mes) AS dias_mes,
      sum(LEAST(r.check_out, m.fin) - GREATEST(r.check_in, m.mes)) AS noches,
      sum(
        CASE WHEN r.total_usd IS NOT NULL
             THEN r.total_usd * (LEAST(r.check_out, m.fin) - GREATEST(r.check_in, m.mes))
                  / (r.check_out - r.check_in)
             ELSE p.price_per_night * (LEAST(r.check_out, m.fin) - GREATEST(r.check_in, m.mes))
        END
      ) AS ingreso,
      count(*) FILTER (WHERE r.check_in >= m.mes AND r.check_in < m.fin) AS estadias
    FROM meses m
    LEFT JOIN reservas r
      ON r.tipo = 'reserva'
     AND r.check_in < m.fin AND r.check_out > m.mes
     AND r.property_id IN (SELECT id FROM props)
    LEFT JOIN props p ON p.id = r.property_id
    GROUP BY m.mes, m.fin
    ORDER BY m.mes
  `);

  const [{ n: propiedadesReales }] = await rows<{ n: string }>(
    `SELECT count(*) AS n FROM properties WHERE is_real`,
  );
  const nProps = Number(propiedadesReales);

  const meses: MesCrecimiento[] = serie.map((r) => {
    const noches = Number(r.noches ?? 0);
    const capacidad = r.dias_mes * Math.max(1, nProps);
    return {
      mes: r.mes,
      ingresoUsd: Math.round(Number(r.ingreso ?? 0)),
      noches,
      estadias: Number(r.estadias),
      ocupacionPct: Math.round((noches / capacidad) * 100),
    };
  });

  const ult12 = meses.slice(-12);
  const prev12 = meses.slice(-24, -12);
  const suma = (xs: MesCrecimiento[], f: (m: MesCrecimiento) => number) =>
    xs.reduce((s, m) => s + f(m), 0);

  const ingreso12m = suma(ult12, (m) => m.ingresoUsd);
  const ingresoPrev = suma(prev12, (m) => m.ingresoUsd);

  return {
    meses,
    ingreso12m,
    noches12m: suma(ult12, (m) => m.noches),
    estadias12m: suma(ult12, (m) => m.estadias),
    ocupacion12mPct: ult12.length
      ? Math.round(suma(ult12, (m) => m.ocupacionPct) / ult12.length)
      : 0,
    // Solo si los 12 meses previos existen COMPLETOS y con actividad: comparar
    // contra un año a medio registrar daría un crecimiento inventado.
    variacionInteranual:
      prev12.length === 12 && ingresoPrev > 0
        ? Math.round(((ingreso12m - ingresoPrev) / ingresoPrev) * 100)
        : null,
    propiedadesReales: nProps,
  };
}
