import type { Execucao, Instante, Resultado } from "../tipos";

export interface Taxa {
  sucessos: number;
  total: number;
  /** Fração entre 0 e 1; nula quando não houve execuções. */
  valor: number | null;
}

/** Taxa de sucesso = execuções com sucesso ÷ execuções no período. */
export function calcularTaxa(execucoes: readonly { resultado: Resultado }[]): Taxa {
  let sucessos = 0;
  for (const e of execucoes) if (e.resultado === "sucesso") sucessos++;
  const total = execucoes.length;
  return { sucessos, total, valor: total === 0 ? null : sucessos / total };
}

/** Execuções com instante em [inicio, fim). */
export function noIntervalo<T extends Pick<Execucao, "instante">>(
  execucoes: readonly T[],
  inicio: Instante,
  fim: Instante,
): T[] {
  return execucoes.filter((e) => e.instante >= inicio && e.instante < fim);
}

/** Diferença em pontos percentuais (0.942 vs 0.918 → 2.4). Nula se faltar um dos lados. */
export function variacaoEmPontos(atual: number | null, anterior: number | null): number | null {
  if (atual === null || anterior === null) return null;
  return (atual - anterior) * 100;
}

/**
 * Arredonda a fração para uma casa decimal em pontos percentuais — a mesma
 * precisão exibida na tela. Assim, um "95,0%" exibido nunca é classificado
 * como abaixo da meta por causa de 94,96%.
 */
export function arredondarComoExibido(fracao: number): number {
  return Math.round(fracao * 1000) / 1000;
}
