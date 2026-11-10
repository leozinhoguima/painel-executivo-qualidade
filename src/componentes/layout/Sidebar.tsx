import { ShieldCheck } from "lucide-react";
import { formatarDataHora, pluralizar } from "@/lib/formatacao";
import { NavegacaoPrincipal } from "./NavegacaoPrincipal";

interface SidebarProps {
  /** Última rodada de testes; nula quando não há dados ou a leitura falhou. */
  ultimaExecucao: { instante: number; totalTestes: number } | null;
}

/** Barra lateral azul-marinho; em telas pequenas, empilha acima do conteúdo. */
export function Sidebar({ ultimaExecucao }: SidebarProps) {
  return (
    <aside className="flex shrink-0 flex-col gap-4 bg-marinho px-4 py-4 text-white lg:sticky lg:top-0 lg:h-dvh lg:w-[232px] lg:gap-8 lg:py-6">
      <div className="flex items-center gap-3 px-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-marca">
          <ShieldCheck aria-hidden="true" className="size-5" strokeWidth={2} />
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold">Qualidade</p>
          <p className="text-[12px] text-marinho-texto">Banco Aurora · fictício</p>
        </div>
      </div>

      <NavegacaoPrincipal />

      <div className="hidden rounded-lg bg-marinho-ativo/70 px-3 py-3 text-[12px] leading-snug lg:mt-auto lg:block">
        <p className="text-marinho-texto">Última execução automática</p>
        {ultimaExecucao ? (
          <p className="numeros mt-0.5 font-semibold">
            {formatarDataHora(ultimaExecucao.instante)} · {pluralizar(ultimaExecucao.totalTestes, "teste", "testes")}
          </p>
        ) : (
          <p className="mt-0.5 font-semibold">Sem execuções registradas</p>
        )}
      </div>
    </aside>
  );
}
