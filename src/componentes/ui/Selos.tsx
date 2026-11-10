import { Check, CircleX, Info, Minus, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Severidade, SituacaoDefeito, StatusProntidao } from "@/dominio/tipos";

const STATUS: Record<StatusProntidao, { rotulo: string; Icone: LucideIcon; classes: string }> = {
  pronto: { rotulo: "Pronto", Icone: Check, classes: "bg-ok-fundo text-ok" },
  atencao: { rotulo: "Atenção", Icone: TriangleAlert, classes: "bg-alerta-fundo text-alerta" },
  risco: { rotulo: "Risco", Icone: CircleX, classes: "bg-risco-fundo text-risco" },
  "sem-dados": { rotulo: "Sem dados", Icone: Minus, classes: "bg-neutro-fundo text-neutro" },
};

export const ROTULO_STATUS: Record<StatusProntidao, string> = {
  pronto: STATUS.pronto.rotulo,
  atencao: STATUS.atencao.rotulo,
  risco: STATUS.risco.rotulo,
  "sem-dados": STATUS["sem-dados"].rotulo,
};

/** Selo de prontidão: cor + ícone + texto (nunca só a cor). */
export function SeloStatus({ status, compacto = false }: { status: StatusProntidao; compacto?: boolean }) {
  const { rotulo, Icone, classes } = STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${classes} ${
        compacto ? "px-2.5 py-0.5 text-[12px]" : "min-w-[108px] px-3 py-1 text-[13px]"
      }`}
    >
      <Icone aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.25} />
      {rotulo}
    </span>
  );
}

/** Status como texto com ícone, sem fundo (usado ao lado de barras). */
export function TextoStatus({ status }: { status: StatusProntidao }) {
  const { rotulo, Icone, classes } = STATUS[status];
  const cor = classes.split(" ").find((c) => c.startsWith("text-"));
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${cor}`}>
      <Icone aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
      {rotulo}
    </span>
  );
}

const SEVERIDADE: Record<Severidade, { rotulo: string; classes: string }> = {
  critica: { rotulo: "Crítica", classes: "bg-risco-fundo text-risco" },
  alta: { rotulo: "Alta", classes: "bg-alerta-fundo text-alerta" },
  media: { rotulo: "Média", classes: "bg-neutro-fundo text-neutro" },
  baixa: { rotulo: "Baixa", classes: "bg-neutro-fundo text-neutro" },
};

export function SeloSeveridade({ severidade }: { severidade: Severidade }) {
  const { rotulo, classes } = SEVERIDADE[severidade];
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap ${classes}`}>
      <span className="sr-only">Severidade </span>
      {rotulo}
    </span>
  );
}

export const ROTULO_SITUACAO: Record<SituacaoDefeito, string> = {
  aberto: "Aberto",
  "em-analise": "Em análise",
  "em-correcao": "Em correção",
  "aguardando-decisao": "Aguardando decisão",
  resolvido: "Resolvido",
};

/** Selo fixo exigido em todas as telas: deixa claro que nada ali é real. */
export function SeloDemonstracao() {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-marca-clara px-2.5 py-1 text-[12px] font-medium text-marca">
      <Info aria-hidden="true" className="size-3.5" />
      Ambiente de demonstração · dados fictícios
    </span>
  );
}
