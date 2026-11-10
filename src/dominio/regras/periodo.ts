import { DIA_MS } from "@/lib/datas";
import type { Instante } from "../tipos";

export const PERIODOS = [7, 30, 90] as const;
export type PeriodoDias = (typeof PERIODOS)[number];
export const PERIODO_PADRAO: PeriodoDias = 30;

/** Intervalo [inicio, fim) em instantes. */
export interface Janela {
  inicio: Instante;
  fim: Instante;
}

/** Lê o período da URL (?periodo=7|30|90). Qualquer outro valor vira o padrão. */
export function lerPeriodo(valor: string | string[] | undefined): PeriodoDias {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  const numero = Number(texto);
  return (PERIODOS as readonly number[]).includes(numero) ? (numero as PeriodoDias) : PERIODO_PADRAO;
}

/**
 * Últimos `dias` dias até a referência, inclusive: (referência − dias, referência].
 * Com rodadas a cada 12 horas, 7 dias contêm exatamente 14 rodadas.
 */
export function janelaMovel(referencia: Instante, dias: number): Janela {
  return { inicio: referencia - dias * DIA_MS + 1, fim: referencia + 1 };
}

/** Janela de mesmo tamanho imediatamente anterior, para comparação. */
export function janelaAnterior(janela: Janela): Janela {
  const tamanho = janela.fim - janela.inicio;
  return { inicio: janela.inicio - tamanho, fim: janela.inicio };
}
