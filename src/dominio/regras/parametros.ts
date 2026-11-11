import { DIA_MS, HORA_MS } from "@/lib/datas";
import type { Prioridade, Severidade, StatusProntidao } from "../tipos";

/** Meta de sucesso dos testes: um sistema só está "Pronto" com 95% ou mais. */
export const META_SUCESSO = 0.95;
/** Abaixo deste patamar o sistema está em "Risco". */
export const LIMITE_RISCO = 0.85;
/** Meta de tempo médio de correção, em dias corridos. */
export const META_CORRECAO_DIAS = 3;
/** Janela do tempo médio de correção na visão executiva. */
export const JANELA_CORRECAO_DIAS = 30;
/** Quantidade de semanas no gráfico de tendência da visão executiva. */
export const SEMANAS_TENDENCIA = 6;

/**
 * Defeitos derivados das execuções:
 * - o mesmo problema (funcionalidade + descrição de negócio) falha 2 vezes com
 *   menos de 4 dias entre uma falha e outra → defeito aberto;
 * - 4 dias sem nova falha, com pelo menos 2 sucessos dos testes afetados → resolvido.
 */
export const FALHAS_PARA_ABRIR = 2;
export const JANELA_DEFEITO_MS = 4 * DIA_MS;
export const SUCESSOS_PARA_RESOLVER = 2;
/** Numeração inicial dos códigos de defeito por sistema (PX-101, PX-102…). */
export const NUMERO_INICIAL_DEFEITO = 101;

export const ORDEM_SEVERIDADE: Record<Severidade, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

/** Do pior para o melhor. */
export const ORDEM_STATUS: Record<StatusProntidao, number> = {
  risco: 0,
  atencao: 1,
  "sem-dados": 2,
  pronto: 3,
};

// ---------------------------------------------------------------------------
// Sustentação (chamados em produção)
// ---------------------------------------------------------------------------

/** Prazo de atendimento por prioridade, da abertura ao primeiro fechamento (tempo corrido). */
export const PRAZO_ATENDIMENTO_MS: Record<Prioridade, number> = {
  critica: 4 * HORA_MS,
  alta: 1 * DIA_MS,
  media: 3 * DIA_MS,
  baixa: 5 * DIA_MS,
};
/** Meta: pelo menos 90% dos chamados resolvidos dentro do prazo. */
export const META_NO_PRAZO = 0.9;
/** Meta de taxa de reabertura: no máximo 5% dos fechamentos voltam. */
export const META_REABERTURA = 0.05;
/** Dias exibidos no gráfico de abertos × fechados. */
export const DIAS_GRAFICO_DIARIO = 30;
/** Dias exibidos na evolução da fila em aberto. */
export const DIAS_GRAFICO_FILA = 90;
/** Meses fechados no comparativo mês a mês. */
export const MESES_COMPARATIVO = 6;
/** Semanas fechadas usadas na média por dia da semana. */
export const SEMANAS_MEDIA_DIA_SEMANA = 8;
/** Quantidade de itens em "Principais problemas". */
export const LIMITE_PROBLEMAS_SUSTENTACAO = 5;

/**
 * Ligação chamado ↔ defeito: mesma funcionalidade e abertura do chamado entre
 * 1 dia antes da primeira falha (os testes rodam a cada 12 h, então o problema
 * pode começar antes de ser detectado) e 1 dia depois da correção (o cliente
 * costuma reclamar com atraso).
 */
export const TOLERANCIA_VINCULO_MS = DIA_MS;
