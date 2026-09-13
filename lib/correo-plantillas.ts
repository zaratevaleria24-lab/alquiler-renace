// Plantillas de correo de los contratos: HTML con la marca (fondo Amanecer,
// emblema, «Renace» en terracota), tabla de la estadía y UN botón. Solo CSS en
// línea: es lo único que los clientes de correo respetan. Texto plano al lado
// para quien lo lee sin HTML.
import { SITE } from './site';
import { fecha, usd, type DatosContrato } from './contratos-clausulas';

const LOGO = `${SITE.url}/correo-logo.png`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function marco(titulo: string, cuerpo: string, pie = ''): string {
  return `<!doctype html><html lang="es"><body style="margin:0;padding:0;background:#f4efe9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#2b2622">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4efe9;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e6d9cc;border-radius:14px;overflow:hidden">
  <tr><td style="background:linear-gradient(135deg,#fde9dc 0%,#fff8f2 55%,#dff0f3 100%);background-color:#fdeee3;padding:28px 28px 22px;text-align:center">
    <img src="${LOGO}" width="72" height="72" alt="${SITE.name}" style="display:block;margin:0 auto 10px;width:72px;height:72px">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:600;letter-spacing:-.01em">Margarita <span style="color:#c0563c">Renace</span></div>
    <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#0b4a5c;margin-top:6px">${esc(titulo)}</div>
  </td></tr>
  <tr><td style="padding:26px 28px 8px;font-size:16px;line-height:1.55">${cuerpo}</td></tr>
  <tr><td style="padding:18px 28px 26px;font-size:12px;line-height:1.5;color:#8a7f76;border-top:1px solid #efe6dc">
    ${pie || `${SITE.name} · Isla de Margarita, Venezuela · <a href="${SITE.url}" style="color:#0b4a5c">margaritarenace.com.ve</a><br>Te respondemos nosotros, no un robot: responde este correo o escríbenos por WhatsApp.`}
  </td></tr>
</table></td></tr></table></body></html>`;
}
const boton = (href: string, texto: string) => `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px auto"><tr><td style="background:#0b4a5c;border-radius:10px"><a href="${href}" style="display:inline-block;padding:14px 26px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px">${texto}</a></td></tr></table>`;
const fila = (k: string, v: string) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #efe6dc;color:#8a7f76;font-size:13px">${k}</td><td style="padding:8px 12px;border-bottom:1px solid #efe6dc;font-size:14px;text-align:right;font-variant-numeric:tabular-nums">${v}</td></tr>`;
function resumen(d: DatosContrato): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e6d9cc;border-radius:10px;overflow:hidden;margin:6px 0 4px">
    ${fila('Inmueble', `<b>${esc(d.inmueble)}</b>`)}${fila('Entrada', `${fecha(d.checkIn)} · ${d.horaEntrada}`)}${fila('Salida', `${fecha(d.checkOut)} · ${d.horaSalida}`)}
    ${fila('Noches · personas', `${d.noches} · ${d.huespedes}`)}${fila('Total', `<b>${usd(d.totalUsd)}</b>`)}${d.anticipoUsd > 0 ? fila('Anticipo · saldo al ingresar', `${usd(d.anticipoUsd)} · ${usd(Math.max(0, d.totalUsd - d.anticipoUsd))}`) : ''}
  </table>`;
}

export function correoInvitacion(d: DatosContrato, url: string, firmante: string) {
  const html = marco('Contrato de hospedaje', `
    <p style="margin:0 0 14px">Hola ${esc(d.huesped.split(' ')[0])},</p>
    <p style="margin:0 0 16px">Gracias por reservar con nosotros. Aquí está tu contrato de hospedaje. Léelo con calma y fírmalo desde el teléfono o la computadora: te toma dos minutos.</p>
    ${resumen(d)}
    ${boton(url, 'Leer y firmar el contrato')}
    <p style="margin:0 0 10px;font-size:14px;color:#5b524b"><b>Cómo funciona:</b> abres el enlace, lees las cláusulas, te llega un código de 6 dígitos a este mismo correo, lo escribes, firmas con el dedo o el ratón y listo. Recibes tu copia firmada.</p>
    <p style="margin:0;font-size:12px;color:#8a7f76">Si el botón no abre, copia este enlace: <a href="${url}" style="color:#0b4a5c;word-break:break-all">${url}</a></p>
    <p style="margin:18px 0 0">${esc(firmante)}<br><span style="color:#8a7f76">${SITE.name}</span></p>`);
  const texto = `Hola ${d.huesped},\n\nGracias por reservar con ${SITE.name}. Aquí está tu contrato de hospedaje para ${d.inmueble}, del ${fecha(d.checkIn)} al ${fecha(d.checkOut)} (${d.noches} noches, total ${usd(d.totalUsd)}).\n\nLéelo y fírmalo desde tu teléfono o computadora en este enlace privado:\n${url}\n\nTe llegará un código de 6 dígitos a este correo para confirmar tu identidad antes de firmar.\n\n${firmante}\n${SITE.name} · ${SITE.url}`;
  return { html, texto, asunto: `Tu contrato de hospedaje · ${d.inmueble} · ${fecha(d.checkIn)}` };
}

export function correoCodigo(d: DatosContrato, codigo: string) {
  const html = marco('Código de verificación', `
    <p style="margin:0 0 14px">Hola ${esc(d.huesped.split(' ')[0])},</p>
    <p style="margin:0 0 18px">Este es tu código para firmar el contrato de <b>${esc(d.inmueble)}</b>. Escríbelo en la página del contrato. Vence en 15 minutos.</p>
    <div style="text-align:center;margin:8px 0 18px"><span style="display:inline-block;font-family:Menlo,Consolas,monospace;font-size:34px;letter-spacing:.35em;padding:14px 22px;border:1px solid #e6d9cc;border-radius:10px;background:#fff8f2;color:#0b4a5c">${codigo}</span></div>
    <p style="margin:0;font-size:13px;color:#8a7f76">Si no pediste este código, ignora este correo: nadie puede firmar sin él.</p>`);
  return { html, texto: `Tu código para firmar el contrato de ${d.inmueble}: ${codigo}\nVence en 15 minutos. Si no lo pediste, ignora este correo.`, asunto: `${codigo} es tu código para firmar · ${SITE.name}` };
}

export function correoFirmado(d: DatosContrato, url: string, firma: { nombre: string; documento: string; fecha: string; hash: string }) {
  const cuando = new Date(firma.fecha).toLocaleString('es-VE', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Caracas' });
  const html = marco('Contrato firmado', `
    <p style="margin:0 0 14px">Contrato de <b>${esc(d.inmueble)}</b> firmado por <b>${esc(firma.nombre)}</b> (${esc(firma.documento)}) el ${cuando}, hora de Venezuela.</p>
    ${resumen(d)}
    ${boton(url, 'Ver el contrato firmado')}
    <p style="margin:0 0 6px;font-size:13px;color:#5b524b">Desde esa página se imprime o se guarda en PDF. En <a href="${url}/verificar" style="color:#0b4a5c">${url}/verificar</a> se comprueba la integridad del documento.</p>
    <p style="margin:0;font-family:Menlo,Consolas,monospace;font-size:11px;color:#8a7f76;word-break:break-all">Huella SHA-256: ${firma.hash}</p>`);
  return { html, texto: `Contrato de ${d.inmueble} firmado por ${firma.nombre} (${firma.documento}) el ${cuando}.\nVer: ${url}\nVerificar integridad: ${url}/verificar\nHuella SHA-256: ${firma.hash}`, asunto: `Contrato firmado · ${d.inmueble} · ${fecha(d.checkIn)}` };
}


/** Cupón de bienvenida: el código, la guía y cómo usarlo. */
export function correoCupon(nombre: string, cupon: string, pct: number) {
  const guia = `${SITE.url}/guia`, reservas = `${SITE.url}/reservas?cupon=${encodeURIComponent(cupon)}`;
  const html = marco('Bienvenida a la isla', `
    <p style="margin:0 0 14px">Hola ${esc(nombre.split(' ')[0] || '')},</p>
    <p style="margin:0 0 18px">Gracias por dejarnos tu correo. Este es tu código de <b>${pct} % de descuento</b> en tu primera reserva directa con nosotros, para cualquiera de nuestros apartamentos en Pampatar:</p>
    <div style="text-align:center;margin:8px 0 18px"><span style="display:inline-block;font-family:Menlo,Consolas,monospace;font-size:30px;letter-spacing:.12em;padding:14px 22px;border:1px dashed #0b4a5c;border-radius:10px;background:#fff8f2;color:#0b4a5c">${esc(cupon)}</span></div>
    <p style="margin:0 0 6px;font-size:14px;color:#5b524b">Se aplica solo en la calculadora de reservas o dictándolo por WhatsApp. Vale una vez, sin fecha de vencimiento.</p>
    ${boton(reservas, 'Calcular mi estadía con el descuento')}
    <p style="margin:0 0 10px">Y el regalo prometido: <a href="${guia}" style="color:#0b4a5c">la guía de la isla</a> — más de 100 playas, restaurantes, servicios a domicilio y aventuras con horario, valoración y cómo llegar. La misma que reciben nuestros huéspedes por QR al entrar al apartamento.</p>
    <p style="margin:18px 0 0">Valeria<br><span style="color:#8a7f76">${SITE.name}</span></p>`);
  const texto = `Hola ${nombre},\n\nTu código de ${pct} % de descuento en tu primera reserva directa: ${cupon}\nSe aplica en ${reservas} o dictándolo por WhatsApp. Vale una vez.\n\nTu regalo: la guía de la isla → ${guia}\n\nValeria · ${SITE.name}`;
  return { html, texto, asunto: `${cupon}: tu ${pct} % de descuento y la guía de la isla` };
}
