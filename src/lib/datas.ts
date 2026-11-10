import type { Instante } from "@/dominio/tipos";

export const HORA_MS = 3_600_000;
export const DIA_MS = 24 * HORA_MS;
export const SEMANA_MS = 7 * DIA_MS;

/**
 * Fuso de referência: America/Sao_Paulo. O Brasil não adota horário de verão
 * desde 2019, então o deslocamento é fixo em −03:00. Usar um deslocamento fixo
 * mantém os cálculos puros e independentes do fuso da máquina.
 */
export const DESLOCAMENTO_FUSO_MS = -3 * HORA_MS;

export interface DataLocal {
  ano: number;
  /** 1 a 12 */
  mes: number;
  dia: number;
  /** 0 = segunda … 6 = domingo */
  diaSemana: number;
  hora: number;
  minuto: number;
}

export function paraDataLocal(instante: Instante): DataLocal {
  const d = new Date(instante + DESLOCAMENTO_FUSO_MS);
  return {
    ano: d.getUTCFullYear(),
    mes: d.getUTCMonth() + 1,
    dia: d.getUTCDate(),
    diaSemana: (d.getUTCDay() + 6) % 7,
    hora: d.getUTCHours(),
    minuto: d.getUTCMinutes(),
  };
}

/** ISO 8601 no fuso de referência: "2026-11-09T06:00:00-03:00". */
export function paraIsoLocal(instante: Instante): string {
  const d = new Date(instante + DESLOCAMENTO_FUSO_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}-03:00`
  );
}

/** Instante da meia-noite local do dia informado. */
export function instanteLocal(ano: number, mes: number, dia: number, hora = 0, minuto = 0): Instante {
  return Date.UTC(ano, mes - 1, dia, hora, minuto) - DESLOCAMENTO_FUSO_MS;
}

export function inicioDoDia(instante: Instante): Instante {
  const l = paraDataLocal(instante);
  return instanteLocal(l.ano, l.mes, l.dia);
}

/** Segunda-feira 00:00 (horário local) da semana do instante. */
export function inicioDaSemana(instante: Instante): Instante {
  const l = paraDataLocal(instante);
  return instanteLocal(l.ano, l.mes, l.dia) - l.diaSemana * DIA_MS;
}

/** Número da semana ISO 8601 (semana começa na segunda; a semana 1 contém a primeira quinta-feira do ano). */
export function semanaIso(instante: Instante): { ano: number; numero: number } {
  const l = paraDataLocal(instante);
  const quinta = Date.UTC(l.ano, l.mes - 1, l.dia) + (3 - l.diaSemana) * DIA_MS;
  const ano = new Date(quinta).getUTCFullYear();
  const numero = Math.floor((quinta - Date.UTC(ano, 0, 1)) / SEMANA_MS) + 1;
  return { ano, numero };
}

export interface Semana {
  /** Segunda-feira 00:00, inclusivo. */
  inicio: Instante;
  /** Segunda-feira seguinte 00:00, exclusivo. */
  fim: Instante;
  ano: number;
  numero: number;
}

export function semanaDoInstante(instante: Instante): Semana {
  const inicio = inicioDaSemana(instante);
  return { inicio, fim: inicio + SEMANA_MS, ...semanaIso(inicio) };
}

/** Última semana completa (segunda a domingo) antes do instante de referência. */
export function ultimaSemanaFechada(referencia: Instante): Semana {
  return semanaDoInstante(inicioDaSemana(referencia) - SEMANA_MS);
}

/** As `quantidade` semanas fechadas mais recentes, da mais antiga para a mais nova. */
export function semanasFechadas(referencia: Instante, quantidade: number): Semana[] {
  const ultima = ultimaSemanaFechada(referencia);
  return Array.from({ length: quantidade }, (_, i) =>
    semanaDoInstante(ultima.inicio - (quantidade - 1 - i) * SEMANA_MS),
  );
}

/** Dias corridos completos entre dois instantes. */
export function diasEntre(inicio: Instante, fim: Instante): number {
  return Math.max(0, Math.floor((fim - inicio) / DIA_MS));
}
