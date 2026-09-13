'use client';

import { useEffect, useRef, useState } from 'react';

// Mapa de la guía con Google Maps. Se carga SOLO cuando el visitante lo pide
// (botón «Mapa»): así la lista, que es lo que más se usa desde el teléfono, no
// paga los ~150 KB del SDK. Si la clave no permite este dominio, se avisa y la
// lista sigue funcionando: el mapa es un extra, no la guía.

export interface PuntoMapa { slug: string; nombre: string; categoria: string; emoji: string; lat: number; lng: number; foto: string | null }

declare global { interface Window { google?: any; __mapaGuiaListo?: () => void } } // eslint-disable-line @typescript-eslint/no-explicit-any

export default function MapaGuia({ puntos, clave }: { puntos: PuntoMapa[]; clave: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto || !clave || !caja.current) return;
    const pintar = () => {
      const g = window.google;
      if (!g || !caja.current) return;
      const mapa = new g.maps.Map(caja.current, {
        center: { lat: 11.0, lng: -63.9 }, zoom: 10, mapTypeControl: false, streetViewControl: false, fullscreenControl: true,
        styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }, { featureType: 'transit', stylers: [{ visibility: 'off' }] }],
      });
      const info = new g.maps.InfoWindow();
      for (const p of puntos) {
        const m = new g.maps.Marker({
          map: mapa, position: { lat: p.lat, lng: p.lng }, title: p.nombre,
          label: { text: p.emoji, fontSize: '16px' },
          icon: { path: g.maps.SymbolPath.CIRCLE, scale: 15, fillColor: '#fff8f2', fillOpacity: 1, strokeColor: '#0b4a5c', strokeWeight: 1.5 },
        });
        m.addListener('click', () => {
          info.setContent(`<div style="font-family:system-ui;max-width:220px">${p.foto ? `<img src="${p.foto}" alt="" style="width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:8px">` : ''}<p style="margin:8px 0 2px;font-weight:600;color:#0b4a5c">${p.nombre}</p><a href="/guia/${p.slug}" style="color:#126e8b;font-size:13px">Ver ficha →</a></div>`);
          info.open({ map: mapa, anchor: m });
        });
      }
    };
    if (window.google?.maps) { pintar(); return; }
    window.__mapaGuiaListo = pintar;
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () =>
      setError('Google no permite el mapa en este dominio todavía. La lista de abajo funciona igual, y cada ficha tiene su botón «Cómo llegar».');
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${clave}&callback=__mapaGuiaListo&language=es&region=VE&loading=async`;
    s.async = true; s.onerror = () => setError('No se pudo cargar el mapa. La lista funciona igual.');
    document.head.appendChild(s);
  }, [abierto, clave, puntos]);

  if (!clave) return null;
  return (
    <div className="mt-4">
      {!abierto ? (
        <button type="button" onClick={() => setAbierto(true)} className="inline-flex min-h-[44px] items-center gap-2 rounded-chip border border-line bg-white px-4 text-meta font-medium text-brand-deep shadow-lift transition-all hover:border-brand/40">
          🗺 Ver en el mapa
        </button>
      ) : (
        <div className="overflow-hidden rounded-panel border border-line bg-white shadow-lift">
          {error ? <p className="p-5 text-meta text-ink-soft">{error}</p> : <div ref={caja} className="h-[60vh] min-h-[340px] w-full" aria-label="Mapa de la guía" />}
        </div>
      )}
    </div>
  );
}
