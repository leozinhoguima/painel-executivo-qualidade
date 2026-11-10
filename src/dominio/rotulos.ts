import type { Severidade, SituacaoDefeito, StatusProntidao } from "./tipos";

/** Rótulos em linguagem de negócio, compartilhados entre telas e textos gerados. */

export const ROTULO_STATUS: Record<StatusProntidao, string> = {
  pronto: "Pronto",
  atencao: "Atenção",
  risco: "Risco",
  "sem-dados": "Sem dados",
};

export const ROTULO_SEVERIDADE: Record<Severidade, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const ROTULO_SITUACAO: Record<SituacaoDefeito, string> = {
  aberto: "Aberto",
  "em-analise": "Em análise",
  "em-correcao": "Em correção",
  "aguardando-decisao": "Aguardando decisão",
  resolvido: "Resolvido",
};
