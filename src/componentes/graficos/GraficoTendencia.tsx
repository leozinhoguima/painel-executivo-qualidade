"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { formatarInteiro, formatarPercentual } from "@/lib/formatacao";

export interface PontoGrafico {
  rotulo: string;
  taxa: number | null;
  execucoes: number;
}

const COR_LINHA = "#2f5bd3";
const COR_META = "#15803d";
const COR_EIXO = "#475569";

function Dica({ active, payload }: TooltipContentProps) {
  const ponto = payload?.[0]?.payload as PontoGrafico | undefined;
  if (!active || !ponto) return null;
  return (
    <div className="rounded-lg border border-borda bg-cartao px-3 py-2 text-[13px] shadow-sm">
      <p className="font-semibold">Semana {ponto.rotulo.replace("S", "")}</p>
      <p className="numeros text-tinta">{formatarPercentual(ponto.taxa)} de sucesso</p>
      <p className="numeros text-tinta-suave">{formatarInteiro(ponto.execucoes)} testes executados</p>
    </div>
  );
}

/** Linha com área da taxa de sucesso semanal e linha tracejada da meta. */
export function GraficoTendencia({ pontos, meta }: { pontos: PontoGrafico[]; meta: number }) {
  const valores = pontos.map((p) => p.taxa).filter((v): v is number => v !== null);
  const minimo = Math.min(meta, ...valores);
  const maximo = Math.max(meta, ...valores);
  const dominio: [number, number] = [Math.max(0, minimo - 0.02), Math.min(1, maximo + 0.01)];

  return (
    <div className="h-[220px] w-full lg:h-[300px]" aria-hidden="true">
      <AreaChart
        responsive
        style={{ width: "100%", height: "100%" }}
        data={pontos}
        margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
      >
          <defs>
            <linearGradient id="preenchimento-tendencia" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COR_LINHA} stopOpacity={0.12} />
              <stop offset="100%" stopColor={COR_LINHA} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#edf1f6" />
          <XAxis
            dataKey="rotulo"
            interval={0}
            padding={{ left: 12, right: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            tick={{ fill: COR_EIXO, fontSize: 12 }}
            tickMargin={8}
          />
          <YAxis hide domain={dominio} />
          <ReferenceLine y={meta} stroke={COR_META} strokeDasharray="4 4" strokeWidth={1.5} ifOverflow="extendDomain" />
          <Tooltip
            content={Dica}
            cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Area
            type="linear"
            dataKey="taxa"
            stroke={COR_LINHA}
            strokeWidth={2}
            fill="url(#preenchimento-tendencia)"
            dot={false}
            activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2, fill: COR_LINHA }}
            connectNulls
            isAnimationActive={false}
          />
      </AreaChart>
    </div>
  );
}
