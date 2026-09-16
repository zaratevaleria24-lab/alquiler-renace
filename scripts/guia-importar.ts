// Importa la semilla de la guía: cruza cada lugar con Google Places (datos),
// baja hasta 3 fotos libres de Wikimedia Commons (con crédito) y suma los
// restaurantes y locales más reseñados de la isla desde los volcados de Places.
//
//   export $(grep -h '^POSTGRES_URL=' .env | head -1) && npx tsx scripts/guia-importar.ts [--sin-fotos]
//
// Idempotente: repetirlo actualiza textos y datos sin duplicar ni borrar fotos.
import { readFileSync, readdirSync, existsSync } from 'fs';
import { rows, query } from '../lib/db';
import { aplicarPlaces, buscarEnPlaces, type Categoria } from '../lib/guia';
import { guardarFotoRemota } from '../lib/uploads';
import { slugify } from '../lib/listings';
import { zonaPorCoordenadas } from '../lib/ventas';
import { CONSEJOS, LUGARES, type Semilla } from './guia-semilla';

const SIN_FOTOS = process.argv.includes('--sin-fotos');
// --solo=texto,texto: importa nada más las entradas cuyo nombre contenga uno de
// esos textos. Para sumar un puñado de servicios sin reescribir los 103 lugares
// (y sin pisar lo que la dueña haya editado a mano en el panel).
const SOLO = process.argv.find((a) => a.startsWith('--solo='))?.slice('--solo='.length).split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) ?? null;
const LICENCIAS_OK = /^(CC0|Public domain|CC BY(-SA)? [0-9.]+|CC BY(-SA)?)$/i;
const UA = 'MargaritaRenaceGuia/1.0 (https://margaritarenace.com.ve; contacto por WhatsApp en el sitio)';

