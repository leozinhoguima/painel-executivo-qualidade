import { paraDataLocal } from "@/lib/datas";
import type { CanalChamado, CategoriaChamado, Chamado, Instante, TipoEventoChamado } from "../tipos";
import { PRAZO_ATENDIMENTO_MS } from "./parametros";
import type { Janela } from "./periodo";

/**
 * Regras da sustentação. Nada é guardado pronto: "aberto", "fechado",
 * "reaberto" e "em aberto" saem dos eventos de cada chamado.
 */

/** Ordem de exibição das categorias e dos canais. */
export const CATEGORIAS: readonly CategoriaChamado[] = ["indisponibilidade", "erro-transacao", "lentidao", "acesso", "duvida"];
export const CANAIS: readonly CanalChamado[] = ["app", "central", "agencia"];

const dentro = (instante: Instante, janela: Janela) => instante >= janela.inicio && instante < janela.fim;

export interface Contagem {
  /** Chamados abertos no período (eventos de abertura). */
  abertos: number;
  /** Fechamentos no período (um chamado reaberto pode ser fechado de novo). */
  fechados: number;
  /** Reaberturas no período. */
  reabertos: number;
}

/** Conta aberturas, fechamentos e reaberturas que aconteceram dentro da janela. */
export function contarEventos(chamados: readonly Chamado[], janela: Janela): Contagem {
  const contagem: Contagem = { abertos: 0, fechados: 0, reabertos: 0 };
  const campo: Record<TipoEventoChamado, keyof Contagem> = {
    abertura: "abertos",
    fechamento: "fechados",
    reabertura: "reabertos",
  };
  for (const c of chamados) {
    for (const e of c.eventos) if (dentro(e.instante, janela)) contagem[campo[e.tipo]]++;
  }
  return contagem;
}

/** Em aberto no instante: já foi aberto e o último evento até ali é abertura ou reabertura. */
export function estaEmAberto(chamado: Chamado, instante: Instante): boolean {
  let aberto = false;
  for (const e of chamado.eventos) {
    if (e.instante > instante) break;
    aberto = e.tipo !== "fechamento";
  }
  return aberto;
}

export function chamadosEmAberto(chamados: readonly Chamado[], instante: Instante): Chamado[] {
  return chamados.filter((c) => estaEmAberto(c, instante));
}

/** Limite do prazo de atendimento: abertura + prazo da prioridade. */
export function limiteDoPrazo(chamado: Chamado): Instante {
  return chamado.abertura + PRAZO_ATENDIMENTO_MS[chamado.prioridade];
}

/** Em aberto e já além do prazo contado desde a abertura. */
export function estaForaDoPrazo(chamado: Chamado, instante: Instante): boolean {
  return estaEmAberto(chamado, instante) && instante > limiteDoPrazo(chamado);
}

export function primeiroFechamento(chamado: Chamado): Instante | null {
  return chamado.eventos.find((e) => e.tipo === "fechamento")?.instante ?? null;
}

export interface ResumoAtendimento {
  /** Chamados cujo primeiro fechamento caiu no período. */
  resolvidos: number;
  noPrazo: number;
  /** Fração resolvida dentro do prazo; nula sem resolvidos. */
  taxaNoPrazo: number | null;
  /** Média da abertura ao primeiro fechamento; nula sem resolvidos. */
  tempoMedioMs: number | null;
}

/**
 * Prazo e tempo de solução medem a primeira resposta definitiva: da abertura
 * ao primeiro fechamento. Reaberturas são medidas à parte (taxa de reabertura),
 * para que um mesmo chamado não seja contado duas vezes.
 */
export function resumirAtendimento(chamados: readonly Chamado[], janela: Janela): ResumoAtendimento {
  let resolvidos = 0;
  let noPrazo = 0;
  let soma = 0;
  for (const c of chamados) {
    const fechamento = primeiroFechamento(c);
    if (fechamento === null || !dentro(fechamento, janela)) continue;
    resolvidos++;
    soma += fechamento - c.abertura;
    if (fechamento <= limiteDoPrazo(c)) noPrazo++;
  }
  return {
    resolvidos,
    noPrazo,
    taxaNoPrazo: resolvidos === 0 ? null : noPrazo / resolvidos,
    tempoMedioMs: resolvidos === 0 ? null : soma / resolvidos,
  };
}

