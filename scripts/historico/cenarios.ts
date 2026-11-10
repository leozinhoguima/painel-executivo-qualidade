/**
 * Roteiro FICTÍCIO de incidentes usado para gerar o histórico de demonstração.
 *
 * Cada incidente faz alguns casos de teste falharem com certa probabilidade
 * durante um intervalo. Fora dos incidentes, há só um ruído mínimo.
 * A narrativa: Cartões tiveram um problema longo em setembro e se recuperaram;
 * nesta semana a Abertura de Conta entrou em risco (validação de documentos) e o
 * Pix pede atenção (QR Code intermitente).
 */

export interface Incidente {
  casos: string[];
  /** Data e hora local (−03:00), inclusivo. */
  inicio: string;
  /** Data e hora local (−03:00), inclusivo. */
  fim: string;
  /** Probabilidade de falha de cada caso afetado em cada rodada. */
  probabilidade: number;
  /** Mensagem técnica; `{req}` é substituído pela requisição do caso. */
  erro: string;
  /** Duração fixa (ms) para falhas por tempo limite. */
  duracaoFalhaMs?: number;
}

export const SEED = 20261109;
export const PRIMEIRA_RODADA = "2026-08-10T06:00:00-03:00";
export const ULTIMA_RODADA = "2026-11-09T06:00:00-03:00";
/** Rodadas automáticas às 06:00 e às 18:00. */
export const INTERVALO_RODADAS_HORAS = 12;
/** Falhas isoladas ocasionais (instabilidade de ambiente). */
export const PROBABILIDADE_RUIDO = 0.001;

const erro5xx = (status: number, esperado: number) => `{req} retornou ${status} (esperado ${esperado})`;

export const INCIDENTES: Incidente[] = [
  // --- Agosto e setembro (resolvidos) ---------------------------------------
  { casos: ["pix-chave-01", "pix-chave-02"], inicio: "2026-08-19T06:00", fim: "2026-08-21T18:00", probabilidade: 0.8, erro: erro5xx(500, 201) },
  { casos: ["ac-cadastro-01", "ac-cadastro-03"], inicio: "2026-08-26T06:00", fim: "2026-08-30T18:00", probabilidade: 0.6, erro: erro5xx(503, 201) },
  { casos: ["tr-favorecidos-01", "tr-favorecidos-02"], inicio: "2026-09-02T06:00", fim: "2026-09-04T18:00", probabilidade: 0.7, erro: erro5xx(500, 201) },
  { casos: ["ib-saldo-01", "ib-saldo-02", "ib-saldo-03"], inicio: "2026-09-08T06:00", fim: "2026-09-09T18:00", probabilidade: 0.7, erro: "Tempo limite de 3000 ms excedido em {req}", duracaoFalhaMs: 3000 },
  { casos: ["ct-fatura-01", "ct-fatura-02", "ct-fatura-03"], inicio: "2026-09-14T06:00", fim: "2026-10-07T06:00", probabilidade: 0.9, erro: erro5xx(503, 200) },
  { casos: ["ct-pagamento-fatura-01", "ct-pagamento-fatura-02"], inicio: "2026-09-18T06:00", fim: "2026-10-06T06:00", probabilidade: 0.8, erro: erro5xx(500, 201) },
  { casos: ["tr-ted-01", "tr-ted-02"], inicio: "2026-09-24T06:00", fim: "2026-10-02T18:00", probabilidade: 0.7, erro: erro5xx(504, 201) },
  { casos: ["ib-extrato-01", "ib-extrato-02", "ib-extrato-03"], inicio: "2026-09-27T06:00", fim: "2026-10-04T18:00", probabilidade: 0.7, erro: erro5xx(503, 200) },
  { casos: ["ct-bloqueio-01"], inicio: "2026-09-29T06:00", fim: "2026-10-03T18:00", probabilidade: 0.5, erro: erro5xx(500, 200) },

  // --- Outubro: incidentes curtos, corrigidos em poucos dias ----------------
  { casos: ["ib-boletos-01", "ib-boletos-03"], inicio: "2026-10-12T06:00", fim: "2026-10-13T18:00", probabilidade: 0.8, erro: erro5xx(500, 201) },
  { casos: ["ib-acesso-01"], inicio: "2026-10-14T06:00", fim: "2026-10-16T06:00", probabilidade: 0.7, erro: erro5xx(503, 201) },
  { casos: ["pix-agendado-01", "pix-agendado-03"], inicio: "2026-10-18T06:00", fim: "2026-10-19T18:00", probabilidade: 0.8, erro: erro5xx(500, 201) },
  { casos: ["tr-agendada-01"], inicio: "2026-10-20T06:00", fim: "2026-10-22T06:00", probabilidade: 0.7, erro: erro5xx(500, 201) },
  { casos: ["ac-contrato-01"], inicio: "2026-10-22T06:00", fim: "2026-10-24T06:00", probabilidade: 0.8, erro: erro5xx(502, 201) },
  { casos: ["ct-virtual-01", "ct-virtual-03"], inicio: "2026-10-27T06:00", fim: "2026-10-28T18:00", probabilidade: 0.9, erro: erro5xx(500, 201) },
  { casos: ["ac-selfie-01", "ac-selfie-03"], inicio: "2026-11-02T06:00", fim: "2026-11-03T18:00", probabilidade: 0.8, erro: "Tempo limite de 15000 ms excedido em {req}", duracaoFalhaMs: 15000 },

  // --- Em aberto na data de referência (09/11/2026) -------------------------
  { casos: ["ib-dados-01"], inicio: "2026-10-25T06:00", fim: "2026-11-09T06:00", probabilidade: 0.35, erro: erro5xx(409, 200) },
  { casos: ["pix-chave-03"], inicio: "2026-11-01T06:00", fim: "2026-11-09T06:00", probabilidade: 0.45, erro: "Texto da mensagem de erro 'Erro 0x51' não corresponde ao texto esperado em {req}" },
  { casos: ["pix-comprovantes-01"], inicio: "2026-11-03T06:00", fim: "2026-11-09T06:00", probabilidade: 0.5, erro: "Asserção falhou: campo 'dataHora' ausente na resposta de {req}" },
  { casos: ["ac-documentos-01", "ac-documentos-02", "ac-documentos-03"], inicio: "2026-11-04T06:00", fim: "2026-11-09T06:00", probabilidade: 0.85, erro: erro5xx(502, 200) },
  { casos: ["pix-qrcode-01", "pix-qrcode-02"], inicio: "2026-11-06T06:00", fim: "2026-11-09T06:00", probabilidade: 0.3, erro: erro5xx(500, 201) },
  { casos: ["pix-devolucao-02"], inicio: "2026-11-07T06:00", fim: "2026-11-09T06:00", probabilidade: 1, erro: "Asserção falhou: valor devolvido 50.00, esperado 25.00 em {req}" },
  { casos: ["ct-limite-01", "ct-limite-02"], inicio: "2026-11-08T06:00", fim: "2026-11-09T06:00", probabilidade: 0.8, erro: "Tempo limite de 8000 ms excedido em {req}", duracaoFalhaMs: 8000 },
];
