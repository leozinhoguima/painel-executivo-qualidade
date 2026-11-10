import type { Severidade, StatusProntidao } from "../tipos";
import { LIMITE_RISCO, META_SUCESSO, ORDEM_STATUS } from "./parametros";
import { arredondarComoExibido } from "./taxa";

/**
 * Semáforo de prontidão.
 * - Risco:   sucesso abaixo de 85% ou algum defeito crítico em aberto.
 * - Atenção: sucesso abaixo de 95% ou algum defeito de severidade alta em aberto.
 * - Pronto:  95% ou mais e nenhum defeito crítico ou alto em aberto.
 * - Sem dados: nenhuma execução no período e nenhum defeito em aberto.
 */
export function classificarProntidao(
  taxa: number | null,
  severidadesAbertas: readonly Severidade[],
): StatusProntidao {
  const temCritico = severidadesAbertas.includes("critica");
  const temAlto = severidadesAbertas.includes("alta");

  if (taxa === null) {
    if (temCritico) return "risco";
    if (temAlto) return "atencao";
    return "sem-dados";
  }

  const t = arredondarComoExibido(taxa);
  if (temCritico || t < LIMITE_RISCO) return "risco";
  if (temAlto || t < META_SUCESSO) return "atencao";
  return "pronto";
}

/** Compara do pior para o melhor: status primeiro, depois a menor taxa. */
export function compararPiorPrimeiro(
  a: { status: StatusProntidao; taxa: number | null },
  b: { status: StatusProntidao; taxa: number | null },
): number {
  const porStatus = ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status];
  if (porStatus !== 0) return porStatus;
  return (a.taxa ?? Infinity) - (b.taxa ?? Infinity);
}

export const TEXTO_REGRA_SEMAFORO =
  "Pronto = 95% ou mais de sucesso e nenhuma falha crítica ou alta em aberto";

export const DETALHE_REGRA_SEMAFORO =
  "Atenção = abaixo de 95% ou falha de severidade alta em aberto. Risco = abaixo de 85% ou falha crítica em aberto.";
