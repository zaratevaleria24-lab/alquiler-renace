// Correos de Airbnb como fuente de eventos. SOLO SERVIDOR. Ver AIRBNB-CORREO.md.
//
// LA REGLA: el correo dispara, el iCal confirma. De cada correo se guarda el
// crudo en airbnb_eventos (siempre), se clasifica por asunto, se sacan código
// HM…, apartamento (por el ID del anuncio en los enlaces /rooms/<id>, que ya
// tenemos en properties.airbnb_url), fechas y nombre. Con eso:
//   - reserva confirmada → bloqueo inmediato con origen 'airbnb-correo'
//   - cancelación → se libera lo que ese código había bloqueado
//   - cualquier correo → se fuerza la sincronización iCal, que es la verdad
// Si algo no se entiende, no pasa nada grave: el iCal llega igual en minutos.
//
// Los correos de Airbnb son MIME multipart (texto plano + HTML) codificados en
// quoted-printable o base64. Acá se decodifica lo mínimo para leerlos, sin
// dependencias: no hace falta un parser MIME completo para sacar cuatro datos.

import { query, rows } from './db';
import { sincronizarFeeds } from './calendario';

export type TipoEvento =
  | 'confirmada' | 'solicitud' | 'cancelada' | 'cambio' | 'llegada'
  | 'resena' | 'mensaje' | 'pago' | 'verificacion' | 'otro';

export interface CorreoLeido {
  remitente: string;
  destinatario: string;
  asunto: string;
  texto: string;
}

export interface EventoAirbnb {
  tipo: TipoEvento;
  codigo: string | null;
  anuncioId: string | null;
  huesped: string;
  checkIn: string | null;
  checkOut: string | null;
}

// ── Lectura MIME mínima ──────────────────────────────────────────────────────

function decodificarQP(s: string): string {
  const bytes = s.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  try { return Buffer.from(bytes, 'latin1').toString('utf8'); } catch { return bytes; }
}

function decodificarCabecera(s: string): string {
  // =?UTF-8?Q?...?= y =?UTF-8?B?...?= (RFC 2047), que Airbnb usa en el asunto.
  return s.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, _cs, tipo, dato) => {
    if (/b/i.test(tipo)) return Buffer.from(dato, 'base64').toString('utf8');
    return decodificarQP(dato.replace(/_/g, ' '));
  }).trim();
}

function sinHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/tr>|<\/li>|<\/h\d>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

interface Parte { cabeceras: Record<string, string>; cuerpo: string }

function separar(crudo: string): Parte {
  const idx = crudo.search(/\r?\n\r?\n/);
  const cab = idx === -1 ? crudo : crudo.slice(0, idx);
  const cuerpo = idx === -1 ? '' : crudo.slice(idx).replace(/^\r?\n\r?\n/, '');
  const cabeceras: Record<string, string> = {};
  for (const linea of cab.replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/)) {
    const m = /^([^:]+):\s*(.*)$/.exec(linea);
    if (m) cabeceras[m[1].toLowerCase()] = m[2];
  }
  return { cabeceras, cuerpo };
}

function decodificarCuerpo(p: Parte): string {
  const enc = (p.cabeceras['content-transfer-encoding'] || '').toLowerCase();
  if (enc.includes('base64')) { try { return Buffer.from(p.cuerpo.replace(/\s+/g, ''), 'base64').toString('utf8'); } catch { return p.cuerpo; } }
  if (enc.includes('quoted-printable')) return decodificarQP(p.cuerpo);
  return p.cuerpo;
}