async function fotosCommons(consulta: string, max = 3) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(consulta)}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url%7Csize%7Cmime%7Cextmetadata&iiurlwidth=1600&format=json`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
    const d = await r.json();
    const paginas = Object.values((d.query?.pages ?? {}) as Record<string, Record<string, unknown>>);
    const out: { url: string; autor: string; licencia: string; titulo: string }[] = [];
    for (const p of paginas) {
      const ii = ((p.imageinfo as Record<string, unknown>[]) ?? [])[0];
      if (!ii) continue;
      const em = (ii.extmetadata ?? {}) as Record<string, { value?: string }>;
      const lic = em.LicenseShortName?.value ?? '';
      const w = Number(ii.width ?? 0), h = Number(ii.height ?? 0);
      if (w < 1200 || !String(ii.mime ?? '').match(/^image\/(jpeg|png)$/) || !LICENCIAS_OK.test(lic)) continue;
      if (w / h > 3.2 || h / w > 1.6) continue; // panorámicas extremas y verticales raras
      const autor = String(em.Artist?.value ?? 'Autor desconocido').replace(/<[^>]+>/g, '').trim().slice(0, 60);
      out.push({ url: String(ii.thumburl ?? ii.url), autor, licencia: lic, titulo: String(p.title) });
      if (out.length >= max) break;
    }
    return out;
  } catch (e) { console.log('   commons falló:', (e as Error).message); return []; }
}

async function importarLugar(s: Semilla) {
  const slug = slugify(s.nombre).slice(0, 70);
  const [fila] = await rows<{ id: string; fotos: unknown[]; google_place_id: string | null }>(
    `INSERT INTO guia_lugares (slug, nombre, categoria, descripcion, consejo, mejor_momento, duracion, costo, instagram, web, destacado, municipio, telefono, direccion, aliado, categorias_extra)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,COALESCE($14,''),$15,$16)
     ON CONFLICT (slug) DO UPDATE SET nombre=EXCLUDED.nombre, categoria=EXCLUDED.categoria, descripcion=EXCLUDED.descripcion,
       consejo=EXCLUDED.consejo, mejor_momento=EXCLUDED.mejor_momento, duracion=EXCLUDED.duracion, costo=EXCLUDED.costo,
       instagram=COALESCE(EXCLUDED.instagram, guia_lugares.instagram), web=COALESCE(guia_lugares.web, EXCLUDED.web),
       destacado=EXCLUDED.destacado, municipio=EXCLUDED.municipio, updated_at=now(),
       telefono=COALESCE(guia_lugares.telefono, EXCLUDED.telefono), direccion=CASE WHEN guia_lugares.direccion='' THEN EXCLUDED.direccion ELSE guia_lugares.direccion END, aliado=EXCLUDED.aliado, categorias_extra=EXCLUDED.categorias_extra
     RETURNING id, fotos, google_place_id`,
    [slug, s.nombre, s.categoria, s.descripcion, s.consejo, s.mejorMomento ?? '', s.duracion ?? '', s.costo ?? '', s.instagram ?? null, s.web ?? null, s.destacado ?? false, s.municipio ?? '', s.telefono ?? null, s.direccion ?? null, s.aliado ?? false, s.categoriasExtra ?? []],
  );
  // Google Places
  // Sin busqueda (''), no se consulta Google: para servicios que Google confunde
  // con otro negocio. Si la fila ya tiene place_id, tampoco: ahorra cuota.
  const p = s.busqueda && !fila.google_place_id ? await buscarEnPlaces(s.busqueda) : null;
  if (p) {
    await aplicarPlaces(fila.id, p);
    const lat = (p.location as { latitude?: number })?.latitude, lng = (p.location as { longitude?: number })?.longitude;
    if (lat != null && lng != null) await query(`UPDATE guia_lugares SET zone_slug = $2 WHERE id = $1`, [fila.id, zonaPorCoordenadas(lat, lng)]);
  }
  // Fotos libres
  let nuevas = 0;
  if (!SIN_FOTOS && (fila.fotos as unknown[]).length === 0) {
    const cands = await fotosCommons(s.commons ?? s.nombre);
    const fotos = [];
    for (const [i, c] of cands.entries()) {
      const path = await guardarFotoRemota(c.url, slug, i, 'guia');
      if (path) fotos.push({ path, alt: `${s.nombre}, Isla de Margarita`, credito: `Foto: ${c.autor} · ${c.licencia} · Wikimedia Commons`, licencia: c.licencia, fuente: 'commons' });
    }
    if (fotos.length) { await query(`UPDATE guia_lugares SET fotos = $2 WHERE id = $1`, [fila.id, JSON.stringify(fotos)]); nuevas = fotos.length; }
  }
  const nombreG = (p?.displayName as { text?: string })?.text ?? '—';
  console.log(`  ${s.categoria.padEnd(10)} ${s.nombre.slice(0, 40).padEnd(40)} places: ${p ? `${nombreG.slice(0, 30)} ★${p.rating ?? '-'} (${p.userRatingCount ?? 0})` : 'sin match'} · fotos libres: ${nuevas}`);
}

/** Restaurantes, noche y compras: los más reseñados de los volcados de Places. */
async function importarDescubiertos() {
  const dir = '/tmp/claude-0/-root/af3b1cd6-f2d0-417f-bd6d-ee2f9a23789c/scratchpad/places';
  if (!existsSync(dir)) return;
  const grupos: { archivos: string[]; categoria: Categoria; max: number; tipos?: RegExp }[] = [
    { archivos: ['restaurantes.json', 'restaurantes2.json'], categoria: 'comer', max: 12, tipos: /restaurant|food|pizza|cafe|bar_and_grill|seafood/ },
    { archivos: ['nocturna.json'], categoria: 'nocturna', max: 4, tipos: /bar|night_club|pub/ },
  ];
  const yaSlugs = new Set((await rows<{ slug: string }>(`SELECT slug FROM guia_lugares`)).map((r) => r.slug));
  for (const g of grupos) {
    const vistos = new Map<string, Record<string, unknown>>();
    for (const a of g.archivos) {
      const f = `${dir}/${a}`; if (!existsSync(f)) continue;
      for (const p of JSON.parse(readFileSync(f, 'utf8')).places ?? []) vistos.set(p.id, p);
    }
    const top = [...vistos.values()]
      .filter((p) => (p.businessStatus ?? 'OPERATIONAL') === 'OPERATIONAL' && Number(p.rating ?? 0) >= 4.3 && (!g.tipos || (p.types as string[] ?? []).some((t) => g.tipos!.test(t))))
      .sort((a, b) => Number(b.userRatingCount ?? 0) - Number(a.userRatingCount ?? 0)).slice(0, g.max);
    for (const p of top) {
      const nombre = String((p.displayName as { text: string }).text).replace(/\s+/g, ' ').trim();
      const slug = slugify(nombre).slice(0, 70);
      if (yaSlugs.has(slug)) continue;
      const resumen = (p.editorialSummary as { text?: string })?.text;
      const tipo = (p.primaryTypeDisplayName as { text?: string })?.text ?? (g.categoria === 'comer' ? 'Restaurante' : 'Local');
      const descripcion = resumen
        ? `${resumen} (Según Google.)`
        : `${tipo} en ${String(p.shortFormattedAddress ?? 'la isla').split(',').pop()?.trim()}, de los más reseñados de Margarita según Google.`;
      const consejo = g.categoria === 'comer'
        ? 'En temporada alta y fines de semana conviene reservar por WhatsApp. Pregunta si aceptan pago móvil o dólares antes de sentarte.'
        : 'Ve y vuelve en taxi o app: es lo más seguro de noche. Los precios de entrada cambian según el evento.';
      const [fila] = await rows<{ id: string }>(
        `INSERT INTO guia_lugares (slug, nombre, categoria, descripcion, consejo, orden) VALUES ($1,$2,$3,$4,$5, 50)
         ON CONFLICT (slug) DO UPDATE SET descripcion = EXCLUDED.descripcion, updated_at = now() RETURNING id`,
        [slug, nombre, g.categoria, descripcion, consejo],
      );
      await aplicarPlaces(fila.id, p);
      const lat = (p.location as { latitude?: number })?.latitude, lng = (p.location as { longitude?: number })?.longitude;
      if (lat != null && lng != null) await query(`UPDATE guia_lugares SET zone_slug = $2 WHERE id = $1`, [fila.id, zonaPorCoordenadas(lat, lng)]);
      console.log(`  ${g.categoria.padEnd(10)} ${nombre.slice(0, 40).padEnd(40)} ★${p.rating} (${p.userRatingCount})`);
    }
  }
}

(async () => {
  const lista = SOLO ? LUGARES.filter((l) => SOLO.some((t) => l.nombre.toLowerCase().includes(t))) : LUGARES;
  console.log(`Importando ${lista.length} lugares curados${SOLO ? ` (--solo=${SOLO.join(',')})` : ''}…`);
  for (const s of lista) { try { await importarLugar(s); } catch (e) { console.log('  ERROR', s.nombre, (e as Error).message); } }
  if (!SOLO) {
    console.log('Descubiertos por Google (comer, noche)…');
    await importarDescubiertos();
  }
  for (const [i, c] of CONSEJOS.entries()) {
    await query(`INSERT INTO guia_consejos (tema, titulo, texto, orden) SELECT $1,$2,$3,$4 WHERE NOT EXISTS (SELECT 1 FROM guia_consejos WHERE titulo = $2)`, [c.tema, c.titulo, c.texto, i]);
  }
  const [r] = await rows<{ n: string; f: string; g: string }>(`SELECT count(*) n, count(*) FILTER (WHERE jsonb_array_length(fotos) > 0) f, count(*) FILTER (WHERE google_place_id IS NOT NULL) g FROM guia_lugares`);
  console.log(`Listo: ${r.n} lugares · ${r.f} con fotos libres · ${r.g} con datos de Google · ${CONSEJOS.length} consejos`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
