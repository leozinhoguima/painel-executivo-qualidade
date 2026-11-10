import { DIA_MS } from "@/lib/datas";
import type { Defeito, Execucao, Funcionalidade, Instante } from "../tipos";
import { calcularTaxa } from "./taxa";

/** Abaixo desta proporção de falhas o problema é tratado como intermitente. */
const LIMITE_INTERMITENTE = 0.5;
const JANELA_FREQUENCIA_MS = 7 * DIA_MS;

/**
 * Proporção de falhas dos testes afetados por um defeito, desde a abertura
 * (limitado aos últimos 7 dias). Distingue um problema que sempre acontece de
 * um intermitente.
 */
export function proporcaoFalhasRecentes(
  defeito: Pick<Defeito, "casosAfetados" | "abertoEm">,
  execucoes: readonly Execucao[],
  referencia: Instante,
): number | null {
  const casos = new Set(defeito.casosAfetados);
  const desde = Math.max(defeito.abertoEm, referencia - JANELA_FREQUENCIA_MS);
  const recentes = execucoes.filter(
    (e) => casos.has(e.casoId) && e.instante <= referencia && e.instante >= desde,
  );
  const taxa = calcularTaxa(recentes);
  return taxa.valor === null ? null : 1 - taxa.valor;
}

/**
 * Linha de impacto exibida abaixo do problema. Para problemas intermitentes,
 * a frequência diz mais ao gestor do que a consequência genérica.
 */
export function descreverImpacto(
  funcionalidade: Pick<Funcionalidade, "impactoNegocio">,
  proporcaoFalhas: number | null,
): string {
  if (proporcaoFalhas !== null && proporcaoFalhas > 0 && proporcaoFalhas < LIMITE_INTERMITENTE) {
    const umEmCada = Math.max(2, Math.round(1 / proporcaoFalhas));
    return `cerca de 1 em cada ${umEmCada} tentativas falha nos testes`;
  }
  return funcionalidade.impactoNegocio;
}
