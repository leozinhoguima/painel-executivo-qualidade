import { DIA_MS } from "@/lib/datas";
import type { Severidade, StatusProntidao } from "../tipos";

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