/** Reaberturas ÷ fechamentos do mesmo período; nula sem fechamentos. */
export function taxaReabertura(contagem: Contagem): number | null {
  return contagem.fechados === 0 ? null : contagem.reabertos / contagem.fechados;
}

/** Variação relativa (12 → 15 = +0,25). Nula quando a base é zero ou ausente. */
export function variacaoRelativa(atual: number, anterior: number | null): number | null {
  if (anterior === null || anterior === 0) return null;
  return (atual - anterior) / anterior;
}

/** Chamados abertos dentro da janela. */
export function abertosNaJanela(chamados: readonly Chamado[], janela: Janela): Chamado[] {
  return chamados.filter((c) => dentro(c.abertura, janela));
}

export interface Fatia<K extends string> {
  chave: K;
  quantidade: number;
  /** Fração do total; nula com total zero. */
  fracao: number | null;
}

/**
 * Distribuição dos chamados por uma característica, da maior para a menor
 * (empates na ordem de `ordem`). Inclui as chaves sem chamados, com zero.
 */
export function distribuir<K extends string>(
  chamados: readonly Chamado[],
  chave: (c: Chamado) => K,
  ordem: readonly K[],
): Fatia<K>[] {
  const contagem = new Map<K, number>(ordem.map((k) => [k, 0]));
  for (const c of chamados) {
    const k = chave(c);
    contagem.set(k, (contagem.get(k) ?? 0) + 1);
  }
  const total = chamados.length;
  return [...contagem.entries()]
    .map(([k, quantidade]) => ({ chave: k, quantidade, fracao: total === 0 ? null : quantidade / total }))
    .sort((a, b) => b.quantidade - a.quantidade || ordem.indexOf(a.chave) - ordem.indexOf(b.chave));
}

/** Média de chamados abertos por dia da semana (0 = segunda … 6 = domingo) nas semanas informadas. */
export function mediaPorDiaDaSemana(
  chamados: readonly Chamado[],
  semanas: readonly Janela[],
): number[] {
  const somas = Array.from({ length: 7 }, () => 0);
  if (semanas.length === 0) return somas;
  for (const semana of semanas) {
    for (const c of abertosNaJanela(chamados, semana)) somas[paraDataLocal(c.abertura).diaSemana]++;
  }
  return somas.map((s) => s / semanas.length);
}

export interface Problema {
  sistemaId: string;
  motivo: string;
  /** Chamados abertos com este motivo no período. */
  quantidade: number;
  /** Mesma contagem no período anterior. */
  quantidadeAnterior: number;
  /** Destes chamados (de qualquer data), quantos seguem em aberto na referência. */
  emAberto: number;
}

/**
 * Principais problemas: chamados do período agrupados por sistema + motivo,
 * do mais frequente para o menos frequente.
 */
export function principaisProblemas(
  chamados: readonly Chamado[],
  atual: Janela,
  anterior: Janela,
  referencia: Instante,
  limite: number,
): Problema[] {
  const grupos = new Map<string, Problema>();
  const grupo = (c: Chamado) => {
    const chave = `${c.sistemaId}\u0000${c.motivo}`;
    let p = grupos.get(chave);
    if (!p) {
      p = { sistemaId: c.sistemaId, motivo: c.motivo, quantidade: 0, quantidadeAnterior: 0, emAberto: 0 };
      grupos.set(chave, p);
    }
    return p;
  };
  for (const c of chamados) {
    if (dentro(c.abertura, atual)) grupo(c).quantidade++;
    else if (dentro(c.abertura, anterior)) grupo(c).quantidadeAnterior++;
  }
  for (const c of chamados) {
    const p = grupos.get(`${c.sistemaId}\u0000${c.motivo}`);
    if (p && estaEmAberto(c, referencia)) p.emAberto++;
  }
  return [...grupos.values()]
    .filter((p) => p.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade || b.emAberto - a.emAberto || a.motivo.localeCompare(b.motivo, "pt-BR"))
    .slice(0, limite);
}
