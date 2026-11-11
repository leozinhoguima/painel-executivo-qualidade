import { ArrowDown, ArrowUp, Minus, Sparkles } from "lucide-react";
import { Cartao } from "@/componentes/ui/Cartao";
import type { LinhaProblema, VisaoSustentacao } from "@/dominio/visoes/sustentacao";
import { formatarInteiro, pluralizar } from "@/lib/formatacao";

function Tendencia({ p }: { p: LinhaProblema }) {
  if (p.quantidadeAnterior === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-alerta">
        <Sparkles aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
        Novo no período
      </span>
    );
  }
  const diferenca = p.quantidade - p.quantidadeAnterior;
  if (diferenca === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-tinta-suave">
        <Minus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
        Igual ao período anterior
      </span>
    );
  }
  const subiu = diferenca > 0;
  const Icone = subiu ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-1 ${subiu ? "text-risco" : "text-ok"}`}>
      <Icone aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
      {subiu ? "+" : "−"}
      {formatarInteiro(Math.abs(diferenca))} vs. período anterior ({formatarInteiro(p.quantidadeAnterior)})
    </span>
  );
}

/** Os motivos que mais geraram chamados no período, com tendência e fila em aberto. */
export function ProblemasSustentacao({ visao }: { visao: VisaoSustentacao }) {
  const problemas = visao.problemas;
  return (
    <Cartao titulo="Principais problemas" idTitulo="titulo-problemas-sustentacao" className="h-full">
      <p className="-mt-2 mb-4 text-[13px] text-tinta-suave">
        Motivos com mais chamados · {visao.rotuloPeriodo}
      </p>
      {problemas.length === 0 ? (
        <p className="py-10 text-center text-[14px] text-tinta-suave">Nenhum chamado aberto no período.</p>
      ) : (
        <ol className="divide-y divide-divisor border-t border-divisor">
          {problemas.map((p, i) => (
            <li key={`${p.sistemaId}-${p.motivo}`} className="flex gap-4 py-3">
              <span className="numeros w-5 shrink-0 pt-0.5 text-[14px] font-semibold text-tinta-suave">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold">{p.motivo}</p>
                <p className="mt-0.5 text-[13px] text-tinta-suave">
                  {p.sistemaNome} · {pluralizar(p.emAberto, "chamado em aberto", "chamados em aberto")}
                </p>
                <p className="numeros mt-1 text-[13px]">
                  <Tendencia p={p} />
                </p>
              </div>
              <span className="numeros shrink-0 text-right">
                <span className="block text-[22px] leading-none font-semibold">{formatarInteiro(p.quantidade)}</span>
                <span className="text-[12px] text-tinta-suave">chamados</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Cartao>
  );
}
