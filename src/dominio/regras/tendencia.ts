import type { Semana } from "@/lib/datas";
import type { Execucao } from "../tipos";
import { calcularTaxa, noIntervalo, type Taxa } from "./taxa";

export interface PontoTendencia {
  semana: Semana;
  /** Rótulo curto do eixo: "S45". */
  rotulo: string;
  taxa: Taxa;
}

/** Taxa de sucesso semana a semana, na ordem das semanas informadas. */
export function tendenciaSemanal(
  execucoes: readonly Execucao[],
  semanas: readonly Semana[],
): PontoTendencia[] {
  return semanas.map((semana) => ({
    semana,
    rotulo: `S${semana.numero}`,
    taxa: calcularTaxa(noIntervalo(execucoes, semana.inicio, semana.fim)),
  }));
}

export type DirecaoTendencia = "subiu" | "caiu" | "estavel";

/** Variações menores que 0,5 ponto são tratadas como estabilidade. */
export function direcaoDaVariacao(pontos: number | null, limite = 0.5): DirecaoTendencia {
  if (pontos === null || Math.abs(pontos) < limite) return "estavel";
  return pontos > 0 ? "subiu" : "caiu";
}
