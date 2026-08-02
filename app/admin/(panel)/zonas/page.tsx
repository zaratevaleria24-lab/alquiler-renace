// Marcador de posición: esta sección llega en los pasos 4 y 5 del CMS-PLAN.
// Existe para que la navegación del panel no lleve a un 404, que da la sensación
// de que algo está roto cuando en realidad está sin construir.

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div>
      <p className="label-eyebrow text-ink-subtle">Panel</p>
      <h1 className="mt-3 font-serif text-headline font-normal track-headline text-ink">
        Zonas <em className="headline-italic">en construcción</em>
      </h1>
      <p className="mt-6 max-w-2xl text-body text-ink-soft">
        Esta sección todavía no está lista. El resumen ya muestra el estado real
        del inventario; esto llega en el siguiente paso.
      </p>
    </div>
  );
}
