// Email Worker de Cloudflare: recibe lo que llega a airbnb@margaritarenace.com.ve
// y lo entrega crudo al webhook del sitio. Ver AIRBNB-CORREO.md.
//
// Cómo instalarlo (panel de Cloudflare, dominio margaritarenace.com.ve):
//   1. Workers & Pages → Create → Create Worker → nombre «airbnb-correo» → Deploy.
//   2. Edit code → pegar este archivo → Deploy.
//   3. Settings → Variables and Secrets → Add: SECRETO = (el valor de
//      CALENDARIO_SECRETO en /etc/margarita-renace/calendario.env del servidor).
//   4. Email → Email Routing → Routing rules → Create address:
//      airbnb@margaritarenace.com.ve → Action «Send to a Worker» → airbnb-correo.
// Solo acepta remitentes de Airbnb o de Google (la verificación del reenvío
// de Gmail llega desde forwarding-noreply@google.com). Lo demás se rechaza.
const REMITENTES_OK = /@(?:[a-z0-9-]+\.)?(airbnb\.com|airbnbmail\.com|google\.com|gmail\.com)$/i;
const WEBHOOK = 'https://margaritarenace.com.ve/api/airbnb/correo';

export default {
  async email(message, env) {
    if (!REMITENTES_OK.test(message.from)) {
      message.setReject('Remitente no permitido');
      return;
    }
    const crudo = await new Response(message.raw).text();
    const r = await fetch(WEBHOOK, {
      method: 'POST',
      headers: {
        'content-type': 'message/rfc822',
        authorization: `Bearer ${env.SECRETO}`,
        'x-remitente': message.from,
        'x-destinatario': message.to,
      },
      body: crudo,
    });
    if (!r.ok) throw new Error(`webhook respondió ${r.status}`); // Cloudflare reintenta
  },
};
