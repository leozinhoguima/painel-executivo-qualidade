import { Esqueleto } from "@/componentes/ui/Estados";

export default function Carregando() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Carregando indicadores…</span>
      <Esqueleto className="h-16 w-80" />
      <Esqueleto className="h-36" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Esqueleto key={i} className="h-[138px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.45fr_1fr]">
        <Esqueleto className="h-[440px]" />
        <Esqueleto className="h-[440px]" />
      </div>
    </div>
  );
}
