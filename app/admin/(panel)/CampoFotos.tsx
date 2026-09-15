'use client';

import { useRef, useState } from 'react';

// Campo de fotos del panel, que ENCOGE las imágenes en el navegador antes de
// enviarlas.
//
// EL PROBLEMA QUE RESUELVE: para publicar un apartamento hacen falta seis o diez
// fotos, y las de un teléfono pesan de 3 a 6 MB cada una. Eso son 40 MB por
// envío, y en el camino hay tres techos más bajos: nginx corta en 30 MB, el
// límite de Server Action de Next estaba en 15 MB, y el proceso vive con un
// tope de memoria que una subida así podía hacer saltar a mitad de carga. El
// resultado era una subida que fallaba sin decir por qué. Encima, subir 40 MB
// por una conexión venezolana es lento aunque todo lo demás aguante.
//
// Redimensionar acá convierte esos 40 MB en unos 2 o 3. El servidor las vuelve
// a procesar con sharp igual que antes (lib/uploads.ts): esto no sustituye esa
// optimización, solo evita que el archivo enorme tenga que viajar.
//
// SIGUE FUNCIONANDO SIN JAVASCRIPT. Es una mejora progresiva: si el guion no
// corre, el `input` es el de siempre y se envía la foto original. La regla del
// panel —que todo funcione sin JavaScript— se mantiene.
//
// Si una foto no se puede decodificar (HEIC de iPhone en algunos navegadores,
// formatos raros), se deja tal cual y que decida el servidor. Nunca se pierde
// una foto por intentar optimizarla.

const ANCHO_MAX = 1600; // el mismo que usa sharp en el servidor
const CALIDAD = 0.82;

async function encoger(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // el navegador no sabe leerla: que viaje entera
  }

  const escala = Math.min(1, ANCHO_MAX / bitmap.width);
  // Ya es pequeña y no es un formato pesado: no se toca.
  if (escala === 1 && file.size < 900_000) {
    bitmap.close();
    return file;
  }

  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(bitmap.width * escala);
  lienzo.height = Math.round(bitmap.height * escala);
  const ctx = lienzo.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((res) =>
    lienzo.toBlob(res, 'image/webp', CALIDAD),
  );
  // Si encoger no ahorró nada, se manda el original: no tiene sentido
  // reencodear una foto para dejarla peor y del mismo tamaño.
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', {
    type: 'image/webp',
    lastModified: file.lastModified,
  });
}

const mb = (bytes: number) => (bytes / 1_048_576).toFixed(1);

export default function CampoFotos({
  id,
  name,
  multiple,
  className,
}: {
  id: string;
  name: string;
  multiple?: boolean;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  async function alElegir() {
    const el = input.current;
    const elegidas = el?.files ? Array.from(el.files) : [];
    if (!el || elegidas.length === 0) {
      setEstado(null);
      return;
    }

    setTrabajando(true);
    setEstado(
      `Preparando ${elegidas.length} ${elegidas.length === 1 ? 'foto' : 'fotos'}…`,
    );
    try {
      const antes = elegidas.reduce((s, f) => s + f.size, 0);
      const listas = await Promise.all(elegidas.map(encoger));
      const despues = listas.reduce((s, f) => s + f.size, 0);

      // Así se sustituye lo que el formulario va a enviar: no se puede asignar
      // un array a `input.files`, hace falta un DataTransfer.
      const dt = new DataTransfer();
      for (const f of listas) dt.items.add(f);
      el.files = dt.files;

      setEstado(
        despues < antes
          ? `${listas.length} ${listas.length === 1 ? 'foto lista' : 'fotos listas'} · ${mb(antes)} MB → ${mb(despues)} MB`
          : `${listas.length} ${listas.length === 1 ? 'foto lista' : 'fotos listas'} · ${mb(despues)} MB`,
      );
    } catch {
      // Se deja lo que eligió la persona. El servidor tiene la última palabra.
      setEstado(`${elegidas.length} seleccionadas (sin optimizar)`);
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <>
      <input
        ref={input}
        id={id}
        type="file"
        name={name}
        required
        multiple={multiple}
        accept="image/*"
        onChange={alElegir}
        className={className}
      />
      {estado && (
        <span
          className="mt-3 block text-meta text-ink-muted"
          role="status"
          aria-live="polite"
        >
          {trabajando && (
            <span
              aria-hidden="true"
              className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-brand align-middle"
            />
          )}
          {estado}
        </span>
      )}
    </>
  );
}
