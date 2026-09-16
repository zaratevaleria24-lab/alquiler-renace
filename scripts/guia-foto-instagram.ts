// Trae la foto de perfil (el logo) de un lugar de la guía desde Instagram, la
// guarda en nuestro servidor y la deja como portada de su ficha.
//
//   export $(grep -h '^POSTGRES_URL=' .env | head -1) && npx tsx scripts/guia-foto-instagram.ts rafas-casual-food aurelios-pizza-ccm
//
// POR QUÉ EL LOGO Y NO UNA FOTO DEL FEED: `GUIA.md` dice que no republicamos
// fotos de Instagram —son de quien las tomó y los enlaces caducan—. El logo del
// perfil es distinto: identifica al negocio, es lo que el negocio usa para que
// lo reconozcan, y acá se copia a nuestro almacenamiento (no se enlaza el CDN
// de Meta, que expira en horas). Aun así: se pone SOLO en aliados y negocios
// que nos dieron el visto bueno, y se acredita la cuenta.
//
// Cuesta ~US$0,003 por perfil (Apify, pago por evento). Se dispara a mano: no
// hay cron, igual que el scraper de Marketplace (VENTAS.md).
import { readFileSync } from 'fs';
import { query, rows } from '../lib/db';
import { guardarFotoRemota } from '../lib/uploads';

const ACTOR = 'apify~instagram-profile-scraper';

function token(): string {
  if (process.env.APIFY_TOKEN) return process.env.APIFY_TOKEN;
  const m = readFileSync('/etc/margarita-renace/apify.env', 'utf8').match(/^APIFY_TOKEN=(.+)$/m);
  if (!m) throw new Error('Falta el token de Apify (/etc/margarita-renace/apify.env).');
  return m[1].trim();
}

interface Perfil { username?: string; fullName?: string; profilePicUrlHD?: string; profilePicUrl?: string }

async function perfiles(usuarios: string[]): Promise<Perfil[]> {
  const r = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${token()}&timeout=180&clean=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: usuarios }),
    signal: AbortSignal.timeout(200000),
  });
  if (!r.ok) throw new Error(`Apify respondió ${r.status}`);
  return (await r.json()) as Perfil[];
}

(async () => {
  const slugs = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  if (slugs.length === 0) {
    console.log('Uso: npx tsx scripts/guia-foto-instagram.ts <slug> [<slug>…]');
    process.exit(1);
  }

  const lugares = await rows<{ id: string; slug: string; nombre: string; instagram: string | null; fotos: unknown[] }>(
    `SELECT id, slug, nombre, instagram, fotos FROM guia_lugares WHERE slug = ANY($1)`, [slugs],
  );
  const sinCuenta = lugares.filter((l) => !l.instagram);
  for (const l of sinCuenta) console.log(`  ${l.slug}: sin cuenta de Instagram en la ficha, se salta`);
  const conCuenta = lugares.filter((l) => l.instagram);
  for (const s of slugs) if (!lugares.some((l) => l.slug === s)) console.log(`  ${s}: no existe en la guía`);
  if (conCuenta.length === 0) process.exit(0);

  console.log(`Pidiendo ${conCuenta.length} perfiles a Apify (~US$${(conCuenta.length * 0.003).toFixed(3)})…`);
  const datos = await perfiles(conCuenta.map((l) => l.instagram!.replace(/^@/, '')));

  for (const l of conCuenta) {
    const cuenta = l.instagram!.replace(/^@/, '');
    const p = datos.find((d) => d.username?.toLowerCase() === cuenta.toLowerCase());
    const url = p?.profilePicUrlHD ?? p?.profilePicUrl;
    if (!url) { console.log(`  ${l.slug}: Instagram no devolvió foto de perfil`); continue; }
    // Índice 0: la portada. Si ya había fotos propias, esta va delante igual —
    // es el logo, y es lo que hace reconocible la tarjeta.
    const path = await guardarFotoRemota(url, l.slug, 0, 'guia');
    if (!path) { console.log(`  ${l.slug}: no se pudo guardar la imagen`); continue; }
    const foto = {
      path,
      alt: `${l.nombre}, Isla de Margarita`,
      credito: `Logo: @${cuenta} · Instagram`,
      licencia: 'Cortesía del negocio',
      fuente: 'instagram',
    };
    await query(`UPDATE guia_lugares SET fotos = $2, updated_at = now() WHERE id = $1`, [l.id, JSON.stringify([foto])]);
    console.log(`  ${l.slug}: ${path}`);
  }

  console.log('Listo. La caché de /guia y /mapa es de una hora: para verlo ya, guarda cualquier cosa en /admin/guia.');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
