// Cláusulas del contrato de hospedaje temporal. SEGURO PARA CLIENTE (solo texto).
//
// Cada cambio de fondo sube VERSION: el contrato guarda con qué versión se
// firmó y un hash del texto, así un contrato firmado nunca «cambia solo» al
// editar esto. Voz de IDENTIDAD.md: tú, corto, sin mayúsculas gritadas. El
// dueño debe validarlas con su abogado antes de usarlas con clientes.

export const VERSION = '2026-09-13.2';

export interface DatosContrato {
  arrendador: string; rif: string; representante: string; representanteCedula: string; domicilio: string; telefonoArrendador: string;
  huesped: string; documento: string; telefonoHuesped: string; email: string;
  integrantes: { nombre: string; documento: string }[];
  inmueble: string; direccionInmueble: string;
  checkIn: string; checkOut: string; horaEntrada: string; horaSalida: string; noches: number;
  huespedes: number; tarifaNoche: number; limpiezaUsd: number; totalUsd: number; anticipoUsd: number; depositoUsd: number;
  tasaBs: number | null; tasaFuente: string; metodoPago: string;
  notas: string;
}

export const bs = (n: number) => `Bs ${n.toLocaleString('es-VE', { maximumFractionDigits: 0 })}`;
export const usd = (n: number) => `US$ ${n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fecha = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });

export function clausulas(d: DatosContrato): { titulo: string; texto: string }[] {
  const saldo = Math.max(0, d.totalUsd - d.anticipoUsd);
  return [
    { titulo: 'Primera. Objeto', texto: `El arrendador cede al huésped, en calidad de hospedaje temporal con fines turísticos o vacacionales, el uso del inmueble «${d.inmueble}», ubicado en ${d.direccionInmueble}, amoblado y equipado según el inventario que se entrega al ingresar. Este contrato no constituye arrendamiento de vivienda principal ni genera derecho de permanencia.` },
    { titulo: 'Segunda. Duración y entrega', texto: `El hospedaje va desde el ${fecha(d.checkIn)} a partir de las ${d.horaEntrada} hasta el ${fecha(d.checkOut)} a las ${d.horaSalida}: ${d.noches} ${d.noches === 1 ? 'noche' : 'noches'}. El huésped se compromete a desocupar el inmueble en la fecha y hora de salida. La permanencia más allá de lo pactado sin autorización escrita del arrendador constituye ocupación indebida: el arrendador podrá exigir la desocupación inmediata y cobrar cada día adicional al doble de la tarifa por noche, sin perjuicio de las acciones legales. Cualquier extensión debe acordarse por escrito (WhatsApp o correo vale) y está sujeta a disponibilidad y al precio vigente.` },
    { titulo: 'Tercera. Precio y forma de pago', texto: `La tarifa es de ${usd(d.tarifaNoche)} por noche (${d.noches} ${d.noches === 1 ? 'noche' : 'noches'}: ${usd(d.tarifaNoche * d.noches)})${d.limpiezaUsd > 0 ? ` más ${usd(d.limpiezaUsd)} de limpieza, pago único` : ''}, para un total de ${usd(d.totalUsd)}. ${d.anticipoUsd > 0 ? `El huésped abona ${usd(d.anticipoUsd)} como anticipo para confirmar la reserva y el saldo de ${usd(saldo)} al ingresar.` : 'Se paga completo al ingresar, salvo acuerdo distinto por escrito.'} Los montos están expresados en dólares de los Estados Unidos de América a la tasa oficial del Banco Central de Venezuela (BCV). Si se paga en bolívares, se calcula al BCV del día del pago${d.tasaBs ? ` (a la fecha de este contrato, ${bs(d.tasaBs)} por US$, por lo que el total equivale a ${bs(d.totalUsd * d.tasaBs)})` : ''}. Si se paga en USDT, se calcula el equivalente del día tomando el monto en bolívares al BCV y la cotización USDT de Binance, informada por el arrendador. Métodos de pago aceptados: ${d.metodoPago}.` },
    { titulo: 'Cuarta. Depósito de garantía', texto: d.depositoUsd > 0
        ? `El huésped entrega ${usd(d.depositoUsd)} en depósito de garantía al ingresar. Se devuelve íntegro al salir, una vez revisado el inmueble, o dentro de las 24 horas siguientes si el pago fue electrónico. Del depósito se descuenta el costo de reponer o reparar lo que falte o se dañe por uso indebido; si el daño supera el depósito, el huésped cubre la diferencia.`
        : 'No se exige depósito de garantía. El huésped responde igualmente por los daños causados por uso indebido, según la cláusula octava.' },
    { titulo: 'Quinta. Capacidad y registro de huéspedes', texto: `El inmueble se cede para ${d.huespedes} ${d.huespedes === 1 ? 'persona' : 'personas'}${d.integrantes.length ? `, identificadas en este contrato: ${d.integrantes.map((i) => `${i.nombre} (${i.documento})`).join('; ')}` : ''}. Todos los ocupantes deben presentar cédula o pasaporte al ingresar; el huésped titular responde por sus acompañantes. No se admiten más ocupantes ni visitas que pernocten sin autorización previa del arrendador. El incumplimiento permite al arrendador dar por terminado el hospedaje sin reembolso.` },
    { titulo: 'Sexta. Normas de uso', texto: 'El huésped se compromete a: usar el inmueble solo como hospedaje; no hacer fiestas ni eventos; no fumar dentro del inmueble; respetar el descanso de los vecinos, en especial entre las 10 de la noche y las 8 de la mañana; cumplir las normas del conjunto residencial (piscina, áreas comunes, estacionamiento, seguridad); no ingresar mascotas salvo autorización escrita; y no subarrendar ni ceder el inmueble a terceros.' },
    { titulo: 'Séptima. Servicios', texto: 'El precio incluye agua, electricidad, internet y los enseres del inventario. El arrendador hace lo razonable para que funcionen, pero los cortes de electricidad, agua o internet atribuibles a los prestadores del servicio —frecuentes en la isla— no son responsabilidad del arrendador ni dan derecho a reembolso. Si el tanque de agua baja o falta gas, el huésped avisa y el arrendador lo gestiona a la brevedad.' },
    { titulo: 'Octava. Cuidado del inmueble y daños', texto: 'El huésped recibe el inmueble limpio y en buen estado, revisa el inventario al ingresar y reporta cualquier falla en las primeras 24 horas. Responde por los daños, pérdidas o roturas que él o sus acompañantes causen por uso indebido, así como por el extravío de llaves o controles de acceso. El desgaste normal por uso no se cobra.' },
    { titulo: 'Novena. Cancelación', texto: 'Si el huésped cancela con 7 días o más de anticipación a la fecha de entrada, se le devuelve el 100 % de lo pagado. Con menos de 7 días y más de 48 horas, el 50 %. Con menos de 48 horas o si no se presenta, no hay reembolso. Si el arrendador cancela por causa propia, devuelve el 100 % de lo pagado. En caso de fuerza mayor (cierre del aeropuerto, emergencia sanitaria, desastre natural) ambas partes acuerdan reprogramar las fechas sin penalidad.' },
    { titulo: 'Décima. Entrada y salida', texto: `La entrada es a partir de las ${d.horaEntrada} y la salida hasta las ${d.horaSalida}; horarios distintos se acuerdan por escrito y pueden tener costo. Al ingresar, el huésped presenta cédula o pasaporte. Al salir, entrega las llaves y deja el inmueble en condiciones razonables de orden.` },
    { titulo: 'Décima primera. Responsabilidad', texto: 'El arrendador no responde por objetos de valor dejados en el inmueble ni por accidentes en piscina, playa o áreas comunes, cuyo uso es bajo la exclusiva responsabilidad del huésped y sus acompañantes. Los menores de edad deben estar siempre acompañados por un adulto.' },
    { titulo: 'Décima segunda. Datos personales', texto: 'Los datos del huésped y de sus acompañantes se usan solo para este contrato, el registro de hospedaje exigido por las autoridades y la comunicación durante la estadía. No se comparten con terceros ni se usan para publicidad. Al firmar se registran, como prueba de la firma, la fecha y hora, la dirección IP, el dispositivo y navegador, el idioma y la zona horaria del equipo, y el código de verificación enviado al correo del huésped.' },
    { titulo: 'Décima tercera. Ley y jurisdicción', texto: 'Este contrato se rige por las leyes de la República Bolivariana de Venezuela. Para cualquier controversia las partes eligen como domicilio especial la ciudad de Porlamar, estado Nueva Esparta, a cuyos tribunales se someten, sin perjuicio de intentar antes un acuerdo directo.' },
    { titulo: 'Décima cuarta. Firma electrónica y prueba', texto: 'Las partes aceptan que este contrato se celebra por medios electrónicos, conforme al Decreto con Fuerza de Ley sobre Mensajes de Datos y Firmas Electrónicas (Gaceta Oficial N.º 37.148) y al artículo 1.363 del Código Civil. La firma trazada por el huésped en el enlace privado que recibió, junto con el código de verificación enviado a su correo, la fecha y hora, la huella digital (SHA-256) del texto íntegro del contrato y el sello criptográfico del servidor de margaritarenace.com.ve, constituyen la firma electrónica del huésped y tienen la misma eficacia probatoria que una firma manuscrita. La integridad del documento puede comprobarse en cualquier momento en la página de verificación del contrato. Cada parte conserva una copia.' },
    ...(d.notas.trim() ? [{ titulo: 'Décima quinta. Condiciones particulares', texto: d.notas.trim() }] : []),
  ];
}

/** El texto plano completo, para el hash de integridad. */
export function textoPlano(d: DatosContrato): string {
  return [
    `CONTRATO DE HOSPEDAJE TEMPORAL · versión ${VERSION}`,
    `Arrendador: ${d.arrendador} (${d.rif}) representado por ${d.representante} (${d.representanteCedula}), ${d.domicilio}, tel. ${d.telefonoArrendador}`,
    `Huésped titular: ${d.huesped} (${d.documento}), tel. ${d.telefonoHuesped}, ${d.email}`,
    `Integrantes: ${d.integrantes.map((i) => `${i.nombre} (${i.documento})`).join('; ') || '—'}`,
    `Inmueble: ${d.inmueble}, ${d.direccionInmueble}`,
    `Estadía: ${d.checkIn} ${d.horaEntrada} → ${d.checkOut} ${d.horaSalida}, ${d.noches} noches, ${d.huespedes} personas`,
    `Pago: tarifa ${d.tarifaNoche} × ${d.noches} + limpieza ${d.limpiezaUsd} = total ${d.totalUsd}; anticipo ${d.anticipoUsd}; depósito ${d.depositoUsd}; tasa ref ${d.tasaBs ?? '—'} (${d.tasaFuente}); pago: ${d.metodoPago}`,
    ...clausulas(d).map((c) => `${c.titulo}. ${c.texto}`),
  ].join('\n');
}
