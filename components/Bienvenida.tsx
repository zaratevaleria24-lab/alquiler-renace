'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

// Bienvenida de la guía: la pantalla que ve quien escanea el QR mientras el
// resto carga. El emblema entra con un resorte suave, el nombre aparece, y una
// barra avanza con la carga REAL de la página (no un temporizador falso): al
// terminar, se va con un fundido. Dura entre 2,2 y 3,4 s (menos no se aprecia), y
// nunca más de una vez por sesión. Quien pidió menos movimiento no la ve.
//
// Librería: Motion (v12, ya en el proyecto). Se importa solo acá, así el resto
// del sitio no paga su peso.

export default function Bienvenida({ forzar = false }: { forzar?: boolean }) {
  const reducido = useReducedMotion();
  // Si se llega desde el QR (?desde=qr) la bienvenida viene ya en el HTML del
  // servidor: se ve al instante, sin esperar al JavaScript.
  const [visible, setVisible] = useState(forzar);
  const [progreso, setProgreso] = useState(0);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    // El QR de cada apartamento trae ?apto=<slug>: se recuerda en la sesión para
    // que los WhatsApp a los aliados digan «estoy hospedado en …».
    try { const a = new URLSearchParams(location.search).get('apto'); if (a) sessionStorage.setItem('mr:apto', a); } catch {}
    let vista = false;
    try { vista = sessionStorage.getItem('guia:bienvenida') === '1'; } catch {}
    // Solo en teléfono (donde llega el QR) y una vez por sesión; en escritorio
    // la guía sigue como siempre. Si se pide menos movimiento, no hay bienvenida.
    if (reducido || vista || (!forzar && window.innerWidth >= 768)) { setVisible(false); return; }
    setVisible(true);
    try { sessionStorage.setItem('guia:bienvenida', '1'); } catch {}
    const inicio = performance.now();
    let cargado = document.readyState === 'complete';
    const onLoad = () => { cargado = true; };
    window.addEventListener('load', onLoad);
    // Avanza con el tiempo hasta 85 % y salta al 100 % cuando la página terminó
    // de cargar y pasaron al menos 2,2 s; nunca espera más de 3,4 s.
    const t = setInterval(() => {
      const dt = performance.now() - inicio;
      const base = Math.min(85, (dt / 2000) * 85);
      const fin = (cargado && dt > 2200) || dt > 3400;
      setProgreso(fin ? 100 : base);
      if (fin) { clearInterval(t); setTimeout(() => setListo(true), 420); }
    }, 60);
    return () => { clearInterval(t); window.removeEventListener('load', onLoad); };
  }, [reducido, forzar]);

  return (
    <AnimatePresence>
      {visible && !listo && (
        <motion.div
          key="bienvenida"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-luz px-8 text-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02, transition: { duration: 0.45, ease: [0.2, 0, 0.2, 1] } }}
          aria-live="polite"
          aria-label="Cargando la guía"
        >
          <motion.img
            src="/logo-mark-teal.svg" alt="" width={120} height={120}
            className="h-[120px] w-[120px]"
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0.05 }}
          />
          <motion.p
            className="mt-6 font-serif text-[30px] font-semibold leading-none text-ink"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
          >
            Margarita <span className="text-accent">Renace</span>
          </motion.p>
          <motion.p
            className="label-eyebrow mt-2 text-brand-deep"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.5 }}
          >
            Bienvenido a la isla
          </motion.p>
          <div className="mt-10 h-1 w-48 overflow-hidden rounded-full bg-white/70">
            <motion.div
              className="h-full rounded-full bg-brand-deep"
              initial={{ width: '0%' }} animate={{ width: `${progreso}%` }}
              transition={{ ease: 'easeOut', duration: 0.25 }}
            />
          </div>
          <motion.p className="mt-3 text-ui text-ink-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            {progreso < 100 ? 'Preparando tu guía…' : 'Lista'}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