/** Texto legible de todas las partes: texto plano primero, HTML sin etiquetas y mensajes adjuntos (reenvíos). */
function textoDe(p: Parte, profundidad = 0): string {
  const tipo = (p.cabeceras['content-type'] || 'text/plain').toLowerCase();
  const boundary = /boundary="?([^";\s]+)"?/i.exec(tipo)?.[1];
  if (tipo.startsWith('multipart/') && boundary && profundidad < 6) {
    const trozos = p.cuerpo.split(new RegExp(`\\r?\\n?--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:--)?\\s*?(?:\\r?\\n|$)`));
    const textos = trozos.filter((t) => t.trim()).map((t) => textoDe(separar(t), profundidad + 1)).filter(Boolean);
    // En multipart/alternative el texto plano y el HTML dicen lo mismo: con
    // uno basta, y el plano es más fácil de leer. En mixed van todos.
    return tipo.includes('alternative') ? (textos[0] ?? '') : textos.join('\n');
  }
  if (tipo.startsWith('message/rfc822') && profundidad < 6) {
    const interno = separar(p.cuerpo);
    const asunto = decodificarCabecera(interno.cabeceras.subject || '');
    return `${asunto}\n${textoDe(interno, profundidad + 1)}`;
  }
  const cuerpo = decodificarCuerpo(p);
  if (tipo.startsWith('text/html')) return sinHtml(cuerpo);
  if (tipo.startsWith('text/')) return cuerpo;
  return '';
}

export function leerCorreo(crudo: string): CorreoLeido {
  const p = separar(crudo);
  // Un correo reenviado por Gmail conserva el original adentro; si el asunto
  // externo es «Fwd: …» se limpia el prefijo para clasificar igual.
  const asunto = decodificarCabecera(p.cabeceras.subject || '').replace(/^\s*(fwd?|rv|re)\s*:\s*/i, '');
  return {
    remitente: decodificarCabecera(p.cabeceras.from || ''),
    destinatario: decodificarCabecera(p.cabeceras.to || ''),
    asunto,
    texto: textoDe(p),
  };
}

// ── Clasificación y extracción ───────────────────────────────────────────────

const MESES: Record<string, number> = {
  ene: 1, enero: 1, feb: 2, febrero: 2, mar: 3, marzo: 3, abr: 4, abril: 4, may: 5, mayo: 5, jun: 6, junio: 6,
  jul: 7, julio: 7, ago: 8, agosto: 8, sep: 9, sept: 9, septiembre: 9, set: 9, oct: 10, octubre: 10, nov: 11, noviembre: 11, dic: 12, diciembre: 12,
  jan: 1, january: 1, february: 2, apr: 4, april: 4, june: 6, july: 7, aug: 8, august: 8, september: 9, october: 10, november: 11, december: 12, dec: 12,
};

/** Fechas «20 de sept. de 2026», «sept. 20, 2026», «20 sept 2026», «Sep 20» en el orden en que aparecen. */
export function fechasEn(texto: string, anioPorDefecto: number): string[] {
  const salida: string[] = [];
  const meses = Object.keys(MESES).sort((a, b) => b.length - a.length).join('|');
  const re = new RegExp(`\\b(\\d{1,2})\\s*(?:de\\s+)?(${meses})\\.?,?(?:\\s+(?:de\\s+)?(\\d{4}))?\\b|\\b(${meses})\\.?\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?\\b`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    const dia = Number(m[1] ?? m[5]);
    const mes = MESES[(m[2] ?? m[4]).toLowerCase()];
    const anio = Number(m[3] ?? m[6] ?? anioPorDefecto);
    if (!mes || dia < 1 || dia > 31) continue;
    const iso = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    if (!salida.includes(iso)) salida.push(iso);
  }
  return salida;
}

export function clasificar(asunto: string, texto: string): TipoEvento {
  const a = asunto.toLowerCase();
  if (/verification code|código de verificación|confirm(a|ar) (tu|your) (dirección|address)|forwarding confirmation|reenvío/.test(a + ' ' + texto.slice(0, 400).toLowerCase()) && !/airbnb/.test(a)) return 'verificacion';
  if (/cancel/.test(a)) return 'cancelada';
  if (/confirmad|confirmed|booking confirmed|reserva confirmada|nueva reserva|new booking|reservation confirmed/.test(a)) return 'confirmada';
  if (/solicitud|request/.test(a)) return 'solicitud';
  if (/cambio|modific|alteration|changed|actualizad/.test(a)) return 'cambio';
  if (/llega mañana|arrives tomorrow|check-in|llegada/.test(a)) return 'llegada';
  if (/evaluaci|reseña|review/.test(a)) return 'resena';
  if (/mensaje|message/.test(a)) return 'mensaje';
  if (/pago|payout|payment|transferencia/.test(a)) return 'pago';
  return 'otro';
}

