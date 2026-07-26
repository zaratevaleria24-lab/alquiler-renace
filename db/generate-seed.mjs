// Genera db/seed.sql LEYENDO los datos que hoy están publicados.
//
// POR QUÉ ASÍ Y NO ESCRIBIENDO EL SEED A MANO: el requisito número uno del CMS
// es que el panel y la web coincidan. Si el seed se transcribe, cualquier dedazo
// en un precio o un nombre entra en la base sin que nadie lo note, y a partir de
// ese momento la web y el panel discrepan. Generándolo desde lib/listings.ts la
// coincidencia es exacta por construcción.
//
// Uso:  node db/generate-seed.mjs > db/seed.sql
//
// Se ejecuta con tsx/ts-node? No: se importa el .ts compilado no es necesario
// porque los datos son literales. Se parsea con el propio Node usando un
// registro de iconos falso, ver más abajo.

import { readFileSync, writeFileSync } from 'node:fs';

const q = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const arr = (items) =>
  items.length ? `ARRAY[${items.map(q).join(', ')}]::text[]` : `'{}'::text[]`;
const num = (v) => (v === null || v === undefined ? 'NULL' : String(v));
const bool = (v) => (v ? 'true' : 'false');

// ── Cargar los datos reales ──────────────────────────────────────────────────
// lib/listings.ts importa componentes de Lucide, que no se pueden resolver desde
// un script suelto de Node. En vez de compilar TypeScript, se extraen los
// literales del propio archivo: son datos estáticos, así que basta con evaluar
// la parte de datos sustituyendo los iconos por su NOMBRE en texto — que es
// justamente lo que la base necesita guardar.
const src = readFileSync(new URL('../lib/listings.ts', import.meta.url), 'utf8');

// Nombres de iconos importados de lucide-react, para convertirlos en claves.
const iconNames = [...src.matchAll(/^\s{2}([A-Z][A-Za-z]*)(?: as ([A-Za-z]+))?,$/gm)].map(
  (m) => m[2] || m[1],
);

// Se construye un módulo evaluable: cada icono pasa a ser la cadena con su
// nombre, y se exportan los arrays de datos.
const dataPart = src
  .slice(src.indexOf('export const AMENITIES_'))
  .replace(/\bexport const\b/g, 'const')
  .replace(/:\s*Omit<Property[^=]*=/, '=')
  .replace(/^\s*export (function|interface)[\s\S]*$/m, '');

const iconStubs = iconNames.map((n) => `const ${n} = ${JSON.stringify(n)};`).join('\n');

const moduleSource = `
${iconStubs}
${dataPart}
export { RAW_PROPERTIES, CATEGORIES, AMENITIES_LUJO, AMENITIES_CENTRO, AMENITIES_LOS_GERANIOS, AMENITIES_PLAYA };
`;

const tmp = new URL('./.seed-data.mjs', import.meta.url);
writeFileSync(tmp, moduleSource);
const data = await import(tmp.href + '?t=' + process.hrtime.bigint());

const { RAW_PROPERTIES, CATEGORIES } = data;

// ── Utilidades compartidas con lib/listings.ts ───────────────────────────────
const slugify = (value) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const zoneFromLocation = (location) => {
  const parts = location
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p && p.toLowerCase() !== 'margarita');
  return parts[parts.length - 1] ?? 'Isla de Margarita';
};

// Clave estable de amenidad a partir de su nombre visible.
const amenityKey = (name) => slugify(name);

// ── Contenido editorial de las zonas ─────────────────────────────────────────
const zoneSrc = readFileSync(new URL('../lib/zones-content.ts', import.meta.url), 'utf8');
const zoneModule = zoneSrc
  .replace(/^\s*export interface[\s\S]*?^}/m, '')
  .replace(/\bexport const\b/g, 'const')
  .replace(/:\s*Record<string,\s*ZoneCopy>/, '')
  .replace(/:\s*Omit<ZoneCopy,\s*'headline'>/, '')
  .replace(/^\s*export function[\s\S]*$/m, '');
const tmpZ = new URL('./.seed-zones.mjs', import.meta.url);
writeFileSync(tmpZ, zoneModule + '\nexport { ZONE_COPY };\n');
const { ZONE_COPY } = await import(tmpZ.href + '?t=' + process.hrtime.bigint());

// ── Recolectar catálogos ─────────────────────────────────────────────────────
const amenityMap = new Map(); // key -> { name, icon }
const categorySet = new Map(); // key -> { label, icon }
const hostMap = new Map(); // name -> { tagline, avatar, isReal }
const zoneMap = new Map(); // slug -> { name, copy }

for (const c of CATEGORIES) {
  if (c.id === 'Todos') continue; // filtro de UI, no una categoría real
  categorySet.set(c.id, { label: c.label, icon: c.icon });
}

for (const p of RAW_PROPERTIES) {
  for (const a of p.amenities) {
    amenityMap.set(amenityKey(a.name), { name: a.name, icon: a.icon });
  }
  const zoneName = zoneFromLocation(p.location);
  zoneMap.set(slugify(zoneName), { name: zoneName });
  if (!hostMap.has(p.host.name)) {
    hostMap.set(p.host.name, {
      tagline: p.host.tagline,
      avatar: p.host.avatar,
      // Solo el anfitrión "Margarita Renace" es real; el resto son nombres
      // inventados que acompañan a los listados de relleno.
      isReal: p.host.name === 'Margarita Renace',
    });
  }
}

