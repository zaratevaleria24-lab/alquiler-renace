import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Download } from 'lucide-react';
import { Aviso, Tarjeta } from '../_ui';

// Plantillas de historias para Instagram: PNG 1080×1920 con el diseño del sitio
// y los datos reales (precio, ★ Airbnb, QR de la guía). Se regeneran con
// `node scripts/plantillas-historias.cjs` cuando cambian precios o reseñas.
export const dynamic = 'force-dynamic';
const NOMBRES: Record<string, string> = { 'historia-precio-5-noches': '¿Cuánto cuestan 5 noches?', 'historia-guia-qr': 'La guía de la isla (QR)', 'historia-resenas-airbnb': 'Reseñas en Airbnb' };

export default function PlantillasPage() {
  const dir = join(process.cwd(), 'public', 'plantillas');
  let archivos: { nombre: string; titulo: string; kb: number; fecha: string }[] = [];
  try {
    archivos = readdirSync(dir).filter((f) => f.endsWith('.png')).map((f) => { const st = statSync(join(dir, f)); const base = f.replace(/\.png$/, ''); return { nombre: f, titulo: NOMBRES[base] ?? base.replace(/^historia-/, '').replace(/-/g, ' '), kb: Math.round(st.size / 1024), fecha: st.mtime.toLocaleDateString('es-VE') }; });
  } catch {}
  return (
    <div>
      <header><p className="text-meta font-semibold text-ink-subtle">Instagram</p><h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">Plantillas de historias</h1>
        <p className="mt-2 max-w-2xl text-meta text-ink-muted">1080×1920, listas para subir como historia o reel de portada. Llevan el precio, la valoración de Airbnb y el QR de la guía reales; se regeneran cuando cambian los datos.</p></header>
      {archivos.length === 0 && <Aviso tono="atencion">Todavía no hay plantillas generadas.</Aviso>}
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {archivos.map((a) => (
          <li key={a.nombre}><Tarjeta className="overflow-hidden">
            <img src={`/plantillas/${a.nombre}`} alt={a.titulo} width={540} height={960} loading="lazy" className="aspect-[9/16] w-full object-cover" />
            <div className="flex items-center justify-between gap-3 px-4 py-3"><div><p className="text-body font-semibold capitalize text-ink">{a.titulo}</p><p className="text-ui text-ink-muted">{a.kb} KB · {a.fecha}</p></div>
              <a href={`/plantillas/${a.nombre}`} download className="inline-flex min-h-[40px] items-center gap-1.5 rounded-control border border-line bg-white px-3 text-ui font-medium text-brand-deep hover:border-brand/40"><Download className="h-4 w-4" />Descargar</a></div>
          </Tarjeta></li>
        ))}
      </ul>
      <p className="mt-6 text-ui text-ink-muted">Consejos para publicar: ubicación exacta del apartamento, alt text «Apartamento en alquiler con piscina en Pampatar, Isla de Margarita», primera frase del caption con las palabras clave, y el enlace de la bio a margaritarenace.com.ve/enlaces. Plan completo en INSTAGRAM.md.</p>
    </div>
  );
}
