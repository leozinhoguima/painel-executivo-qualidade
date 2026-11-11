"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { formatarDecimal, formatarInteiro } from "@/lib/formatacao";
import { COR_EIXO, COR_GRADE, COR_LINHA_EIXO } from "./cores";

export interface SerieBarra {
  chave: string;
  rotulo: string;
  cor: string;
}

export interface PontoBarra {
  rotulo: string;
  descricao: string;
}

const valorDe = (ponto: PontoBarra, chave: string) => Number((ponto as unknown as Record<string, unknown>)[chave]);

interface GraficoBarrasProps {
  pontos: readonly PontoBarra[];
  series: SerieBarra[];
  /** Mostra um rótulo do eixo X a cada N+1 pontos (0 = todos). */
  intervaloRotulos?: number;
  /** Valores com casa decimal (médias). */
  decimal?: boolean;
  altura?: string;
}

function Dica({ active, payload, series, decimal }: TooltipContentProps & { series: SerieBarra[]; decimal: boolean }) {
  const ponto = payload?.[0]?.payload as PontoBarra | undefined;
  if (!active || !ponto) return null;
  return (
    <div className="rounded-lg border border-borda bg-cartao px-3 py-2 text-[13px] shadow-sm">
      <p className="mb-1 font-semibold">{ponto.descricao}</p>
      {series.map((s) => (
        <p key={s.chave} className="numeros flex items-center gap-2 text-tinta">
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: s.cor }} />
          <span className="text-tinta-suave">{s.rotulo}:</span>
          <span className="font-semibold">
            {decimal ? formatarDecimal(valorDe(ponto, s.chave)) : formatarInteiro(valorDe(ponto, s.chave))}
          </span>
        </p>
      ))}
    </div>
  );
}

/**
 * Barras verticais agrupadas: cantos arredondados no topo, 2px entre as barras
 * de um mesmo grupo, grade discreta e dica ao passar o mouse.
 */
export function GraficoBarras({
  pontos,
  series,
  intervaloRotulos = 0,
  decimal = false,
  altura = "h-[240px]",
}: GraficoBarrasProps) {
  return (
    <div className={`${altura} w-full`} aria-hidden="true">
      <BarChart
        responsive
        style={{ width: "100%", height: "100%" }}
        data={[...pontos]}
        margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
        barGap={2}
        barCategoryGap={series.length > 1 ? "22%" : "30%"}
      >
        <CartesianGrid vertical={false} stroke={COR_GRADE} />
        <XAxis
          dataKey="rotulo"
          interval={intervaloRotulos}
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
        <Tooltip
          content={(props) => <Dica {...props} series={series} decimal={decimal} />}
          cursor={{ fill: "#f1f5f9" }}
          isAnimationActive={false}
        />
        {series.map((s) => (
          <Bar
            key={s.chave}
            dataKey={s.chave}
            fill={s.cor}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </div>
  );
}
