import { NextResponse } from 'next/server';
import { fotoGoogle, getLugares } from '@/lib/guia';

// Proxy de fotos de Google Places. Google no permite guardar sus fotos, así que
// se piden al vuelo y se cachean en memoria unas horas. El navegador del
// visitante las cachea un día. Venezuela bloquea varios CDNs: pasar por nuestro
// servidor evita el problema y oculta la clave.
export async function GET(req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  // Dos tamaños y nada más: 480 para tarjetas, 1200 para la galería.
  const ancho = new URL(req.url).searchParams.get('w') === '480' ? 480 : 1200;
  const lugar = (await getLugares()).find((l) => l.id === id);
  const foto = lugar?.fotosGoogle[Number(n)];
  if (!lugar || !foto) return new NextResponse('no existe', { status: 404 });
  const r = await fotoGoogle(foto.name, ancho);
  if (!r) return new NextResponse('sin foto', { status: 502 });
  return new NextResponse(new Uint8Array(r.datos), {
    headers: { 'Content-Type': r.tipo, 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', 'X-Foto-Credito': encodeURIComponent(foto.autor) },
  });
}
