'use client';
// Enlace del pie para volver a elegir las cookies (dispara el evento que
// escucha Consentimiento). Solo tiene sentido si hay etiquetas configuradas.
export default function BotonCookies({ className }: { className?: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event('mr:cookies'))}>Cookies</button>;
}
