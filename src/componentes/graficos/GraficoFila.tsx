"use client";

import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import type { PontoFila } from "@/dominio/visoes/sustentacao";
import { formatarInteiro } from "@/lib/formatacao";
import { COR_DESTAQUE, COR_EIXO, COR_GRADE, COR_LINHA_EIXO } from "./cores";

function Dica({ active, payload }: TooltipContentProps) {
  const ponto = payload?.[0]?.payload as PontoFila | undefined;
  if (!active || !ponto) return null;
  return (
    <div className="rounded-lg border border-borda bg-cartao px-3 py-2 text-[13px] shadow-sm">
      <p className="mb-1 font-semibold">Fim de {ponto.descricao}</p>
      <p className="numeros text-tinta">{formatarInteiro(ponto.emAberto)} chamados em aberto</p>
      <p className="numeros text-tinta-suave">{formatarInteiro(ponto.foraDoPrazo)} fora do prazo</p>
    </div>
  );
}

/** Linha com área: quantos chamados estavam em aberto ao fim de cada dia. */
export function GraficoFila({ pontos }: { pontos: PontoFila[] }) {
  return (
    <div className="h-[240px] w-full" aria-hidden="true">
      <AreaChart
        responsive
        style={{ width: "100%", height: "100%" }}
        data={pontos}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="preenchimento-fila" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COR_DESTAQUE} stopOpacity={0.14} />
            <stop offset="100%" stopColor={COR_DESTAQUE} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={COR_GRADE} />
        <XAxis
          dataKey="rotulo"
          interval={14}
          tickLine={false}
          axisLine={{ stroke: COR_LINHA_EIXO }}
          tick={{ fill: COR_EIXO, fontSize: 12 }}
          tickMargin={8}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fill: COR_EIXO, fontSize: 12 }}
          width={40}
          tickFormatter={(v: number) => formatarInteiro(v)}
        />
        <Tooltip content={Dica} cursor={{ stroke: "#94a3b8", strokeWidth: 1 }} isAnimationActive={false} />
        <Area
          type="linear"
          dataKey="emAberto"
          stroke={COR_DESTAQUE}
          strokeWidth={2}
          fill="url(#preenchimento-fila)"
          dot={false}
          activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2, fill: COR_DESTAQUE }}
          isAnimationActive={false}
        />
      </AreaChart>
    </div>
  );
}
