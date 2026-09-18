import Link from 'next/link';
import { CATEGORIAS, type Lugar } from '@/lib/guia-comun';

// Enlaces de verdad en el HTML, también sin JavaScript. No duplicamos las
// tarjetas ni sus fotos para hacer descubribles las fichas tras «Ver más».
export default function IndiceGuia({ lugares }: { lugares: Pick<Lugar, 'slug' | 'nombre' | 'categoria'>[] }) {
  return (
    <details className="mt-8 rounded-panel border border-line bg-white p-5">
      <summary className="cursor-pointer text-body font-medium text-brand-deep">Índice de lugares y servicios ({lugares.length})</summary>
      <p className="mt-3 text-meta text-ink-soft">Busca un lugar por nombre o categoría y abre su ficha.</p>
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIAS.map((cat) => {
          const grupo = lugares.filter((l) => l.categoria === cat.key);
          return grupo.length ? <section key={cat.key}>
            <h3 className="font-serif text-title-sm text-ink">{cat.plural}</h3>
            <ul className="mt-2 space-y-1">{grupo.map((l) => <li key={l.slug}><Link prefetch={false} href={`/guia/${l.slug}`} className="inline-block py-1 text-meta text-brand-deep underline underline-offset-4">{l.nombre}</Link></li>)}</ul>
          </section> : null;
        })}
      </div>
    </details>
  );
}