export function extraer(c: CorreoLeido, anio = new Date().getFullYear()): EventoAirbnb {
  const todo = `${c.asunto}\n${c.texto}`;
  const tipo = clasificar(c.asunto, c.texto);
  const codigo = /\bHM[A-Z0-9]{8,12}\b/.exec(todo)?.[0] ?? null;
  const anuncioId = /airbnb\.[a-z.]+\/rooms\/(\d{6,})/i.exec(todo)?.[1] ?? /\/rooms\/(\d{6,})/.exec(todo)?.[1] ?? null;
  // «Reserva confirmada: Ana llega el 20 de sept.» · «Reservation confirmed - Ana arrives Sep 20»
  const huesped = /(?:confirmada|confirmed|solicitud de|request from|cancelada por|cancel(?:l)?ed by)[:\s-]+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ'’-]+(?: [A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ'’-]+)?)/u.exec(c.asunto)?.[1]
    ?? /\b([A-ZÁÉÍÓÚÑ][\wáéíóúñ'’-]+) (?:llega|arrives)\b/u.exec(c.asunto)?.[1] ?? '';
  // Las fechas del cuerpo: Airbnb pone llegada y salida en ese orden. Se
  // toman las dos primeras distintas y en orden; si el cuerpo no da, el asunto.
  let fechas = fechasEn(c.texto, anio);
  if (fechas.length < 2) fechas = [...fechasEn(c.asunto, anio), ...fechas];
  const ordenadas = fechas.slice(0, 2).sort();
  const checkIn = ordenadas[0] ?? null;
  const checkOut = ordenadas[1] && ordenadas[1] > checkIn! ? ordenadas[1] : null;
  return { tipo, codigo, anuncioId, huesped, checkIn, checkOut };
}

// ── Acción ───────────────────────────────────────────────────────────────────

async function propiedadPorAnuncio(anuncioId: string | null): Promise<{ id: string; name: string } | null> {
  if (!anuncioId) return null;
  const r = await rows<{ id: string; name: string }>(
    `SELECT id, name FROM properties WHERE airbnb_url LIKE '%/rooms/' || $1 || '%' LIMIT 1`, [anuncioId]);
  return r[0] ?? null;
}

/**
 * Guarda el correo y actúa. Devuelve un resumen legible para el log y el panel.
 * Nunca lanza: un correo que no se entiende queda guardado con su error.
 */
export async function procesarCorreoAirbnb(crudo: string, sobre?: { de?: string; para?: string }): Promise<{ id: string; tipo: TipoEvento; resultado: string }> {
  const c = leerCorreo(crudo);
  const ev = extraer(c);
  const prop = await propiedadPorAnuncio(ev.anuncioId);
  let resultado = '';
  let error = '';

  try {
    if (ev.tipo === 'confirmada' || ev.tipo === 'solicitud' || ev.tipo === 'cambio') {
      if (!prop) resultado = 'sin apartamento reconocible en el correo';
      else if (!ev.checkIn || !ev.checkOut) resultado = `apartamento ${prop.name}, fechas no reconocidas`;
      else {
        // Si ya existe la estadía por iCal (o manual) para esas fechas, no se
        // duplica. Si existe por correo con el mismo código (cambio), se mueve.
        const yaEsta = await rows<{ id: string; origen: string }>(
          `SELECT id, origen FROM reservas
           WHERE property_id = $1 AND check_in < $3 AND check_out > $2
             AND (origen <> 'airbnb-correo' OR notas LIKE '%' || $4 || '%')`,
          [prop.id, ev.checkIn, ev.checkOut, ev.codigo ?? '∅']);
        const porCodigo = ev.codigo ? await rows<{ id: string }>(
          `SELECT id FROM reservas WHERE origen = 'airbnb-correo' AND notas LIKE '%' || $1 || '%'`, [ev.codigo]) : [];
        if (porCodigo[0]) {
          await query(`UPDATE reservas SET check_in = $2, check_out = $3, estado = $4, huesped = COALESCE(NULLIF($5, ''), huesped) WHERE id = $1`,
            [porCodigo[0].id, ev.checkIn, ev.checkOut, ev.tipo === 'solicitud' ? 'tentativa' : 'confirmada', ev.huesped]);
          resultado = `${prop.name}: reserva ${ev.codigo} actualizada ${ev.checkIn} → ${ev.checkOut}`;
        } else if (yaEsta.some((r) => r.origen !== 'airbnb-correo')) {
          resultado = `${prop.name}: las noches ${ev.checkIn} → ${ev.checkOut} ya estaban bloqueadas (${yaEsta[0].origen})`;
        } else {
          await query(
            `INSERT INTO reservas (property_id, origen, tipo, estado, huesped, notas, check_in, check_out, ical_summary)
             VALUES ($1, 'airbnb-correo', 'reserva', $2, $3, $4, $5, $6, 'Airbnb (correo)')`,
            [prop.id, ev.tipo === 'solicitud' ? 'tentativa' : 'confirmada', ev.huesped,
              `Detectada por correo de Airbnb${ev.codigo ? ` · código ${ev.codigo}` : ''}. El iCal la confirma y la sustituye.`,
              ev.checkIn, ev.checkOut]);
          resultado = `${prop.name}: noches ${ev.checkIn} → ${ev.checkOut} bloqueadas por correo${ev.huesped ? ` (${ev.huesped})` : ''}`;
        }
      }
    } else if (ev.tipo === 'cancelada') {
      if (ev.codigo) {
        const r = await query(`DELETE FROM reservas WHERE origen = 'airbnb-correo' AND notas LIKE '%' || $1 || '%'`, [ev.codigo]);
        resultado = `cancelación ${ev.codigo}: ${r.rowCount ?? 0} bloqueo(s) por correo liberado(s); el iCal libera el resto`;
      } else resultado = 'cancelación sin código: se deja al iCal';
    } else if (ev.tipo === 'verificacion') {
      const cod = /\b(\d{6,9})\b/.exec(c.texto)?.[1];
      resultado = cod ? `código de verificación: ${cod}` : 'correo de verificación (ver crudo)';
    } else {
      resultado = `${ev.tipo}: guardado${prop ? ` · ${prop.name}` : ''}${ev.codigo ? ` · ${ev.codigo}` : ''}`;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const [fila] = await rows<{ id: string }>(
    `INSERT INTO airbnb_eventos (remitente, destinatario, asunto, tipo, codigo, property_id, huesped, check_in, check_out, crudo, resultado, error)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
    [sobre?.de || c.remitente, sobre?.para || c.destinatario, c.asunto.slice(0, 300), ev.tipo, ev.codigo, prop?.id ?? null,
      ev.huesped, ev.checkIn, ev.checkOut, crudo.slice(0, 400_000), resultado, error.slice(0, 500)]);

  // Y siempre: el iCal es la verdad. Se fuerza ya y no se espera el resultado
  // más de lo necesario; el cron de 10 min repite si Airbnb aún no lo publicó.
  if (ev.tipo !== 'verificacion') {
    try { await sincronizarFeeds(false); } catch (e) { console.error('[airbnb-correo] sync tras correo falló:', e); }
  }
  return { id: fila.id, tipo: ev.tipo, resultado: error ? `${resultado} · error: ${error}` : resultado };
}

/** Últimos correos recibidos, para el panel. */
export async function getEventosAirbnb(limite = 20) {
  return rows<{ id: string; recibido_at: Date; asunto: string; tipo: TipoEvento; codigo: string | null; huesped: string; check_in: string | null; check_out: string | null; resultado: string; error: string; property: string | null }>(
    `SELECT e.id, e.recibido_at, e.asunto, e.tipo, e.codigo, e.huesped,
            to_char(e.check_in, 'YYYY-MM-DD') AS check_in, to_char(e.check_out, 'YYYY-MM-DD') AS check_out,
            e.resultado, e.error, p.name AS property
     FROM airbnb_eventos e LEFT JOIN properties p ON p.id = e.property_id
     ORDER BY e.recibido_at DESC LIMIT $1`, [limite]);
}
