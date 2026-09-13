import { NextResponse } from 'next/server';
import { getContratoPorToken } from '@/lib/contratos';

// Descarga de las pruebas técnicas de un contrato firmado, para verificación
// independiente: ?tipo=tsr (sello RFC 3161), ?tipo=ots (prueba OpenTimestamps),
// ?tipo=firma (PNG de la firma) o ?tipo=texto (texto íntegro firmado).
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = await getContratoPorToken(token);
  if (!c || c.estado !== 'firmado') return new NextResponse('No encontrado', { status: 404 });
  const tipo = new URL(req.url).searchParams.get('tipo');
  const base = `contrato-${c.inmuebleSlug}-${c.checkIn}`;
  const bin = (b: Buffer, nombre: string, mime: string) => new NextResponse(new Uint8Array(b), { headers: { 'Content-Type': mime, 'Content-Disposition': `attachment; filename="${nombre}"`, 'X-Robots-Tag': 'noindex' } });
  if (tipo === 'tsr' && c.tsaToken) return bin(Buffer.from(c.tsaToken, 'base64'), `${base}.tsr`, 'application/timestamp-reply');
  if (tipo === 'ots' && c.otsPrueba) return bin(Buffer.from(c.otsPrueba, 'base64'), `${base}.firma.txt.ots`, 'application/octet-stream');
  if (tipo === 'firma' && c.firmaImagen) return bin(Buffer.from(c.firmaImagen.split(',')[1] ?? '', 'base64'), `${base}-firma.png`, 'image/png');
  if (tipo === 'hash') return bin(Buffer.from(c.firmaHash), `${base}.firma.txt`, 'text/plain');
  return new NextResponse('Tipo no válido', { status: 400 });
}
