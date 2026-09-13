import { NextResponse } from 'next/server';
import { procesarCorreoAirbnb } from '@/lib/airbnb-correo';
import { autorizado } from '@/lib/calendario-secreto';

// Webhook del Email Worker de Cloudflare (infra/cloudflare/airbnb-correo-worker.js).
// Recibe el correo crudo (message/rfc822) con el secreto en Authorization y
// las cabeceras X-Remitente / X-Destinatario del sobre SMTP. Ver AIRBNB-CORREO.md.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!autorizado(req)) return new NextResponse(null, { status: 404 });
  const crudo = await req.text();
  if (!crudo || crudo.length < 20) return NextResponse.json({ error: 'correo vacío' }, { status: 400 });
  if (crudo.length > 2_000_000) return NextResponse.json({ error: 'correo demasiado grande' }, { status: 413 });
  const r = await procesarCorreoAirbnb(crudo, {
    de: req.headers.get('x-remitente') || undefined,
    para: req.headers.get('x-destinatario') || undefined,
  });
  console.log(`[airbnb-correo] ${r.tipo}: ${r.resultado}`);
  return NextResponse.json(r, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
