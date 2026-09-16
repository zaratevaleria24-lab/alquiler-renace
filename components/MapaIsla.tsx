'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CATEGORIAS, categoriaLabel } from '@/lib/guia-comun';
import { EMOJI, distanciaCorta, km, type PuntoMapa } from '@/lib/mapa-comun';
import type { GeoJSONSource, Map as MapaGL, MapMouseEvent, Marker } from 'maplibre-gl';

// MAPA DE LA ISLA — /mapa
//
// POR QUÉ NO ES GOOGLE MAPS. El mapa anterior (components/MapaGuia.tsx) estaba
// desconectado: la clave de Google no autoriza este dominio y el SDK cobra por
// carga. Acá el mapa es NUESTRO de punta a punta:
//   · las teselas son un archivo PMTiles de 17 MB en /uploads/mapa/, sacado del
//     basemap de Protomaps (OpenStreetMap) y servido por nuestro nginx. El
//     navegador pide por rangos de bytes solo los cuadros que mira: ver el mapa
//     completo de la isla cuesta unos cientos de KB, no 17 MB.
//   · las fuentes y los iconos del basemap también están en /uploads/mapa/. En
//     Venezuela los CDN se bloquean (CLAUDE.md): nada se pide fuera del dominio.
//   · sin clave, sin cuota y sin costo por carga.
//
// El motor es MapLibre GL, que se carga con import() SOLO en esta ruta: son
// ~250 KB que la guía y la home no pagan.

// MapLibre exige URL absoluta para el sprite y para las fuentes (rechaza el
// estilo entero si son relativas), así que se arman con el origen en el
// navegador. Así siguen siendo de NUESTRO dominio en producción y en local.
const PMTILES = '/uploads/mapa/margarita.pmtiles';  // se vuelve absoluta con raiz()
const raiz = (p: string) => (typeof window === 'undefined' ? p : `${window.location.origin}${p}`);
const CENTRO: [number, number] = [-63.93, 10.98];
// El encuadre de entrada se calcula, no se fija: un zoom que se ve bien en un
// monitor deja la isla del tamaño de una moneda en un teléfono vertical.
/** La isla de punta a punta, para pantallas anchas. */
const ISLA: [[number, number], [number, number]] = [[-64.44, 10.80], [-63.73, 11.17]];
/** En teléfono se entra por el este, y con un recuadro VERTICAL: ahí están
 *  Pampatar, Porlamar, las playas del norte y los cuatro apartamentos. Encajar
 *  la isla completa en una pantalla vertical la deja del tamaño de una moneda,
 *  con media pantalla de mar. La isla entera queda a un pellizco. */
const ISLA_MOVIL: [[number, number], [number, number]] = [[-64.02, 10.86], [-63.76, 11.17]];
const ATRIBUCION = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · <a href="https://protomaps.com" target="_blank" rel="noopener">Protomaps</a>';

/** Paleta «Amanecer» del sitio (app/globals.css) llevada al basemap. */
const TINTA = '#2b2622', SUAVE = '#4a4239', TENUE = '#8f867b';
const PAPEL = '#fff8f2', ARENA = '#fbeee2', LINEA = '#e6d9cc';
const MAR = '#126e8b', HONDO = '#0b4a5c', ORO = '#d9a441';

/** Un aro de color por grupo: lo que se descubre y lo que se resuelve. */
const AROS: Record<string, string> = { descubrir: MAR, resolver: '#c0563c', alojamiento: HONDO };
const grupoDe = (cat: string) => (cat === 'alojamiento' ? 'alojamiento' : CATEGORIAS.find((c) => c.key === cat)?.grupo ?? 'descubrir');

/**
 * Dibuja el emoji de la categoría dentro de un pin circular y lo devuelve como
 * imagen para MapLibre. Se hace en canvas y no con marcadores HTML a propósito:
 * 130 nodos del DOM moviéndose con el mapa es lo que hace que un mapa se sienta
 * lento en un teléfono; como imagen lo dibuja la GPU y además permite agrupar.
 */
