import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Aviso } from '../../_ui';
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
    <div>
      <nav aria-label="Ruta" className="text-ui">
        <Link
          href="/admin/propiedades"
          className="inline-flex items-center gap-1.5 text-ink-muted transition-colors hover:text-brand"
        >
          <ChevronLeft className="h-4 w-4" />
          Propiedades
        </Link>
      </nav>

      <header className="mt-5">
        <p className="text-meta font-semibold text-ink-subtle">Nueva propiedad</p>
        <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
          Sumar <em className="headline-italic">inventario</em>
        </h1>
        <p className="mt-4 max-w-2xl text-body text-ink-soft">
          La dirección de la página pública se genera sola a partir del nombre.
          Nace como borrador y al crearla pasas directo a subir las fotos.
        </p>
      </header>

      {error && (
        <Aviso tono="error">
          {error === 'faltan-datos'
            ? 'Faltan datos obligatorios: nombre, zona y dirección no pueden quedar vacíos.'
            : 'No se pudo crear. Revisa los datos e intenta otra vez.'}
        </Aviso>
      )}

      <PropiedadForm action={crearPropiedadAction} catalogos={catalogos} />
    </div>
  );
}
