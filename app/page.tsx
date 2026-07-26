// Página de inicio. SERVER COMPONENT: consulta Postgres y pasa los datos al
// componente cliente, que es el que tiene el estado de búsqueda y filtros.
//
// POR QUÉ ESTA SEPARACIÓN: antes toda la home era un solo archivo 'use client'
// que importaba los listados desde un array en lib/listings.ts. Al mover los
// datos a la base, ese import dejó de ser viable: un componente cliente corre en
// el navegador y no puede abrir una conexión a Postgres.
//
// La página sigue siendo ESTÁTICA. Next ejecuta esta consulta en el build y
// sirve HTML; el visitante nunca provoca una consulta. Cuando el panel publique
// un cambio, revalidará esta ruta y se regenerará. Es lo que mantiene el sitio
// rápido para Venezuela sin renunciar a que el contenido sea editable.

import HomeClient from './HomeClient';
import { getCategories, getProperties, getZones } from '@/lib/queries';

export default async function Home() {
  // En paralelo: son tres consultas independientes y encadenarlas solo sumaría
  // latencia al build.
  const [properties, zones, categories] = await Promise.all([
    getProperties(),
    getZones(),
    getCategories(),
  ]);

  return (
    <HomeClient properties={properties} zones={zones} categories={categories} />
  );
}
