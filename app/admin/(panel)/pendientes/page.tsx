import { redirect } from 'next/navigation';

// «Lo que falta» se mudó dentro de Configuración el 2026-08-03: es una utilidad,
// no una sección de trabajo diario. Esta ruta se queda como redirección para no
// romper un marcador guardado ni un enlace viejo del propio panel.
export default function PendientesRedirect() {
  redirect('/admin/configuracion');
}
