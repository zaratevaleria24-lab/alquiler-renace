// URLs retiradas del sitio — señalización correcta para los buscadores.
//
// ── CONTEXTO (2026-08-24) ───────────────────────────────────────────────────
// El sitio llegó a publicar 12 propiedades, de las que 8 eran de relleno:
// anfitriones inventados, fotos de stock y valoraciones que no salían de
// ninguna reseña. Se eliminaron por lo que está escrito en DATOS-PENDIENTES.md
// —"un sitio con 4 propiedades reales posiciona mejor que uno con 12
// inventadas"— y sus URLs se quedaron devolviendo 404.
//
// ── POR QUÉ 410 Y NO 404 ────────────────────────────────────────────────────
// Un 404 le dice a Google "no lo encuentro, quizá vuelva": lo reintenta
// durante meses y el informe de indexación se queda en rojo. Un 410 dice
// "eliminado permanentemente" y lo descarta mucho antes. Estas 8 fichas eran
// inventadas: no van a volver nunca, así que el 410 es literalmente la verdad.
//
// Verificado en los logs de nginx: semanas después, Googlebot y Bingbot
// seguían pidiéndolas (Bing con más insistencia — 19 peticiones contra 7).
//
// ── ESTE CONJUNTO ES CERRADO ────────────────────────────────────────────────
// No agregar aquí una propiedad que se despublique temporalmente desde el
// panel: para eso el 404 es lo correcto, porque puede volver. Esto es solo
// para lo que se borró para siempre.
export const FICHAS_RETIRADAS: ReadonlySet<string> = new Set([
  'apartamento-juan-griego',
  'apartamento-marina-pampatar',
  'apartamento-playa-guacuco',
  'studio-centro-porlamar',
  'studio-playa-parguito',
  'suite-frente-al-mar-pampatar',
  'suite-manzanillo',
  'villa-playa-caribe',
]);

// Cuerpo mínimo del 410. Un 410 sin cuerpo es válido, pero si una persona
// llega por un enlace viejo merece entender qué pasó y tener por dónde seguir.
export const CUERPO_410 = `<!doctype html>
<html lang="es"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Este alojamiento ya no está publicado · Margarita Renace</title>
<style>
  :root{color-scheme:light dark}
  body{margin:0;min-height:100vh;display:grid;place-items:center;
       font:16px/1.6 system-ui,sans-serif;background:#0f1115;color:#e8e6e3;
       padding:2rem;text-align:center}
  h1{font-size:1.5rem;margin:0 0 .75rem}
  p{margin:0 0 1.5rem;max-width:34rem;color:#a8a5a0}
  a{display:inline-block;padding:.7rem 1.4rem;border-radius:999px;
    background:#e8e6e3;color:#0f1115;text-decoration:none;font-weight:600}
</style>
<h1>Este alojamiento ya no está publicado</h1>
<p>La ficha que buscas se retiró del sitio. Puedes ver los alojamientos
disponibles hoy en la Isla de Margarita desde la página principal.</p>
<a href="/">Ver alojamientos disponibles</a>
</html>`;
