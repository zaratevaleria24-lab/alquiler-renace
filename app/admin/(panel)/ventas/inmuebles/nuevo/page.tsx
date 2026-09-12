import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getCatalogosAdmin } from '@/lib/admin';
import { Aviso } from '../../../_ui';
import InmuebleForm from '../../InmuebleForm';
import { crearInmuebleAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function NuevoInmueblePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, { zonas }] = await Promise.all([searchParams, getCatalogosAdmin()]);
  return (
    <div>
      <nav aria-label="Ruta" className="text-ui">
        <Link href="/admin/ventas/inmuebles" className="inline-flex items-center gap-1.5 text-ink-muted hover:text-brand"><ChevronLeft className="h-4 w-4" /> Inmuebles</Link>
      </nav>
      <header className="mt-5">
        <p className="text-meta font-semibold text-ink-subtle">En venta</p>
        <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">Nuevo inmueble</h1>
      </header>
      {error && <Aviso tono="error">Faltan datos obligatorios: título y zona.</Aviso>}
      <div className="mt-4"><InmuebleForm action={crearInmuebleAction} zonas={zonas} /></div>
    </div>
  );
}
