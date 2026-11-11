import { DIA_MS, inicioDoDia, instanteLocal, paraDataLocal, SEMANA_MS, ultimaSemanaFechada } from "@/lib/datas";
import type { Instante } from "../tipos";
import type { Janela } from "./periodo";

/**
 * Recortes da sustentação. Todos usam só dias completos antes da referência:
 * - dia: o último dia completo, comparado com o mesmo dia da semana anterior
 *   (segunda com segunda), porque o volume de chamados muda muito ao longo da semana;
 * - semana: a última semana fechada (segunda a domingo), como na visão executiva;
 * - mês: o mês até o último dia completo, comparado com os mesmos dias do mês anterior.
 */
export const RECORTES = ["dia", "semana", "mes"] as const;
export type Recorte = (typeof RECORTES)[number];
export const RECORTE_PADRAO: Recorte = "semana";

/** Lê o recorte da URL (?recorte=dia|semana|mes). Qualquer outro valor vira o padrão. */
export function lerRecorte(valor: string | string[] | undefined): Recorte {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return (RECORTES as readonly string[]).includes(texto ?? "") ? (texto as Recorte) : RECORTE_PADRAO;
}

export interface PeriodoSustentacao {
  recorte: Recorte;
  atual: Janela;
  /** Período equivalente usado na comparação. */
  anterior: Janela;
}

export function diasNoMes(ano: number, mes: number): number {
  return Math.round((instanteLocal(ano, mes + 1, 1) - instanteLocal(ano, mes, 1)) / DIA_MS);
}

/** Primeiro instante do mês (local) que contém o instante. */
export function inicioDoMes(instante: Instante): Instante {
  const l = paraDataLocal(instante);
  return instanteLocal(l.ano, l.mes, 1);
}

export function periodoSustentacao(referencia: Instante, recorte: Recorte): PeriodoSustentacao {
  const fimDiasCompletos = inicioDoDia(referencia);

  if (recorte === "dia") {
    const atual = { inicio: fimDiasCompletos - DIA_MS, fim: fimDiasCompletos };
    return { recorte, atual, anterior: { inicio: atual.inicio - SEMANA_MS, fim: atual.fim - SEMANA_MS } };
  }

  if (recorte === "semana") {
    const semana = ultimaSemanaFechada(referencia);
    const atual = { inicio: semana.inicio, fim: semana.fim };
    return { recorte, atual, anterior: { inicio: atual.inicio - SEMANA_MS, fim: atual.inicio } };
  }

  // Mês: do dia 1 até o último dia completo. Se a referência cai no dia 1,
  // o último dia completo é do mês anterior, que então aparece inteiro.
  const ultimoDia = paraDataLocal(fimDiasCompletos - 1);
  const atual = { inicio: instanteLocal(ultimoDia.ano, ultimoDia.mes, 1), fim: fimDiasCompletos };
  const inicioAnterior = instanteLocal(ultimoDia.ano, ultimoDia.mes - 1, 1);
  const anteriorLocal = paraDataLocal(inicioAnterior);
  const diasAnterior = diasNoMes(anteriorLocal.ano, anteriorLocal.mes);
  const mesCompleto = ultimoDia.dia === diasNoMes(ultimoDia.ano, ultimoDia.mes);
  const dias = mesCompleto ? diasAnterior : Math.min(ultimoDia.dia, diasAnterior);
  return { recorte, atual, anterior: { inicio: inicioAnterior, fim: inicioAnterior + dias * DIA_MS } };
}

/** Os `quantidade` dias completos que terminam em `fim` (exclusivo), do mais antigo ao mais novo. */
export function diasAte(fim: Instante, quantidade: number): Janela[] {
  const ultimo = inicioDoDia(fim - 1);
  return Array.from({ length: quantidade }, (_, i) => {
    const inicio = ultimo - (quantidade - 1 - i) * DIA_MS;
    return { inicio, fim: inicio + DIA_MS };
  });
}

/**
 * Os `quantidade` meses completos antes do mês do dia da referência,
 * do mais antigo ao mais novo (ref. 09/11 → maio a outubro).
 */
export function mesesFechados(referencia: Instante, quantidade: number): Janela[] {
  const l = paraDataLocal(inicioDoDia(referencia));
  return Array.from({ length: quantidade }, (_, i) => {
    const deslocamento = quantidade - i;
    return {
      inicio: instanteLocal(l.ano, l.mes - deslocamento, 1),
      fim: instanteLocal(l.ano, l.mes - deslocamento + 1, 1),
    };
  });
}
