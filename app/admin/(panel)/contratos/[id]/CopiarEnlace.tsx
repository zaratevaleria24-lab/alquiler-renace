'use client';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
export default function CopiarEnlace({ url }: { url: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <code className="mono-data break-all rounded-control border border-line bg-paper px-3 py-2 text-ui">{url}</code>
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(url); setOk(true); setTimeout(() => setOk(false), 1500); } catch {} }} className="inline-flex min-h-[38px] items-center gap-1.5 rounded-control border border-line bg-white px-3 text-ui font-medium text-brand-deep">{ok ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{ok ? 'Copiado' : 'Copiar'}</button>
    </div>
  );
}
