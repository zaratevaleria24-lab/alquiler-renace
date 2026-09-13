import CuponBienvenida from './CuponBienvenida';
import { getProperties } from '@/lib/queries';

// Pasa al popup la lista corta de apartamentos (nombre y sector) para que la
// persona elija dónde aplicar el código.
export default async function CuponBienvenidaServer() {
  const props = await getProperties();
  const aptos = props.filter((p) => !p.priceOnRequest && p.pricePerNight > 0).map((p) => ({ slug: p.slug, nombre: p.name, sector: p.sector || p.zone }));
  return <CuponBienvenida aptos={aptos} />;
}
