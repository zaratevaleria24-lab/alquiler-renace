import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/site';

// Tarjeta social de 1200x630 generada en build. Es lo que se ve al compartir el
// enlace en WhatsApp, Instagram, Facebook o X — y en Venezuela WhatsApp es el
// canal principal, así que esta imagen es parte del producto, no un adorno.
//
// Se genera en vez de usar una foto suelta para que el nombre y la propuesta
// sean legibles en la miniatura. Sin fuentes externas: `next/og` trae la suya,
// así que el build no depende de descargar nada (y ninguna regla de CDN se
// rompe, porque esto se resuelve en build, no en el navegador del usuario).

export const alt =
  'Margarita Renace — alquiler de apartamentos y autos en Isla de Margarita';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          // Degradado teal de la identidad del sitio (ver CLAUDE.md).
          backgroundImage:
            'linear-gradient(135deg, #0C4A5A 0%, #0E7490 55%, #21BBBB 100%)',
          color: 'white',
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 8,
            textTransform: 'uppercase',
            color: '#5EEAD4',
            marginBottom: 28,
          }}
        >
          {/* Un solo hijo de texto a propósito: satori exige display:flex en
              cualquier div con más de un nodo hijo, y dos interpolaciones
              sueltas cuentan como dos hijos. */}
          {`${SITE.region.island} · ${SITE.region.countryName}`}
        </div>
        <div
          style={{
            fontSize: 82,
            fontWeight: 700,
            lineHeight: 1.05,
            marginBottom: 28,
            maxWidth: 940,
          }}
        >
          Alquiler de Apartamentos y Autos
        </div>
        <div style={{ fontSize: 38, color: 'rgba(255,255,255,0.92)' }}>
          Pampatar · Porlamar · El Yaque · Juan Griego · Manzanillo
        </div>
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            fontSize: 34,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 14,
              height: 56,
              background: '#5EEAD4',
              borderRadius: 8,
            }}
          />
          {SITE.name}
        </div>
      </div>
    ),
    size,
  );
}
