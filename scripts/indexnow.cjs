// IndexNow: avisa a Bing, Yandex, DuckDuckGo (y quien se sume) qué URLs son
// nuevas o cambiaron, en cuanto se despliega. Google no lo usa (para Google:
// sitemap + Search Console), pero es gratis y evita esperar semanas en el resto.
//   node scripts/indexnow.cjs           → manda las URLs nuevas desde la última vez
//   node scripts/indexnow.cjs --todas   → manda el sitemap completo (máx. 10 000)
// La clave vive en /etc/margarita-renace/indexnow.env y su archivo público es
// public/<clave>.txt (así el buscador comprueba que el dominio es nuestro).
const fs = require('fs'); const path = require('path');
const SITIO = 'https://margaritarenace.com.ve';
const ESTADO = '/root/backups/margarita/indexnow-enviadas.json';
(async () => {
  const key = fs.readFileSync('/etc/margarita-renace/indexnow.env', 'utf8').match(/INDEXNOW_KEY=(\w+)/)[1];
  const xml = await (await fetch(`${SITIO}/sitemap.xml`)).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  let previas = []; try { previas = JSON.parse(fs.readFileSync(ESTADO, 'utf8')); } catch {}
  const todas = process.argv.includes('--todas');
  const nuevas = todas ? urls : urls.filter((u) => !previas.includes(u));
  if (!nuevas.length) { console.log('IndexNow: nada nuevo'); return; }
  const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: 'margaritarenace.com.ve', key, keyLocation: `${SITIO}/${key}.txt`, urlList: nuevas.slice(0, 10000) }) });
  console.log(`IndexNow: ${nuevas.length} URLs → HTTP ${r.status}`);
  if (r.status === 200 || r.status === 202) { fs.mkdirSync(path.dirname(ESTADO), { recursive: true }); fs.writeFileSync(ESTADO, JSON.stringify([...new Set([...previas, ...urls])], null, 0)); }
})().catch((e) => { console.error('IndexNow falló:', e.message); process.exit(1); });