// ── Emitir SQL ───────────────────────────────────────────────────────────────
const out = [];
out.push(`-- GENERADO por db/generate-seed.mjs — NO editar a mano.`);
out.push(`-- Refleja exactamente los ${RAW_PROPERTIES.length} listados publicados al momento de generarlo.`);
out.push(`-- Regenerar con: node db/generate-seed.mjs > db/seed.sql`);
out.push('');
out.push('BEGIN;');
out.push('');

out.push('-- Categorías');
let i = 0;
for (const [key, c] of categorySet) {
  out.push(
    `INSERT INTO categories (key, label, icon_key, sort_order) VALUES (${q(key)}, ${q(c.label)}, ${q(slugify(c.icon))}, ${i++}) ON CONFLICT (key) DO NOTHING;`,
  );
}
out.push('');

out.push('-- Amenidades');
i = 0;
for (const [key, a] of amenityMap) {
  out.push(
    `INSERT INTO amenities (key, name, icon_key, sort_order) VALUES (${q(key)}, ${q(a.name)}, ${q(slugify(a.icon))}, ${i++}) ON CONFLICT (key) DO NOTHING;`,
  );
}
out.push('');

out.push('-- Zonas, con su contenido editorial');
i = 0;
for (const [slug, z] of zoneMap) {
  const copy = ZONE_COPY[slug] ?? {};
  out.push(
    `INSERT INTO zones (slug, name, coast, summary, body, nearby, best_for, sort_order) VALUES (` +
      `${q(slug)}, ${q(z.name)}, ${q(copy.coast ?? '')}, ${q(copy.summary ?? '')}, ` +
      `${arr(copy.body ?? [])}, ${arr(copy.nearby ?? [])}, ${q(copy.bestFor ?? '')}, ${i++}) ` +
      `ON CONFLICT (slug) DO NOTHING;`,
  );
}
out.push('');

out.push('-- Anfitriones');
for (const [name, h] of hostMap) {
  out.push(
    `INSERT INTO hosts (name, tagline, avatar_path, is_real) VALUES (${q(name)}, ${q(h.tagline)}, ${q(h.avatar)}, ${bool(h.isReal)});`,
  );
}
out.push('');

out.push('-- Propiedades, con fotos, amenidades y categorías');
RAW_PROPERTIES.forEach((p, idx) => {
  const slug = slugify(p.name);
  const zoneSlug = slugify(zoneFromLocation(p.location));
  // Solo "Los Geranios A" es inventario real: anfitrión Margarita Renace y foto
  // propia en public/properties/.
  const isReal = p.host.name === 'Margarita Renace';

  out.push('');
  out.push(`-- ${idx + 1}. ${p.name}`);
  out.push(`WITH nueva AS (`);
  out.push(`  INSERT INTO properties (`);
  out.push(`    slug, name, zone_slug, location, description, price_text,`);
  out.push(`    price_per_night, price_on_request, nights_count, rating,`);
  out.push(`    guests_adults, guests_children, is_real, is_published, sort_order, host_id`);
  out.push(`  ) VALUES (`);
  out.push(
    `    ${q(slug)}, ${q(p.name)}, ${q(zoneSlug)}, ${q(p.location)}, ${q(p.description)}, ${q(p.priceText)},`,
  );
  out.push(
    `    ${num(p.pricePerNight)}, ${bool(p.priceOnRequest)}, ${num(p.nightsCount)}, ${num(p.rating)},`,
  );
  out.push(
    `    ${num(p.guestsAllowed.adults)}, ${num(p.guestsAllowed.children)}, ${bool(isReal)}, true, ${idx},`,
  );
  out.push(`    (SELECT id FROM hosts WHERE name = ${q(p.host.name)} LIMIT 1)`);
  out.push(`  ) RETURNING id`);
  out.push(`)`);

  // Fotos: la portada es `image`; la galería puede repetirla, así que se
  // deduplica conservando el orden.
  const photos = [p.image, ...p.gallery].filter((v, k, a) => a.indexOf(v) === k);
  const values = photos
    .map(
      (path, k) =>
        `((SELECT id FROM nueva), ${q(path)}, ${q(`${p.name} — alojamiento en ${zoneFromLocation(p.location)}, Isla de Margarita`)}, ${bool(k === 0)}, ${k})`,
    )
    .join(',\n    ');
  out.push(`INSERT INTO property_images (property_id, path, alt, is_cover, sort_order) VALUES`);
  out.push(`    ${values};`);

  out.push(
    `INSERT INTO property_amenities (property_id, amenity_key, sort_order) VALUES`,
  );
  out.push(
    '    ' +
      p.amenities
        .map(
          (a, k) =>
            `((SELECT id FROM properties WHERE slug = ${q(slug)}), ${q(amenityKey(a.name))}, ${k})`,
        )
        .join(',\n    ') +
      ';',
  );

  out.push(`INSERT INTO property_categories (property_id, category_key) VALUES`);
  out.push(
    '    ' +
      p.categories
        .map(
          (c) =>
            `((SELECT id FROM properties WHERE slug = ${q(slug)}), ${q(c)})`,
        )
        .join(',\n    ') +
      ';',
  );
});

out.push('');
out.push('COMMIT;');
out.push('');

process.stdout.write(out.join('\n'));
