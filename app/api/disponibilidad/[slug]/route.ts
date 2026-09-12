import { NextResponse } from 'next/server';
import { getOcupadoPublico, hoyCaracas, sincronizarFeeds } from '@/lib/calendario';

// Disponibilidad pública de una propiedad, para el calendario de su página.
//
// POR QUÉ UNA API Y NO DATOS EN LA PÁGINA: /propiedad/<slug> es ESTÁTICA y se
// regenera solo cuando el panel publica algo. La disponibilidad cambia sola
// (una reserva nueva en Airbnb) sin que nadie toque el panel, así que no puede
// viajar en el HTML: el widget la pide acá en el navegador y la página sigue
// siendo estática y rápida.
//
// Solo rangos fusionados de fechas, nada más: ni origen, ni estado, ni cuántas
// reservas son. Es todo lo que el visitante necesita y todo lo que se cuenta.

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // El sync a demanda vive acá además de en el panel: si nadie abre el panel
  // en todo el día, el visitante igual ve el calendario de Airbnb de hace
  // menos de una hora. Si los feeds están frescos no hace nada; si Airbnb no
  // responde, se sirve lo guardado — viejo es mejor que error.
  try {
    await sincronizarFeeds();
  } catch (err) {
    console.error('[disponibilidad] sync falló:', err);
  }

  const ocupado = await getOcupadoPublico(slug);
  if (ocupado === null) {
    return NextResponse.json({ error: 'no existe' }, { status: 404 });
  }

  return NextResponse.json(
    { hoy: hoyCaracas(), ocupado },
    {
      headers: {
        // Caché corto en el borde: absorbe a los curiosos que recargan sin
        // dejar pasar un dato realmente viejo.
        'Cache-Control': 'public, max-age=0, s-maxage=300',
        'X-Robots-Tag': 'noindex',
      },
    },
  );
}
