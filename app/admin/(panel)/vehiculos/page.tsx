// Marcador de posición: esta sección llega en los pasos 4 y 5 del CMS-PLAN.
// Existe para que la navegación del panel no lleve a un 404, que da la sensación
// de que algo está roto cuando en realidad está sin construir.

import { Car } from 'lucide-react';
import { Tarjeta } from '../_ui';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div>
      <header>
        <p className="text-meta font-semibold text-ink-subtle">Panel</p>
        <h1 className="mt-2 font-serif text-headline font-normal track-headline text-ink">
          Vehículos
        </h1>
      </header>

      <Tarjeta className="mt-10 p-8 text-center md:p-12">
        <span
          aria-hidden="true"
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-brand"
        >
          <Car className="h-6 w-6" />
        </span>
        <h2 className="mt-6 font-serif text-title font-normal track-title text-ink">
          En construcción
        </h2>
        <p className="mx-auto mt-3 max-w-md text-body text-ink-soft">
          La estructura en la base ya está lista y la página pública /autos existe. Falta esta pantalla para cargar la flota sin tocar código.
        </p>
      </Tarjeta>
    </div>
  );
}
