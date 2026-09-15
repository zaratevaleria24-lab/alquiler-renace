// ¿Se puede volver atrás DENTRO del sitio? SOLO NAVEGADOR.
//
// La usan el botón «Volver» de la barra y el de la ficha de un lugar. Vivía
// duplicada en los dos y la regla tiene que ser la misma en ambos, o el mismo
// gesto se comporta distinto según dónde se toque.
//
// Se mira la página de la que se viene, no solo el largo del historial: en una
// pestaña recién abierta desde el QR del apartamento o desde Instagram el
// historial puede tener entradas y aun así no haber nada NUESTRO a lo que
// volver. En ese caso quien llama usa su enlace de respaldo.

export function puedeVolverAtras(): boolean {
  try {
    return (
      window.history.length > 1 &&
      !!document.referrer &&
      new URL(document.referrer).origin === window.location.origin
    );
  } catch {
    return false;
  }
}
