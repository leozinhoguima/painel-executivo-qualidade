import { Esqueleto } from "@/componentes/ui/Estados";

export default function CarregandoChamados() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Carregando chamados…</span>
      <Esqueleto className="h-24 w-80" />
      <Esqueleto className="h-[220px]" />
      <Esqueleto className="h-[520px]" />
    </div>
  );
}
