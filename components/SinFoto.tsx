// Hueco de un alojamiento que todavía no tiene fotos PROPIAS.
//
// POR QUÉ EXISTE: hasta el 2026-09-14 los alojamientos sin foto propia se
// rellenaban con fotos de banco — la foto de otra casa presentada como si fuera
// esta. Se quitaron todas (ver la migración 026) y con eso apareció el caso que
// el código nunca había tenido: portada vacía. Sin este componente el navegador
// resuelve <img src=""> contra la propia página y pinta una imagen rota.
//
// Decir «todavía no hay fotos» es mejor producto que enseñar una playa genérica:
// es la misma regla por la que el sitio no publica reseñas ni valoraciones
// inventadas (ver IDENTIDAD.md y lib/schema.ts).

export default function SinFoto({
  className = '',
  compacta = false,
}: {
  /** Las medidas las pone quien lo usa, igual que a la <img> que sustituye. */
  className?: string;
  /** En miniaturas no cabe una frase: se usa la marca sola. */
  compacta?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label="Este alojamiento todavía no tiene fotos"
      className={`flex items-center justify-center bg-brand-tint ${className}`}
    >
      {compacta ? (
        <img
          src="/logo-mark-teal.svg"
          alt=""
          width={28}
          height={28}
          aria-hidden="true"
          className="h-7 w-7 opacity-40"
        />
      ) : (
        <span className="px-4 text-center text-ui text-brand-deep">
          Fotos al consultar
        </span>
      )}
    </div>
  );
}
