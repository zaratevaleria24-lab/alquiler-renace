'use client';

import { useActionState } from 'react';
import { iniciarSesionAction, type EstadoLogin } from '../actions';

// Componente cliente solo para mostrar el error y el estado "entrando".
//
// El <form action={...}> de una Server Action funciona SIN JavaScript: si la
// hidratación tarda o falla —probable con las conexiones de Venezuela— el
// formulario se envía igual como un POST normal. Lo único que se pierde sin JS es
// el texto "Entrando…".

export function LoginForm() {
  const [estado, formAction, pendiente] = useActionState<EstadoLogin, FormData>(
    iniciarSesionAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="usuario"
          className="label-eyebrow mb-2 block text-ink-muted"
        >
          Usuario
        </label>
        {/* type="text" y NO "email": el usuario es un nombre, no un correo. Con
            type="email" el navegador bloquea "admin" exigiendo una arroba y el
            formulario no llega ni a enviarse — fue el bug del primer intento. */}
        <input
          id="usuario"
          name="usuario"
          type="text"
          required
          autoComplete="username"
          autoFocus
          className="w-full rounded-control border border-line bg-paper px-4 py-3 text-body text-ink outline-none transition-colors focus:border-brand"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="label-eyebrow mb-2 block text-ink-muted"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-control border border-line bg-paper px-4 py-3 text-body text-ink outline-none transition-colors focus:border-brand"
        />
      </div>

      {estado?.error && (
        // role="alert" para que los lectores de pantalla lo anuncien al
        // aparecer; sin esto, quien navega con lector no se entera de que falló.
        <p
          role="alert"
          className="rounded-chip border border-coral/30 bg-coral/5 px-4 py-3 text-meta text-coral"
        >
          {estado.error}
        </p>
      )}

      <button type="submit" disabled={pendiente} className="btn-solid w-full">
        {pendiente ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
