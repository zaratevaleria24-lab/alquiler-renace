// Plantillas de historias de Instagram (1080×1920) con el diseño Amanecer:
// una por apartamento (foto, nombre, zona, precio, ★ Airbnb), «¿Cuánto cuesta
// 5 noches?», la guía con QR y las reseñas. Se generan con el Chrome del
// servidor y quedan en public/plantillas/ para descargar desde el panel.
//   node scripts/plantillas-historias.cjs
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright-core');
const { Client } = require('pg');
const fs = require('fs'); const path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const url = fs.readFileSync(path.join(RAIZ, '.env'), 'utf8').match(/^POSTGRES_URL=(.+)$/m)[1].trim();
const CH = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell';
const fileUrl = (p) => 'file://' + (p.startsWith('/uploads/') ? '/var/www/margarita-uploads' + p.slice('/uploads'.length) : path.join(RAIZ, 'public', p));
const b64 = (p) => 'data:image/' + (p.endsWith('.svg') ? 'svg+xml' : p.endsWith('.png') ? 'png' : 'webp') + ';base64,' + fs.readFileSync(p.startsWith('/uploads/') ? '/var/www/margarita-uploads' + p.slice('/uploads'.length) : path.join(RAIZ, 'public', p)).toString('base64');

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0} html,body{width:1080px;height:1920px;overflow:hidden}
body{font-family:Jost,system-ui,sans-serif;color:#2b2622;background:linear-gradient(160deg,#fde9dc 0%,#fff8f2 50%,#dff0f3 100%)}
.hoja{position:relative;width:1080px;height:1920px;padding:96px 80px;display:flex;flex-direction:column}
.marca{display:flex;align-items:center;gap:22px} .marca img{width:88px;height:88px}
.marca b{font:600 44px Fraunces,serif;letter-spacing:-.01em} .marca b i{color:#c0563c;font-style:normal}
.eyebrow{font-size:24px;letter-spacing:.18em;text-transform:uppercase;color:#0b4a5c;font-weight:500}
h1{font:400 92px/1.02 Fraunces,serif;letter-spacing:-.02em;margin-top:18px} h1 em{color:#126e8b}
.foto{width:100%;height:1010px;object-fit:cover;border-radius:28px;border:1px solid #e6d9cc;box-shadow:0 30px 60px -30px rgba(43,38,34,.35)}
.pill{display:inline-flex;align-items:center;gap:12px;background:#fff;border:1px solid #e6d9cc;border-radius:999px;padding:14px 26px;font-size:28px;font-weight:500}
.precio{font:600 120px/1 Fraunces,serif;color:#0b4a5c} .precio small{font:400 40px Jost;color:#5b524b}
.cta{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:24px;background:#0b4a5c;color:#fff;border-radius:999px;padding:30px 44px;font-size:34px;font-weight:500}
.cta span:last-child{font-size:28px;opacity:.85}
.mono{font-family:ui-monospace,Menlo,monospace}
.fila{display:flex;justify-content:space-between;padding:22px 0;border-bottom:1px solid #e6d9cc;font-size:34px} .fila b{font-weight:600}
.star{color:#FF5A5F}
`;
const marca = `<div class="marca"><img src="${b64('/logo-mark-teal.svg')}"><b>Margarita <i>Renace</i></b></div>`;

function hojaApto(a, tasa) {
  return `<style>${CSS}</style><div class="hoja">${marca}
  <p class="eyebrow" style="margin-top:48px">${a.zona} · Isla de Margarita</p>
  <h1>${a.nombre.replace(' · ', ' <em>')}${a.nombre.includes(' · ') ? '</em>' : ''}</h1>
  <div style="display:flex;gap:16px;margin:28px 0 34px;flex-wrap:wrap">
    <span class="pill">hasta ${a.personas} personas</span>
    ${a.rating ? `<span class="pill"><span class="star">★</span> ${Number(a.rating).toFixed(1)} en Airbnb${a.resenas ? ` · ${a.resenas} reseñas` : ''}</span>` : ''}
    ${a.detalle ? `<span class="pill">${a.detalle.split(' · ').slice(-3).join(' · ')}</span>` : ''}
  </div>
  <img class="foto" src="${b64(a.portada)}">
  <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:40px">
    <div><p class="eyebrow">Por noche</p><p class="precio">US$ ${a.precio} <small>${tasa ? `· Bs ${Math.round(a.precio * tasa).toLocaleString('es-VE')}` : ''}</small></p></div>
    <p style="font-size:26px;color:#5b524b;text-align:right;max-width:340px">Precio directo, sin comisión.<br>Te responde una persona.</p>
  </div>
  <div class="cta"><span>Reserva por WhatsApp</span><span>margaritarenace.com.ve/reservas</span></div></div>`;
}
function hojaPrecio(aptos, tasa) {
  const a = aptos[0]; const n = 5; const total = a.precio * n;
  return `<style>${CSS}</style><div class="hoja">${marca}
  <p class="eyebrow" style="margin-top:48px">Precio claro · sin comisión</p>
  <h1>¿Cuánto cuestan <em>5 noches</em> en Margarita?</h1>
  <div style="background:#fff;border:1px solid #e6d9cc;border-radius:28px;padding:48px 52px;margin-top:56px">
    <div class="fila"><span>Apartamento en Pampatar, hasta 6 personas</span><b>US$ ${a.precio} / noche</b></div>
    <div class="fila"><span>5 noches</span><b>US$ ${total}</b></div>
    <div class="fila"><span>Limpieza</span><b>incluida</b></div>
    <div class="fila"><span>Comisión de plataforma</span><b>US$ 0</b></div>
    <div class="fila" style="border:0;padding-top:34px"><span style="font-weight:600">Total</span><b class="precio" style="font-size:84px">US$ ${total}</b></div>
    ${tasa ? `<p style="font-size:30px;color:#5b524b;margin-top:8px">≈ Bs ${Math.round(total * tasa).toLocaleString('es-VE')} a tasa USDT de hoy (Bs ${Math.round(tasa)}). Se ajusta el día del pago.</p>` : ''}
  </div>
  <p style="font-size:32px;color:#5b524b;margin-top:44px;line-height:1.4">Anticipo del 50 % · contrato firmado desde el teléfono · Zelle, Binance, pago móvil o efectivo.</p>
  <div class="cta"><span>Calcula tus fechas</span><span>margaritarenace.com.ve/reservas</span></div></div>`;
}
function hojaGuia(nLugares) {
  return `<style>${CSS}</style><div class="hoja">${marca}
  <p class="eyebrow" style="margin-top:48px">Gratis para nuestros huéspedes</p>
  <h1>La guía de la isla, <em>contada por gente de aquí</em></h1>
  <p style="font-size:34px;line-height:1.45;color:#5b524b;margin-top:34px">${nLugares} playas, restaurantes, servicios a domicilio y aventuras con horario, valoración, teléfono y cómo llegar. Escaneas el QR al entrar al apartamento.</p>
  <div style="display:flex;justify-content:center;margin:64px 0"><div style="background:#fff;border:1px solid #e6d9cc;border-radius:28px;padding:40px"><img src="${b64('/qr-guia.png')}" style="width:560px;height:560px;display:block"></div></div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">${['Playas', 'Dónde comer', 'A domicilio', 'Agua y gas', 'Farmacias', 'Taxis', 'Aventura'].map((t) => `<span class="pill">${t}</span>`).join('')}</div>
  <div class="cta"><span>Ábrela ahora</span><span>margaritarenace.com.ve/guia</span></div></div>`;
}
function hojaResenas(aptos) {
  const con = aptos.filter((a) => a.rating); const media = con.reduce((t, a) => t + Number(a.rating), 0) / (con.length || 1); const res = aptos.reduce((t, a) => t + (a.resenas || 0), 0);
  return `<style>${CSS}</style><div class="hoja">${marca}
  <p class="eyebrow" style="margin-top:48px">Lo que dicen los huéspedes</p>
  <h1><span class="star">★</span> ${media.toFixed(1)} <em>en Airbnb</em></h1>
  <p style="font-size:36px;color:#5b524b;margin-top:18px">${res} reseñas en nuestros ${aptos.length} apartamentos</p>
  <div style="display:grid;gap:18px;margin-top:56px">${aptos.map((a) => `<div style="display:flex;align-items:center;gap:26px;background:#fff;border:1px solid #e6d9cc;border-radius:24px;padding:22px 26px"><img src="${b64(a.portada)}" style="width:150px;height:150px;border-radius:18px;object-fit:cover"><div style="flex:1"><p style="font:600 40px Fraunces,serif">${a.nombre}</p><p style="font-size:28px;color:#5b524b;margin-top:6px">${a.zona}${a.detalle ? ' · ' + a.detalle.split(' · ').slice(2).join(' · ') : ''}</p></div><p style="font-size:38px;font-weight:600;white-space:nowrap"><span class="star">★</span> ${a.rating ? Number(a.rating).toFixed(1) : '—'} <span style="font-size:26px;color:#8a7f76;font-weight:400">(${a.resenas || 0})</span></p></div>`).join('')}</div>
  <div class="cta"><span>Reserva directo o por Airbnb</span><span>margaritarenace.com.ve/enlaces</span></div></div>`;
}

(async () => {
  const db = new Client({ connectionString: url }); await db.connect();
  const { rows: aptos } = await db.query(`SELECT p.slug, p.name AS nombre, z.name AS zona, p.price_per_night AS precio, p.guests_adults + p.guests_children AS personas, p.airbnb_rating AS rating, p.airbnb_resenas AS resenas, p.airbnb_detalle AS detalle,
      (SELECT i.path FROM property_images i WHERE i.property_id = p.id ORDER BY i.is_cover DESC, i.sort_order LIMIT 1) AS portada
     FROM properties p LEFT JOIN zones z ON z.slug = p.zone_slug WHERE p.is_published ORDER BY p.sort_order`);
  const { rows: [{ n }] } = await db.query(`SELECT count(*) n FROM guia_lugares WHERE publicado`);
  let tasa = null; try { const { rows: t } = await db.query(`SELECT valor FROM tasas WHERE fuente IN ('binance','binance_pm')`); if (t.length) tasa = t.reduce((s, r) => s + Number(r.valor), 0) / t.length; } catch {}
  await db.end();
  const b = await chromium.launch({ executablePath: CH, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const out = path.join(RAIZ, 'public', 'plantillas'); fs.mkdirSync(out, { recursive: true });
  const hojas = [...aptos.map((a) => [`historia-${a.slug}.png`, hojaApto(a, tasa)]), ['historia-precio-5-noches.png', hojaPrecio(aptos, tasa)], ['historia-guia-qr.png', hojaGuia(n)], ['historia-resenas-airbnb.png', hojaResenas(aptos)]];
  for (const [nombre, html] of hojas) { await p.setContent(html, { waitUntil: 'networkidle' }); await p.waitForTimeout(400); await p.screenshot({ path: path.join(out, nombre) }); console.log('✓', nombre); }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
