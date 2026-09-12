// iCalendar (RFC 5545) mínimo: leer feeds de Airbnb y publicar el nuestro.
//
// SIN DEPENDENCIA a propósito. Las librerías de iCal (ical.js, node-ical)
// implementan el estándar completo —zonas horarias, recurrencias, alarmas— y
// los feeds de disponibilidad de Airbnb/Booking no usan nada de eso: son
// VEVENTs planos con DTSTART/DTEND de día completo, UID y SUMMARY. Parsear eso
// son ~60 líneas; la dependencia sería más código del que sustituye.
//
// Lo único no obvio del formato, y que SÍ se maneja acá:
// - El plegado de líneas: una línea larga continúa en la siguiente si esta
//   empieza con espacio o tabulador (RFC 5545 §3.1). Airbnb pliega DESCRIPTION.
// - Los parámetros de propiedad: 'DTSTART;VALUE=DATE:20260815'. El nombre va
//   antes del primer ';' o ':'.
// - Fechas en dos formas: '20260815' (día completo, lo normal en Airbnb) y
//   '20260815T140000Z' (con hora). Para disponibilidad solo importa el DÍA,
//   así que ambas se reducen a 'YYYY-MM-DD'.

export interface EventoIcal {
  uid: string;
  summary: string;
  /** Primer día ocupado, 'YYYY-MM-DD'. */
  inicio: string;
  /** Día de salida, EXCLUSIVO (esa noche ya está libre), 'YYYY-MM-DD'. */
  fin: string;
}

/** '20260815' o '20260815T140000Z' → '2026-08-15'. Null si no es una fecha. */
function comoFecha(valor: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(valor.trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Despliega las continuaciones y devuelve las líneas lógicas del .ics. */
function lineasLogicas(ics: string): string[] {
  const fisicas = ics.split(/\r\n|\n|\r/);
  const logicas: string[] = [];
  for (const linea of fisicas) {
    if ((linea.startsWith(' ') || linea.startsWith('\t')) && logicas.length) {
      logicas[logicas.length - 1] += linea.slice(1);
    } else {
      logicas.push(linea);
    }
  }
  return logicas;
}

/**
 * Eventos de un .ics. Tolerante: un VEVENT sin UID o sin fechas usables se
 * descarta en silencio en lugar de tumbar el sync completo — un feed con un
 * evento raro sigue valiendo por todos los demás.
 */
export function parseIcs(ics: string): EventoIcal[] {
  const eventos: EventoIcal[] = [];
  let actual: Partial<EventoIcal> | null = null;

  for (const linea of lineasLogicas(ics)) {
    if (linea === 'BEGIN:VEVENT') {
      actual = {};
      continue;
    }
    if (linea === 'END:VEVENT') {
      if (actual?.uid && actual.inicio && actual.fin && actual.fin > actual.inicio) {
        eventos.push({
          uid: actual.uid,
          summary: actual.summary ?? '',
          inicio: actual.inicio,
          fin: actual.fin,
        });
      }
      actual = null;
      continue;
    }
    if (!actual) continue;

    const sep = linea.indexOf(':');
    if (sep === -1) continue;
    const nombre = linea.slice(0, sep).split(';')[0].toUpperCase();
    const valor = linea.slice(sep + 1);

    switch (nombre) {
      case 'UID':
        actual.uid = valor.trim();
        break;
      case 'SUMMARY':
        // Des-escape de RFC 5545: \n, \, \; \\ (solo los que Airbnb usa).
        actual.summary = valor
          .replace(/\\n/gi, ' ')
          .replace(/\\([,;\\])/g, '$1')
          .trim();
        break;
      case 'DTSTART':
        actual.inicio = comoFecha(valor) ?? actual.inicio;
        break;
      case 'DTEND':
        actual.fin = comoFecha(valor) ?? actual.fin;
        break;
    }
  }
  return eventos;
}

// ── Exportación ──────────────────────────────────────────────────────────────

/** 'YYYY-MM-DD' → '20260815', el formato DATE de iCal. */
function comoDate(fecha: string): string {
  return fecha.replaceAll('-', '');
}

function escapar(texto: string): string {
  return texto.replace(/\\/g, '\\\\').replace(/[,;]/g, '\\$&').replace(/\n/g, '\\n');
}

/**
 * El .ics que importa Airbnb con nuestras reservas manuales.
 *
 * Sin nombres ni teléfonos: el SUMMARY que se le entrega a un tercero no
 * necesita datos del huésped, solo que esas noches están tomadas. CRLF y no
 * \n porque el RFC lo exige y hay parsers que lo toman literal.
 */
export function generarIcs(
  nombreCalendario: string,
  eventos: EventoIcal[],
): string {
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Margarita Renace//Calendario//ES',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapar(nombreCalendario)}`,
  ];
  for (const e of eventos) {
    lineas.push(
      'BEGIN:VEVENT',
      `UID:${escapar(e.uid)}`,
      `DTSTART;VALUE=DATE:${comoDate(e.inicio)}`,
      `DTEND;VALUE=DATE:${comoDate(e.fin)}`,
      `SUMMARY:${escapar(e.summary)}`,
      'END:VEVENT',
    );
  }
  lineas.push('END:VCALENDAR');
  return lineas.join('\r\n') + '\r\n';
}