function pinEmoji(emoji: string, aro: string, grande = false): ImageData {
  const dpr = 2, lado = grande ? 54 : 46, r = grande ? 19 : 15;
  const c = document.createElement('canvas');
  c.width = c.height = lado * dpr;
  const x = c.getContext('2d')!;
  x.scale(dpr, dpr);
  x.beginPath();
  x.arc(lado / 2, lado / 2, r, 0, Math.PI * 2);
  x.shadowColor = 'rgba(43,38,34,.30)';
  x.shadowBlur = 7;
  x.shadowOffsetY = 2;
  x.fillStyle = PAPEL;
  x.fill();
  x.shadowColor = 'transparent';
  x.lineWidth = grande ? 3 : 2;
  x.strokeStyle = aro;
  x.stroke();
  x.font = `${grande ? 22 : 18}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(emoji, lado / 2, lado / 2 + 1);
  return x.getImageData(0, 0, c.width, c.height);
}

const fc = (puntos: PuntoMapa[]) => ({
  type: 'FeatureCollection' as const,
  features: puntos.map((p) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
    properties: { slug: p.slug, nombre: p.nombre, categoria: p.categoria },
  })),
});

/** Círculo de radio en km como polígono, para «qué tengo a pie». */
function circulo(centro: PuntoMapa, radioKm: number) {
  const pasos = 72, coords: [number, number][] = [];
  for (let i = 0; i <= pasos; i++) {
    const a = (i / pasos) * 2 * Math.PI;
    const dx = (radioKm / 111.32) * Math.cos(a) / Math.cos((centro.lat * Math.PI) / 180);
    const dy = (radioKm / 110.57) * Math.sin(a);
    coords.push([centro.lng + dx, centro.lat + dy]);
  }
  return { type: 'FeatureCollection' as const, features: [{ type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: [coords] } }] };
}

export default function MapaIsla({ puntos }: { puntos: PuntoMapa[] }) {
  const caja = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaGL | null>(null);
  const marcaSel = useRef<Marker | null>(null);
  const marcaYo = useRef<Marker | null>(null);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [base, setBase] = useState<string | null>(null);
  const [sel, setSel] = useState<PuntoMapa | null>(null);
  const [yo, setYo] = useState<{ lat: number; lng: number } | null>(null);
  const [buscandoYo, setBuscandoYo] = useState(false);

  const casas = useMemo(() => puntos.filter((p) => p.tipo === 'alojamiento'), [puntos]);
  const lugares = useMemo(() => puntos.filter((p) => p.tipo === 'lugar'), [puntos]);
  const porSlug = useMemo(() => new Map(puntos.map((p) => [`${p.tipo}:${p.slug}`, p])), [puntos]);
  const casaBase = useMemo(() => casas.find((c) => c.slug === base) ?? null, [casas, base]);
  const cuenta = useCallback((k: string) => lugares.filter((l) => l.categoria === k).length, [lugares]);

  /** Lo que se ve ahora: la categoría elegida y, si hay apartamento base, lo que le queda a 1 km. */
  const visibles = useMemo(() => {
    let v = cat ? lugares.filter((l) => l.categoria === cat) : lugares;
    if (casaBase) v = v.filter((l) => km(casaBase, l) <= 1);
    return v;
  }, [lugares, cat, casaBase]);

  const cerca = useMemo(() => {
    const desde: { lat: number; lng: number } | null = yo ?? casaBase;
    if (!desde) return null;
    return [...visibles].map((l) => ({ l, d: km(desde, l) })).sort((a, b) => a.d - b.d).slice(0, 6);
  }, [visibles, yo, casaBase]);

  const elegir = useCallback((p: PuntoMapa) => {
    setSel(p);
    const m = mapa.current;
    if (!m) return;
    m.easeTo({ center: [p.lng, p.lat], duration: 700, offset: [0, -90] });
    import('maplibre-gl').then((maplibregl) => {
      marcaSel.current?.remove();
      const el = document.createElement('div');
      el.className = 'mapa-pulso';
      marcaSel.current = new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(m);
    });
  }, []);

  // ── Crear el mapa (una sola vez) ──────────────────────────────────────────
  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!caja.current || mapa.current) return;
      try {
        const [maplibregl, { Protocol }, { LIGHT, layers }] = await Promise.all([
          import('maplibre-gl'),
          import('pmtiles'),
          import('@protomaps/basemaps'),
        ]);
        if (!vivo || !caja.current) return;
        const protocolo = new Protocol();
        maplibregl.addProtocol('pmtiles', protocolo.tile);

        // El basemap de Protomaps repintado con los tokens del sitio: arena y
        // hueso para la tierra, el teal del emblema para el mar, calles casi
        // blancas. Se parte de LIGHT para no tener que nombrar las 50 claves.
        const sabor = {
          ...LIGHT,
          background: PAPEL, earth: ARENA, sand: '#f7e6cb', beach: '#f8e2bd', glacier: '#ffffff',
          water: '#bcdbe6', pier: LINEA,
          park_a: '#e4e8d7', park_b: '#dce2ce', wood_a: '#dde4d1', wood_b: '#d4dcc7', scrub_a: '#e3e6d5', scrub_b: '#dbe1ce',
          zoo: '#e8e6d4', military: '#eee6da', aerodrome: '#eee7db', runway: '#e2d8c9',
          hospital: '#f7e7e1', industrial: '#f2eae0', school: '#f3ece0', pedestrian: '#f6ece0',
          buildings: '#efe0cf',
          minor_service: '#fffdfa', minor_a: '#fffdfa', minor_b: '#fffdfa', link: '#fff5e8', other: '#fffdfa',
          major: '#fff1e0', highway: '#f8dfc2', railway: '#d9cbbb', boundaries: '#c9b6a3',
          minor_service_casing: LINEA, minor_casing: LINEA, link_casing: LINEA, other_casing: LINEA,
          major_casing_early: LINEA, major_casing_late: LINEA, highway_casing_early: '#dcc6ad', highway_casing_late: '#dcc6ad',
          tunnel_other_casing: LINEA, tunnel_minor_casing: LINEA, tunnel_link_casing: LINEA, tunnel_major_casing: LINEA, tunnel_highway_casing: '#dcc6ad',
          bridges_other_casing: LINEA, bridges_minor_casing: LINEA, bridges_link_casing: LINEA, bridges_major_casing: LINEA, bridges_highway_casing: '#dcc6ad',
          roads_label_minor: TENUE, roads_label_major: SUAVE, roads_label_minor_halo: PAPEL, roads_label_major_halo: PAPEL,
          city_label: TINTA, city_label_halo: PAPEL, subplace_label: SUAVE, subplace_label_halo: PAPEL,
          state_label: TENUE, state_label_halo: PAPEL, country_label: SUAVE, ocean_label: '#7fb3c4',
        };

        const estilo = {
          version: 8 as const,
          glyphs: raiz('/uploads/mapa/fonts/{fontstack}/{range}.pbf'),
          sprite: raiz('/uploads/mapa/sprites/v4/light'),
          sources: { protomaps: { type: 'vector' as const, url: `pmtiles://${raiz(PMTILES)}`, attribution: ATRIBUCION } },
          // Fuera los POI y los números de casa del basemap: los puntos de esta
          // página son los nuestros, y un mapa con dos capas de puntos no se lee.
          // Una sola familia para TODO el mapa. El estilo de Protomaps pide
          // Noto Sans en Regular, Medium e Itálica, y cada una son ~76 KB de
          // glifos: tres familias se comían 228 KB de los 1.000 del presupuesto
          // (PRINCIPIOS.md) para una diferencia que nadie nota en un rótulo de
          // 11 px. Con una sola, 76 KB.
          layers: layers('protomaps', sabor, { lang: 'es' })
            .filter((l) => !/^(pois|address_label)/.test(l.id))
            .map((l) => (l.layout && 'text-font' in l.layout ? { ...l, layout: { ...l.layout, 'text-font': ['Noto Sans Regular'] } } : l)),
        };

        const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const m = new maplibregl.Map({
          container: caja.current,
          style: estilo as never,
          center: CENTRO,
          zoom: 9.2,
          minZoom: 8,
          maxZoom: 17,
          maxBounds: [[-65.1, 10.2], [-63.4, 11.5]],
          attributionControl: { compact: true },
          dragRotate: false,
          touchPitch: false,
        });
        mapa.current = m;
        m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
        m.addControl(new maplibregl.ScaleControl({ maxWidth: 96, unit: 'metric' }), 'bottom-left');

        m.on('error', (e: { error?: { message?: string } }) => {
          // Un 404 de una tesela no debe tumbar la página; el estilo sí.
          const msg = String(e?.error?.message ?? '');
          console.error('[mapa]', msg);
          if (/style|sprite|glyph/i.test(msg)) setError('No se pudo cargar el mapa. La lista de abajo funciona igual.');
        });

        m.on('load', () => {
          if (!vivo) return;
          for (const c of CATEGORIAS) m.addImage(`ic-${c.key}`, pinEmoji(c.emoji, AROS[c.grupo]), { pixelRatio: 2 });
          m.addImage('ic-alojamiento', pinEmoji(EMOJI.alojamiento, ORO, true), { pixelRatio: 2 });

          m.addSource('radio', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          m.addLayer({ id: 'radio-fondo', type: 'fill', source: 'radio', paint: { 'fill-color': MAR, 'fill-opacity': 0.07 } });
          m.addLayer({ id: 'radio-borde', type: 'line', source: 'radio', paint: { 'line-color': HONDO, 'line-width': 1.4, 'line-dasharray': [2, 2], 'line-opacity': 0.5 } });

          m.addSource('lugares', { type: 'geojson', data: fc(lugares), cluster: true, clusterRadius: 46, clusterMaxZoom: 12 });
          m.addLayer({
            id: 'grupos', type: 'circle', source: 'lugares', filter: ['has', 'point_count'],
            paint: {
              'circle-color': HONDO, 'circle-opacity': 0.92, 'circle-stroke-color': PAPEL, 'circle-stroke-width': 2.5,
              'circle-radius': ['step', ['get', 'point_count'], 17, 6, 21, 15, 26],
            },
          });
          m.addLayer({
            id: 'grupos-num', type: 'symbol', source: 'lugares', filter: ['has', 'point_count'],
            layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Regular'], 'text-size': 13.5 },
            paint: { 'text-color': PAPEL },
          });
          m.addLayer({
            id: 'lugares-pin', type: 'symbol', source: 'lugares', filter: ['!', ['has', 'point_count']],
            layout: {
              'icon-image': ['concat', 'ic-', ['get', 'categoria']],
              'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.72, 13, 0.9, 16, 1],
              'icon-allow-overlap': true, 'icon-anchor': 'center',
              'text-field': ['step', ['zoom'], '', 13.6, ['get', 'nombre']], 'text-font': ['Noto Sans Regular'], 'text-size': 11.5,
              'text-offset': [0, 1.5], 'text-anchor': 'top', 'text-optional': true, 'text-max-width': 9,
            },
            paint: { 'text-color': SUAVE, 'text-halo-color': PAPEL, 'text-halo-width': 1.6 },
            minzoom: 8,
          });
          m.addSource('casas', { type: 'geojson', data: fc(separa(casas)) });
          m.addLayer({
            id: 'casas-pin', type: 'symbol', source: 'casas',
            layout: {
              'icon-image': 'ic-alojamiento', 'icon-allow-overlap': true,
              'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.8, 13, 1, 16, 1.1],
              'text-field': ['step', ['zoom'], '', 11.5, ['get', 'nombre']], 'text-font': ['Noto Sans Regular'],
              'text-size': 12, 'text-offset': [0, 1.6], 'text-anchor': 'top', 'text-max-width': 9,
            },
            paint: { 'text-color': HONDO, 'text-halo-color': PAPEL, 'text-halo-width': 1.8 },
          });

          const mano = (v: string) => () => { m.getCanvas().style.cursor = v; };
          for (const capa of ['lugares-pin', 'casas-pin', 'grupos']) {
            m.on('mouseenter', capa, mano('pointer'));
            m.on('mouseleave', capa, mano(''));
          }
          m.on('click', 'grupos', (e: MapMouseEvent) => {
            const f = m.queryRenderedFeatures(e.point, { layers: ['grupos'] })[0];
            const fuente = m.getSource('lugares') as GeoJSONSource;
            fuente.getClusterExpansionZoom(f.properties.cluster_id as number).then((z) => {
              m.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: z + 0.2, duration: 600 });
            });
          });
          const abrir = (tipo: 'lugar' | 'alojamiento') => (e: { features?: GeoJSON.Feature[] }) => {
            const slug = e.features?.[0]?.properties?.slug as string | undefined;
            const p = slug ? porSlug.get(`${tipo}:${slug}`) : null;
            if (p) elegir(p);
          };
          m.on('click', 'lugares-pin', abrir('lugar'));
          m.on('click', 'casas-pin', abrir('alojamiento'));
          m.on('click', (e: MapMouseEvent) => {
            if (m.queryRenderedFeatures(e.point, { layers: ['lugares-pin', 'casas-pin', 'grupos'] }).length === 0) setSel(null);
          });

          setListo(true);
          // La isla encuadrada al tamaño real de la pantalla, con una entrada
          // corta. Sin giros ni pitch: es un mapa para buscar una farmacia, no
          // la intro de un videojuego.
          const movil = window.innerWidth < 640;
          // El padding superior deja libre la tira de chips, que flota encima.
          m.fitBounds(movil ? ISLA_MOVIL : ISLA, {
            padding: movil ? { top: 130, bottom: 24, left: 16, right: 16 } : { top: 96, bottom: 40, left: 40, right: 40 },
            duration: quieto ? 0 : 1800,
          });
        });
      } catch (e) {
        setError(`No se pudo cargar el mapa (${(e as Error).message}). La lista de abajo funciona igual.`);
      }
    })();
    return () => { vivo = false; mapa.current?.remove(); mapa.current = null; };
  }, [lugares, casas, porSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtros: se recalcula el GeoJSON para que los grupos se rehagan ───────
  useEffect(() => {
    const m = mapa.current;
    if (!m || !listo) return;
    (m.getSource('lugares') as GeoJSONSource | undefined)?.setData(fc(visibles));
  }, [visibles, listo]);

  // ── Anillo de «a pie desde el apartamento» ────────────────────────────────
  useEffect(() => {
    const m = mapa.current;
    if (!m || !listo) return;
    const fuente = m.getSource('radio') as GeoJSONSource | undefined;
    if (!fuente) return;
    if (!casaBase) { fuente.setData({ type: 'FeatureCollection', features: [] }); return; }
    fuente.setData(circulo(casaBase, 1));
    m.easeTo({ center: [casaBase.lng, casaBase.lat], zoom: 13.6, duration: 900 });
  }, [casaBase, listo]);

  const ubicarme = useCallback(() => {
    if (!navigator.geolocation) { setError('Tu navegador no comparte la ubicación.'); return; }
    setBuscandoYo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBuscandoYo(false);
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setYo(p);
        const m = mapa.current;
        if (!m) return;
        import('maplibre-gl').then((maplibregl) => {
          marcaYo.current?.remove();
          const el = document.createElement('div');
          el.className = 'mapa-yo';
          marcaYo.current = new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(m);
          m.easeTo({ center: [p.lng, p.lat], zoom: 14, duration: 1200 });
        });
      },
      () => { setBuscandoYo(false); setError('No pudimos leer tu ubicación. Revisa el permiso del navegador.'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const distanciaDe = (p: PuntoMapa) => {
    if (yo) return `${distanciaCorta(km(yo, p))} de donde estás`;
    if (casaBase && casaBase.slug !== p.slug) return `${distanciaCorta(km(casaBase, p))} de ${casaBase.nombre}`;
    return null;
  };
  const comoLlegar = (p: PuntoMapa) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;

  const chip = 'inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-chip border px-3 text-ui font-medium transition-colors';
  const chipOff = `${chip} border-line bg-paper/90 text-ink-soft hover:border-brand/40`;
  const chipOn = `${chip} border-brand-deep bg-brand-deep text-white`;

  return (
    <div className="relative">
      <div className="relative h-[calc(100svh_-_11rem)] min-h-[440px] max-h-[860px] w-full overflow-hidden rounded-panel border border-line bg-paper-warm shadow-lift">
        {/* Alto propio, no `absolute inset-0`: la hoja de MapLibre le pone
            `position: relative` al contenedor y anula el inset. */}
        <div ref={caja} className="h-full w-full" aria-label="Mapa de la Isla de Margarita" role="application" />

        {!listo && !error && (
          <div className="absolute inset-0 grid place-items-center bg-paper-warm">
            <p className="text-meta text-ink-muted">Dibujando la isla…</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-x-0 top-0 z-30 m-3 rounded-control border border-line bg-paper p-3 text-meta text-ink-soft shadow-lift">{error}</div>
        )}

        {/* Filtros arriba: no tapan el mapa, solo su propia altura */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3">
          <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button type="button" onClick={() => setCat(null)} className={cat === null ? chipOn : chipOff}>
              Todo <span className="opacity-60">{visibles.length}</span>
            </button>
            {CATEGORIAS.filter((c) => cuenta(c.key) > 0).map((c) => (
              <button key={c.key} type="button" onClick={() => setCat(cat === c.key ? null : c.key)} className={cat === c.key ? chipOn : chipOff}>
                <span aria-hidden>{c.emoji}</span> {c.label} <span className="opacity-60">{cuenta(c.key)}</span>
              </button>
            ))}
          </div>

          {casas.length > 0 && (
            <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="inline-flex min-h-[38px] shrink-0 items-center rounded-chip bg-paper/90 px-3 text-ui text-ink-muted">A pie desde</span>
              {casas.map((c) => (
                <button key={c.slug} type="button" onClick={() => setBase(base === c.slug ? null : c.slug)} className={base === c.slug ? chipOn : chipOff}>
                  {c.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botón de ubicación, separado de los controles de zoom de MapLibre */}
        <div className="absolute bottom-40 right-3 z-10 flex flex-col gap-2">
          <button
            type="button" onClick={ubicarme} disabled={buscandoYo}
            className="grid h-11 w-11 place-items-center rounded-control border border-line bg-paper text-lg shadow-lift transition-colors hover:border-brand/40 disabled:opacity-60"
            title="¿Dónde estoy?" aria-label="Ver dónde estoy"
          >
            {buscandoYo ? '…' : '◎'}
          </button>
        </div>

        {/* Lo que queda cerca: el puente entre el mapa y el negocio */}
        {casaBase && !sel && (
          <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 rounded-panel border border-line bg-paper/95 p-4 shadow-lift backdrop-blur md:inset-x-auto md:bottom-auto md:left-3 md:top-[7.75rem] md:w-80">
            <p className="text-ui font-medium text-brand-deep">A pie desde {casaBase.nombre}</p>
            <p className="mt-1 text-meta text-ink-muted">
              {visibles.length === 0 ? 'Nada de esta categoría a menos de 1 km.' : `${visibles.length} ${visibles.length === 1 ? 'lugar' : 'lugares'} a menos de 1 km (unos 12 minutos caminando).`}
            </p>
            {cerca && cerca.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5">
                {cerca.map(({ l, d }) => (
                  <li key={l.slug}>
                    <button type="button" onClick={() => elegir(l)} className="flex w-full items-center gap-2 text-left text-meta text-ink-soft hover:text-brand">
                      <span aria-hidden>{EMOJI[l.categoria] ?? '📍'}</span>
                      <span className="flex-1 truncate">{l.nombre}</span>
                      <span className="tabular-nums text-ink-muted">{distanciaCorta(d)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Ficha del punto elegido */}
        {sel && (
          <aside className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 overflow-hidden rounded-panel border border-line bg-paper shadow-lift md:inset-x-auto md:bottom-auto md:left-3 md:top-[7.75rem] md:w-96">
            <div className="flex gap-3 p-3">
              {sel.foto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sel.foto} alt="" width={96} height={96} loading="lazy" className="h-24 w-24 shrink-0 rounded-control object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-body font-medium leading-tight text-ink">{sel.nombre}</p>
                  <button type="button" onClick={() => { setSel(null); marcaSel.current?.remove(); }} className="-mr-1 -mt-1 shrink-0 p-1 text-ink-muted hover:text-ink" aria-label="Cerrar">✕</button>
                </div>
                <p className="mt-0.5 text-meta text-ink-muted">
                  {sel.tipo === 'alojamiento' ? `US$${sel.precio} la noche · hasta ${sel.personas} personas` : `${categoriaLabel(sel.categoria)}${sel.zona ? ` · ${sel.zona}` : ''}`}
                  {sel.rating ? ` · ★ ${sel.rating.toFixed(1).replace('.', ',')}${sel.resenas ? ` (${sel.resenas})` : ''}` : ''}
                </p>
                {distanciaDe(sel) && <p className="mt-1 text-meta text-brand">A {distanciaDe(sel)}</p>}
                {sel.aliado && <p className="mt-1 text-meta text-oro-deep">Recomendado por Margarita Renace</p>}
              </div>
            </div>
            {sel.consejo && <p className="px-3 pb-3 text-meta leading-snug text-ink-soft">{sel.consejo}</p>}
            <div className="flex flex-wrap gap-2 border-t border-line bg-paper-warm p-3">
              <Link href={sel.tipo === 'alojamiento' ? `/propiedad/${sel.slug}` : `/guia/${sel.slug}`} className="inline-flex min-h-[40px] items-center rounded-control bg-brand-deep px-3.5 text-ui font-medium text-white hover:bg-brand">
                {sel.tipo === 'alojamiento' ? 'Ver el apartamento' : 'Ver la ficha'}
              </Link>
              <a href={comoLlegar(sel)} target="_blank" rel="noopener" className="inline-flex min-h-[40px] items-center rounded-control border border-line bg-paper px-3.5 text-ui font-medium text-brand-deep hover:border-brand/40">Cómo llegar</a>
              {sel.telefono && (
                <a href={`tel:${sel.telefono.replace(/[^\d+]/g, '')}`} className="inline-flex min-h-[40px] items-center rounded-control border border-line bg-paper px-3.5 text-ui font-medium text-brand-deep hover:border-brand/40">Llamar</a>
              )}
            </div>
            {sel.tipo === 'alojamiento' && (
              <p className="border-t border-line px-3 py-2 text-micro text-ink-muted">Ubicación aproximada: marcamos la urbanización, no la puerta.</p>
            )}
          </aside>
        )}
      </div>

      <style>{`
        .mapa-pulso { width: 44px; height: 44px; border-radius: 999px; border: 2px solid ${HONDO}; background: rgba(18,110,139,.12); animation: mapa-latido 1.8s ease-out infinite; }
        .mapa-yo { width: 18px; height: 18px; border-radius: 999px; background: ${MAR}; border: 3px solid ${PAPEL}; box-shadow: 0 0 0 4px rgba(18,110,139,.25); }
        @keyframes mapa-latido { 0% { transform: scale(.75); opacity: 1 } 100% { transform: scale(1.35); opacity: 0 } }
        @media (prefers-reduced-motion: reduce) { .mapa-pulso { animation: none } }
        .maplibregl-ctrl-group { border: 1px solid ${LINEA} !important; border-radius: 12px !important; background: ${PAPEL} !important; box-shadow: 0 8px 20px -12px rgba(43,38,34,.45) !important; }
        .maplibregl-ctrl-attrib { background: rgba(255,248,242,.86) !important; font-size: 11px !important; }
        .maplibregl-ctrl-attrib a { color: ${SUAVE} !important; }
      `}</style>
    </div>
  );
}

/**
 * Dos apartamentos de la misma urbanización comparten coordenada (es el punto
 * del sector, no la puerta). Sin esto uno queda debajo del otro y parece que
 * falta: se separan unos metros al dibujar, sin tocar el dato guardado.
 */
function separa(casas: PuntoMapa[]): PuntoMapa[] {
  const vistos = new Map<string, number>();
  return casas.map((c) => {
    const k = `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;
    const n = vistos.get(k) ?? 0;
    vistos.set(k, n + 1);
    if (n === 0) return c;
    const a = (n * 2 * Math.PI) / 6;
    return { ...c, lat: c.lat + 0.00035 * Math.sin(a), lng: c.lng + 0.00035 * Math.cos(a) };
  });
}
