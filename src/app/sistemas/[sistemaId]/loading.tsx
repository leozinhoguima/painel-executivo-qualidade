import { Esqueleto } from "@/componentes/ui/Estados";

export default function CarregandoSistema() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Carregando indicadores do sistema…</span>
      <div className="flex items-end justify-between gap-4">
        <Esqueleto className="h-24 w-72" />
        <Esqueleto className="h-11 w-56" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Esqueleto key={i} className="h-[138px]" />
        ))}
      </div>
      <Esqueleto className="h-80" />
      <Esqueleto className="h-72" />
    </div>
  );
}
