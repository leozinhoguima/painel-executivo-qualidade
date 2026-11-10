import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type TomContexto = "positivo" | "negativo" | "alerta" | "neutro";

const COR_TOM: Record<TomContexto, string> = {
  positivo: "text-ok",
  negativo: "text-risco",
  alerta: "text-alerta",
  neutro: "text-tinta-suave",
};

interface CartaoIndicadorProps {
  rotulo: string;
  valor: string;
  /** Complemento menor ao lado do número ("de 5", "dias"). */
  complemento?: string;
  /** Destaca o número na cor de risco (ex.: falhas críticas em aberto). */
  valorEmRisco?: boolean;
  contexto: { texto: ReactNode; tom: TomContexto; Icone?: LucideIcon };
}

/** Indicador-chave: rótulo pequeno, número grande e uma linha de contexto. */
export function CartaoIndicador({ rotulo, valor, complemento, valorEmRisco, contexto }: CartaoIndicadorProps) {
  const { Icone } = contexto;
  return (
    <div className="flex min-h-[138px] flex-col rounded-cartao border border-borda bg-cartao px-5 py-5">
      <dt className="text-[14px] text-tinta-suave">{rotulo}</dt>
      <dd className="mt-2 flex flex-1 flex-col justify-between gap-3">
        <p className="numeros flex items-baseline gap-1.5">
          <span className={`text-[36px] leading-none font-semibold tracking-tight ${valorEmRisco ? "text-risco" : "text-tinta"}`}>
            {valor}
          </span>
          {complemento && <span className="text-[20px] font-medium text-tinta-suave">{complemento}</span>}
        </p>
        <p className={`flex items-center gap-1.5 text-[13px] ${COR_TOM[contexto.tom]}`}>
          {Icone && <Icone aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.25} />}
          <span>{contexto.texto}</span>
        </p>
      </dd>
    </div>
  );
}
