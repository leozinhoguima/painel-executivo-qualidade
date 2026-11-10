import type { Instante } from "@/dominio/tipos";
import { paraDataLocal, type Semana, SEMANA_MS } from "./datas";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const formatoPercentual = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const formatoDecimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const formatoInteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/** Sinal de menos tipográfico, mais legível que o hífen em números. */
const MENOS = "−";

const dois = (n: number) => String(n).padStart(2, "0");

/** 0.942 → "94,2%" */
export function formatarPercentual(fracao: number | null): string {
  if (fracao === null) return "—";
  return `${formatoPercentual.format(fracao * 100)}%`;
}

const formatoPercentualCurto = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** Para metas e limites: 0.95 → "95%"; 0.925 → "92,5%". */
export function formatarPercentualCurto(fracao: number): string {
  return `${formatoPercentualCurto.format(fracao * 100)}%`;
}

/** 2.4 → "+2,4"; -1.6 → "−1,6"; 0 → "0,0" */
export function formatarPontos(pontos: number): string {
  const arredondado = Math.round(pontos * 10) / 10;
  const texto = formatoDecimal.format(Math.abs(arredondado));
  if (arredondado > 0) return `+${texto}`;
  if (arredondado < 0) return `${MENOS}${texto}`;
  return texto;
}

export function formatarDecimal(valor: number): string {
  return formatoDecimal.format(valor);
}

export function formatarInteiro(valor: number): string {
  return formatoInteiro.format(valor);
}

export function pluralizar(quantidade: number, singular: string, plural: string): string {
  return `${formatarInteiro(quantidade)} ${quantidade === 1 ? singular : plural}`;
}

/** "Aberta há 5 dias" / "Aberta há 1 dia" / "Aberta hoje" */
export function formatarTempoAberto(dias: number, genero: "o" | "a" = "a"): string {
  const aberto = genero === "a" ? "Aberta" : "Aberto";
  if (dias <= 0) return `${aberto} hoje`;
  return `${aberto} há ${pluralizar(dias, "dia", "dias")}`;
}

/** 850 → "850 ms"; 1234 → "1,2 s"; 15000 → "15,0 s" */
export function formatarDuracao(ms: number): string {
  if (ms < 1000) return `${formatarInteiro(ms)} ms`;
  return `${formatarDecimal(ms / 1000)} s`;
}

/** "09/11/2026, 06:00" */
export function formatarDataHora(instante: Instante): string {
  const l = paraDataLocal(instante);
  return `${dois(l.dia)}/${dois(l.mes)}/${l.ano}, ${dois(l.hora)}:${dois(l.minuto)}`;
}

/** "02 a 08 de novembro de 2026" (ajusta quando a semana cruza mês ou ano). */
export function formatarIntervaloSemana(semana: Pick<Semana, "inicio">): string {
  const a = paraDataLocal(semana.inicio);
  const b = paraDataLocal(semana.inicio + SEMANA_MS - 1);
  if (a.ano !== b.ano) {
    return `${dois(a.dia)} de ${MESES[a.mes - 1]} de ${a.ano} a ${dois(b.dia)} de ${MESES[b.mes - 1]} de ${b.ano}`;
  }
  if (a.mes !== b.mes) {
    return `${dois(a.dia)} de ${MESES[a.mes - 1]} a ${dois(b.dia)} de ${MESES[b.mes - 1]} de ${b.ano}`;
  }
  return `${dois(a.dia)} a ${dois(b.dia)} de ${MESES[b.mes - 1]} de ${b.ano}`;
}

/**
 * Intervalo [inicio, fim) em datas curtas: "11/10 a 09/11/2026"
 * (com o ano nas duas pontas quando a janela cruza o ano).
 */
export function formatarJanela(janela: { inicio: Instante; fim: Instante }): string {
  const a = paraDataLocal(janela.inicio);
  const b = paraDataLocal(janela.fim - 1);
  const inicio = a.ano === b.ano ? `${dois(a.dia)}/${dois(a.mes)}` : `${dois(a.dia)}/${dois(a.mes)}/${a.ano}`;
  return `${inicio} a ${dois(b.dia)}/${dois(b.mes)}/${b.ano}`;
}

/** "Semana 45 · 02 a 08 de novembro de 2026" */
export function formatarSemana(semana: Semana): string {
  return `Semana ${semana.numero} · ${formatarIntervaloSemana(semana)}`;
}

/** Primeira letra minúscula, para encaixar uma descrição no meio de uma frase. */
export function minusculaInicial(texto: string): string {
  return texto.charAt(0).toLocaleLowerCase("pt-BR") + texto.slice(1);
}

export function maiusculaInicial(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
}
