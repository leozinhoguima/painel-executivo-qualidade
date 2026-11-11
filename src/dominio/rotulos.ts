import type { CanalChamado, CategoriaChamado, Prioridade, Severidade, SituacaoDefeito, StatusProntidao } from "./tipos";

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

export const ROTULO_CATEGORIA: Record<CategoriaChamado, string> = {
  indisponibilidade: "Indisponibilidade",
  "erro-transacao": "Erro em transação",
  lentidao: "Lentidão",
  duvida: "Dúvida de cliente",
  acesso: "Acesso e senha",
};

export const ROTULO_PRIORIDADE: Record<Prioridade, string> = ROTULO_SEVERIDADE;

export const ROTULO_CANAL: Record<CanalChamado, string> = {
  app: "Aplicativo",
  central: "Central de atendimento",
  agencia: "Agência",
};
