import Link from 'next/link';
import { getCatalogosAdmin } from '@/lib/admin';
import PropiedadForm from '../PropiedadForm';
import { crearPropiedadAction } from '../actions';

// Alta de propiedad. Nace COMO BORRADOR por defecto: primero se crea, después
// se le suben las fotos (en la pantalla de edición, a donde redirige la
// action), y publicar es una decisión aparte. Una propiedad sin foto publicada
// de una vez se vería rota en la web.

export const dynamic = 'force-dynamic';

export default async function NuevaPropiedadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, catalogos] = await Promise.all([
    searchParams,
    getCatalogosAdmin(),
  ]);

  return (
    <div className="max-w-3xl">
      <nav aria-label="Ruta" className="text-ui text-ink-muted">
        <Link href="/admin/propiedades" className="underline-offset-4 hover:underline">
          ← Propiedades
        </Link>
      </nav>

      <header className="mt-6">
        <p className="label-eyebrow text-ink-subtle">Nueva propiedad</p>
        <h1 className="mt-3 font-serif text-headline font-normal track-headline text-ink">
          Sumar <em className="headline-italic">inventario</em>
        </h1>
        <p className="mt-5 max-w-2xl text-body text-ink-soft">
          La dirección de la página pública se genera sola a partir del nombre.
          Al crear, pasas directo a subir las fotos.
        </p>
      </header>

      {error && (
        <p className="mt-8 rounded-card border border-coral/35 bg-coral/5 px-5 py-4 text-body text-ink">
          {error === 'faltan-datos'
            ? 'Faltan datos obligatorios: nombre, zona y dirección no pueden quedar vacíos.'
            : 'No se pudo crear. Revisa los datos e intenta otra vez.'}
        </p>
      )}

      <PropiedadForm action={crearPropiedadAction} catalogos={catalogos} />
    </div>
  );
}
