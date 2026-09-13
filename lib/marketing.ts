// Etiquetas de marketing (Google Analytics 4, Meta Pixel). SOLO SERVIDOR.
// Los IDs viven en /etc/margarita-renace/marketing.env:
//   GA4_ID=G-XXXXXXXXXX
//   META_PIXEL_ID=1234567890
// Si el archivo no existe o está vacío, el sitio sigue SIN cookies ni banner
// (como hasta el 2026-09-13). Con un ID presente, el banner de consentimiento
// aparece y las etiquetas solo se cargan si la persona acepta.
import { readFileSync } from 'node:fs';

export interface Marketing { ga4: string | null; pixel: string | null }
let cache: Marketing | undefined;
export function marketing(): Marketing {
  if (cache) return cache;
  try {
    const t = readFileSync('/etc/margarita-renace/marketing.env', 'utf8');
    cache = { ga4: t.match(/^GA4_ID=\s*(G-[A-Z0-9]+)/m)?.[1] ?? null, pixel: t.match(/^META_PIXEL_ID=\s*(\d+)/m)?.[1] ?? null };
  } catch { cache = { ga4: null, pixel: null }; }
  return cache;
}
