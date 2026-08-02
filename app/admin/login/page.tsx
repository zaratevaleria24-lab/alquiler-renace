import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
  // Con sesión abierta no tiene sentido mostrar el login.
  if (await usuarioActual()) redirect('/');

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-16">
      <div className="w-full max-w-[26rem]">
        <div className="mb-10 text-center">
          <img
            src="/icon.png"
            alt=""
            width={44}
            height={44}
            className="mx-auto mb-6 h-11 w-11 rounded-chip"
          />
          {/* El sello romana/cursiva del sitio, también acá: el panel es la otra
              cara del mismo producto, no una herramienta ajena. */}
          <h1 className="font-serif text-headline font-normal track-headline text-ink">
            Panel de <em className="headline-italic">Margarita Renace</em>
          </h1>
          <p className="mt-3 text-meta text-ink-muted">
            Entra para gestionar el inventario y ver las métricas.
          </p>
        </div>

        <div className="rounded-card border border-line bg-white p-7 md:p-8">
          <LoginForm />
        </div>

        <p className="mono-data mt-8 text-center text-ink-subtle">
          Tras 8 intentos fallidos el acceso se bloquea 15 minutos.
        </p>
      </div>
    </div>
  );
}
