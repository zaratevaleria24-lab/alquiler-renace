import { NextResponse } from 'next/server';
import { getTasas } from '@/lib/tasas';

// Tasa BCV pública, para mostrar los precios en bolívares.
//
// POR QUÉ UNA API Y NO EL DATO EN LA PÁGINA: `/propiedad/<slug>` es ESTÁTICA y
// solo se regenera cuando el panel publica algo. La tasa del BCV cambia a
// diario, así que hornearla en el HTML significaría publicar un precio viejo en
// bolívares hasta el siguiente despliegue — el peor error posible en esto. El
// panel de reserva la pide acá desde el navegador, igual que el calendario pide
// su disponibilidad, y la página sigue siendo estática.
//
// `getTasas()` ya resuelve el resto: lee el caché en `tasas`, y si está vencido
// lo refresca contra Siberia (127.0.0.1:8092) con respaldo en DolarAPI. Acá no
// se decide nada de eso.
//
// SE PUBLICA SOLO EL BCV, no la tasa de mercado ni la brecha. Esos dos datos
// son para el panel de administración —sirven para decidir a qué tasa conviene
// cobrar— y no tienen por qué viajar al navegador de un huésped.

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const t = await getTasas();

    // Sin tasa no se inventa nada: el panel muestra solo dólares. Es preferible
    // a publicar un bolívar equivocado.
    if (t.bcvUsd === null) {
      return NextResponse.json(
        { bcv: null, motivo: 'sin tasa disponible' },
        { status: 200, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
      );
    }

    return NextResponse.json(
      {
        bcv: t.bcvUsd,
        /** Cuándo publicó el BCV esta tasa. Se muestra junto al monto: un
         *  número sin fecha, si el servicio se queda pegado, se convierte en un
         *  precio equivocado publicado. */
        bcvAt: t.bcvAt,
        obtenidoAt: t.obtenidoAt,
        vencido: t.vencido,
      },
      {
        headers: {
          // 15 min en el borde: la tasa del BCV cambia como mucho una vez al
          // día, pero un caché corto deja que una corrección llegue rápido.
          'Cache-Control': 'public, max-age=0, s-maxage=900',
          'X-Robots-Tag': 'noindex',
        },
      },
    );
  } catch (err) {
    console.error('[tasa] falló:', err);
    return NextResponse.json(
      { bcv: null, motivo: 'error' },
      { status: 200, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
    );
  }
}
