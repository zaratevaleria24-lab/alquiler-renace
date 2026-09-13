'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Consentimiento de cookies (Consent Mode v2 de Google + Meta Pixel).
//
// El sitio no pone cookies por sí mismo; las únicas cookies son las de las
// etiquetas de publicidad, y SOLO se cargan si la persona acepta. Sin
// aceptar, Analytics recibe señales anónimas sin cookies (consent mode
// «denied»), suficiente para medir campañas sin rastrear a nadie. La decisión
// se guarda en localStorage («mr:consentimiento») y se puede cambiar desde
// «Cookies» en el pie de página (evento «mr:cookies»).
declare global { interface Window { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; fbq?: ((...a: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: unknown }; _fbq?: unknown } }

const CLAVE = 'mr:consentimiento';
type Decision = 'si' | 'no' | null;

function cargarGa(id: string, permitido: boolean) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...a: unknown[]) { window.dataLayer!.push(a); };
  window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 });
  if (permitido) window.gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
  if (!document.getElementById('ga4')) {
    const s = document.createElement('script'); s.id = 'ga4'; s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`; document.head.appendChild(s);
  }
  window.gtag('js', new Date()); window.gtag('config', id, { anonymize_ip: true });
}
function cargarPixel(id: string) {
  if (window.fbq) return;
  const f = function (...a: unknown[]) { if (f.callMethod) (f.callMethod as (...x: unknown[]) => void)(...a); else f.queue!.push(a); } as NonNullable<Window['fbq']>;
  f.queue = []; f.loaded = true; f.version = '2.0'; window.fbq = f; window._fbq = f;
  const s = document.createElement('script'); s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.appendChild(s);
  window.fbq('init', id); window.fbq('track', 'PageView');
}

export default function Consentimiento({ ga4, pixel }: { ga4: string | null; pixel: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const hayEtiquetas = Boolean(ga4 || pixel);

  useEffect(() => {
    if (!hayEtiquetas) return;
    let d: Decision = null;
    try { d = localStorage.getItem(CLAVE) as Decision; } catch {}
    if (d === 'si') { if (ga4) cargarGa(ga4, true); if (pixel) cargarPixel(pixel); }
    else if (d === 'no') { if (ga4) cargarGa(ga4, false); }
    else setAbierto(true);
    const reabrir = () => setAbierto(true);
    window.addEventListener('mr:cookies', reabrir);
    return () => window.removeEventListener('mr:cookies', reabrir);
  }, [ga4, pixel, hayEtiquetas]);

  const decidir = (d: 'si' | 'no') => {
    try { localStorage.setItem(CLAVE, d); } catch {}
    setAbierto(false);
    if (d === 'si') { if (ga4) cargarGa(ga4, true); if (pixel) cargarPixel(pixel); }
    else if (ga4) cargarGa(ga4, false);
  };

  if (!hayEtiquetas || !abierto) return null;
  return (
    <div role="dialog" aria-live="polite" aria-label="Aviso de cookies" className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-xl rounded-panel border border-line bg-white p-4 shadow-lift-lg md:inset-x-auto md:right-6 md:bottom-6 md:p-5">
      <p className="text-meta leading-relaxed text-ink">
        Usamos cookies de medición y publicidad (Google, Meta) solo si aceptas: nos dicen si nuestros anuncios traen huéspedes. Sin aceptar, la web funciona igual y no te rastreamos.{' '}
        <Link href="/politicas#cookies" className="text-brand-deep underline underline-offset-4">Más detalles</Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => decidir('si')} className="btn-solid min-h-[42px] px-4 text-meta">Aceptar</button>
        <button type="button" onClick={() => decidir('no')} className="inline-flex min-h-[42px] items-center rounded-control border border-line bg-white px-4 text-meta font-medium text-brand-deep hover:border-brand/40">Solo lo necesario</button>
      </div>
    </div>
  );
}
