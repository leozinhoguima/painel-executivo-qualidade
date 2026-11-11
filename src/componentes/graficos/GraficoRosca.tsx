"use client";

import { Pie, PieChart, Tooltip, type TooltipContentProps } from "recharts";
import { formatarInteiro, formatarPercentual } from "@/lib/formatacao";

export interface FatiaRosca {
  rotulo: string;
  quantidade: number;
  fracao: number | null;
  cor: string;
}

function Dica({ active, payload }: TooltipContentProps) {
  const fatia = payload?.[0]?.payload as FatiaRosca | undefined;
  if (!active || !fatia) return null;
  return (
    <div className="rounded-lg border border-borda bg-cartao px-3 py-2 text-[13px] shadow-sm">
      <p className="flex items-center gap-2 font-semibold">
        <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: fatia.cor }} />
        {fatia.rotulo}
      </p>
      <p className="numeros text-tinta">
        {formatarInteiro(fatia.quantidade)} chamados · {formatarPercentual(fatia.fracao)}
      </p>
    </div>
  );
}

/**
 * Rosca para a divisão de um todo em poucas partes (até 5), com o total no
 * centro. Os números de cada parte ficam na legenda ao lado, nunca só na cor.
 */
export function GraficoRosca({ fatias, total }: { fatias: FatiaRosca[]; total: number }) {
  const dados = fatias.filter((f) => f.quantidade > 0).map((f) => ({ ...f, fill: f.cor }));
  return (
    <div className="relative size-[168px] shrink-0" aria-hidden="true">
      <PieChart responsive style={{ width: "100%", height: "100%" }}>
        <Pie
          data={dados}
          dataKey="quantidade"
          nameKey="rotulo"
          innerRadius="62%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          stroke="#ffffff"
          strokeWidth={2}
          isAnimationActive={false}
        />
        <Tooltip content={Dica} isAnimationActive={false} />
      </PieChart>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="numeros text-[24px] leading-none font-semibold">{formatarInteiro(total)}</span>
        <span className="mt-1 text-[12px] text-tinta-suave">chamados</span>
      </div>
    </div>
  );
}
