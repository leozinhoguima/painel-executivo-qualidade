import { Check, CircleX, Info, Minus, TriangleAlert, type LucideIcon } from "lucide-react";
import { ROTULO_SEVERIDADE, ROTULO_STATUS } from "@/dominio/rotulos";
import type { Severidade, StatusProntidao } from "@/dominio/tipos";

const STATUS: Record<StatusProntidao, { Icone: LucideIcon; fundo: string; texto: string }> = {
  pronto: { Icone: Check, fundo: "bg-ok-fundo", texto: "text-ok" },
  atencao: { Icone: TriangleAlert, fundo: "bg-alerta-fundo", texto: "text-alerta" },
  risco: { Icone: CircleX, fundo: "bg-risco-fundo", texto: "text-risco" },
  "sem-dados": { Icone: Minus, fundo: "bg-neutro-fundo", texto: "text-neutro" },
};

/** Selo de prontidão: cor + ícone + texto (nunca só a cor). */
export function SeloStatus({ status, compacto = false }: { status: StatusProntidao; compacto?: boolean }) {
  const { Icone, fundo, texto } = STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${fundo} ${texto} ${
        compacto ? "px-2.5 py-0.5 text-[12px]" : "min-w-[108px] px-3 py-1 text-[13px]"
      }`}
    >
      <Icone aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.25} />
      {ROTULO_STATUS[status]}
    </span>
  );
}

/** Status como texto com ícone, sem fundo (usado ao lado de barras). */
export function TextoStatus({ status }: { status: StatusProntidao }) {
  const { Icone, texto } = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${texto}`}>
      <Icone aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
      {ROTULO_STATUS[status]}
    </span>
  );
}

const CLASSES_SEVERIDADE: Record<Severidade, string> = {
  critica: "bg-risco-fundo text-risco",
  alta: "bg-alerta-fundo text-alerta",
  media: "bg-neutro-fundo text-neutro",
  baixa: "bg-neutro-fundo text-neutro",
};

export function SeloSeveridade({ severidade }: { severidade: Severidade }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap ${CLASSES_SEVERIDADE[severidade]}`}
    >
      <span className="sr-only">Severidade </span>
      {ROTULO_SEVERIDADE[severidade]}
    </span>
  );
}

/** Selo fixo exigido em todas as telas: deixa claro que nada ali é real. */
export function SeloDemonstracao() {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-marca-clara px-2.5 py-1 text-[12px] font-medium text-marca">
      <Info aria-hidden="true" className="size-3.5" />
      Ambiente de demonstração · dados fictícios
    </span>
  );
}
