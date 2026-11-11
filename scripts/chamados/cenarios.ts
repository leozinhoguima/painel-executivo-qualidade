/**
 * Roteiro FICTÍCIO da central de chamados usada na demonstração de sustentação.
 *
 * Há um volume de base (dúvidas, senhas, transações recusadas…) que segue o
 * ritmo da semana e do mês, e "surtos" de chamados ligados a problemas em
 * funcionalidades. De agosto em diante, os surtos acompanham os incidentes do
 * histórico de testes (scripts/historico/cenarios.ts): o que os testes pegaram
 * também chegou aos clientes. Surtos sem fim continuam enquanto o problema
 * existir, e o robô gera os chamados de cada novo dia.
 */
import type { CanalChamado, CategoriaChamado, Prioridade } from "@/dominio/tipos";

export interface PerfilCategoria {
  categoria: CategoriaChamado;
  /** Participação no volume de base. */
  peso: number;
  prioridades: Partial<Record<Prioridade, number>>;
  motivos: string[];
}

export interface Surto {
  funcionalidadeId: string;
  motivo: string;
  categoria: CategoriaChamado;
  prioridade: Prioridade;
  /** Data e hora local (−03:00). */
  inicio: string;
  /** Quando o problema foi corrigido; nulo = continua em aberto. */
  fim: string | null;
  /** Chamados esperados por dia inteiro de surto. */
  chamadosPorDia: number;
  probabilidadeReabertura: number;
}

export interface CenarioChamados {
  seed: number;
  /** Primeiro dia (local) da central. */
  inicio: string;
  /** Chamados esperados por dia, por sistema, numa quarta-feira comum. */
  volumeBase: Record<string, number>;
  /** Segunda a domingo. */
  fatorDiaSemana: number[];
  /** Por mês (1 a 12); meses ausentes = 1. */
  fatorMes: Partial<Record<number, number>>;
  /** Do dia 1 ao 5: salário, fatura e boletos concentram chamados. */
  fatorInicioMes: number;
  /** Peso relativo de cada hora do dia (0 a 23) na abertura. */
  pesoHora: number[];
  canais: Record<CanalChamado, number>;
  categorias: PerfilCategoria[];
  probabilidadeNoPrazo: number;
  probabilidadeReabertura: number;
  surtos: Surto[];
}

export const CENARIO_CHAMADOS: CenarioChamados = {
  seed: 20261110,
  inicio: "2026-05-01",
  volumeBase: { pix: 7, transferencias: 4, "abertura-conta": 3, cartoes: 6, "internet-banking": 5 },
  fatorDiaSemana: [1.35, 1.15, 1, 0.95, 1.05, 0.5, 0.4],
  fatorMes: { 5: 0.95, 6: 1, 7: 0.9, 8: 1, 9: 1.05, 10: 1, 11: 1.05, 12: 1.1 },
  fatorInicioMes: 1.25,
  pesoHora: [1, 0.5, 0.3, 0.3, 0.3, 0.6, 1.5, 3, 5, 7, 8, 8, 7, 7, 8, 8, 7, 6, 5, 4, 3.5, 3, 2, 1.5],
  canais: { app: 0.5, central: 0.35, agencia: 0.15 },
  categorias: [
    {
      categoria: "duvida",
      peso: 0.35,
      prioridades: { baixa: 0.8, media: 0.2 },
      motivos: [
        "Dúvida sobre tarifas e limites",
        "Dúvida sobre prazo de compensação",
        "Cliente não encontra a opção no aplicativo",
      ],
    },
    {
      categoria: "acesso",
      peso: 0.2,
      prioridades: { media: 0.6, baixa: 0.3, alta: 0.1 },
      motivos: [
        "Senha bloqueada após tentativas",
        "Código de confirmação não chega",
        "Celular novo não autorizado",
      ],
    },
    {
      categoria: "erro-transacao",
      peso: 0.25,
      prioridades: { alta: 0.4, media: 0.5, critica: 0.1 },
      motivos: ["Transação recusada sem motivo aparente", "Valor debitado sem confirmação da operação"],
    },
    {
      categoria: "lentidao",
      peso: 0.12,
      prioridades: { media: 0.7, baixa: 0.3 },
      motivos: ["Telas demoram a carregar", "Operação demora a ser confirmada"],
    },
    {
      categoria: "indisponibilidade",
      peso: 0.08,
      prioridades: { alta: 0.6, critica: 0.4 },
      motivos: ["Serviço fora do ar por alguns minutos"],
    },
  ],
  probabilidadeNoPrazo: 0.95,
  probabilidadeReabertura: 0.04,
  surtos: [
    // --- Maio a julho (antes do histórico de testes) ------------------------
    { funcionalidadeId: "ib-acesso", motivo: "Clientes não conseguem entrar no Internet Banking", categoria: "indisponibilidade", prioridade: "critica", inicio: "2026-05-18T08:00", fim: "2026-05-22T18:00", chamadosPorDia: 10, probabilidadeReabertura: 0.05 },
    { funcionalidadeId: "tr-ted", motivo: "TED para outros bancos não é concluída", categoria: "erro-transacao", prioridade: "critica", inicio: "2026-06-03T09:00", fim: "2026-06-12T18:00", chamadosPorDia: 8, probabilidadeReabertura: 0.08 },
    { funcionalidadeId: "pix-qrcode", motivo: "Pagamento por QR Code recusado na loja", categoria: "erro-transacao", prioridade: "alta", inicio: "2026-07-13T08:00", fim: "2026-07-17T20:00", chamadosPorDia: 9, probabilidadeReabertura: 0.05 },

    // --- Agosto e setembro (mesmos incidentes do histórico de testes) -------
    { funcionalidadeId: "pix-chave", motivo: "Pix pela chave não é enviado", categoria: "erro-transacao", prioridade: "critica", inicio: "2026-08-19T06:00", fim: "2026-08-21T18:00", chamadosPorDia: 14, probabilidadeReabertura: 0.05 },
    { funcionalidadeId: "ac-cadastro", motivo: "Cadastro perde os dados já preenchidos", categoria: "erro-transacao", prioridade: "alta", inicio: "2026-08-26T06:00", fim: "2026-08-30T18:00", chamadosPorDia: 6, probabilidadeReabertura: 0.05 },
    { funcionalidadeId: "tr-favorecidos", motivo: "Novo favorecido não é salvo", categoria: "erro-transacao", prioridade: "media", inicio: "2026-09-02T06:00", fim: "2026-09-04T18:00", chamadosPorDia: 4, probabilidadeReabertura: 0.05 },
    { funcionalidadeId: "ib-saldo", motivo: "Saldo não aparece no Internet Banking", categoria: "lentidao", prioridade: "alta", inicio: "2026-09-08T06:00", fim: "2026-09-09T18:00", chamadosPorDia: 10, probabilidadeReabertura: 0.05 },
    // Cartões: problema longo, com correções apressadas que fizeram chamados voltarem.
    { funcionalidadeId: "ct-fatura", motivo: "Fatura do cartão não abre", categoria: "indisponibilidade", prioridade: "alta", inicio: "2026-09-14T06:00", fim: "2026-10-07T06:00", chamadosPorDia: 9, probabilidadeReabertura: 0.25 },
    { funcionalidadeId: "ct-pagamento-fatura", motivo: "Pagamento da fatura não é concluído", categoria: "erro-transacao", prioridade: "critica", inicio: "2026-09-18T06:00", fim: "2026-10-06T06:00", chamadosPorDia: 7, probabilidadeReabertura: 0.25 },
    { funcionalidadeId: "tr-ted", motivo: "TED para outros bancos não é concluída", categoria: "erro-transacao", prioridade: "critica", inicio: "2026-09-24T06:00", fim: "2026-10-02T18:00", chamadosPorDia: 6, probabilidadeReabertura: 0.08 },
    { funcionalidadeId: "ib-extrato", motivo: "Extrato não carrega", categoria: "indisponibilidade", prioridade: "alta", inicio: "2026-09-27T06:00", fim: "2026-10-04T18:00", chamadosPorDia: 6, probabilidadeReabertura: 0.05 },
    { funcionalidadeId: "ct-bloqueio", motivo: "Cartão perdido não pode ser bloqueado", categoria: "erro-transacao", prioridade: "critica", inicio: "2026-09-29T06:00", fim: "2026-10-03T18:00", chamadosPorDia: 4, probabilidadeReabertura: 0.05 },

    // --- Outubro: problemas curtos ------------------------------------------
    { funcionalidadeId: "ib-boletos", motivo: "Boleto não é pago pelo Internet Banking", categoria: "erro-transacao", prioridade: "critica", inicio: "2026-10-12T06:00", fim: "2026-10-13T18:00", chamadosPorDia: 8, probabilidadeReabertura: 0.05 },
    { funcionalidadeId: "ib-acesso", motivo: "Clientes não conseguem entrar no Internet Banking", categoria: "indisponibilidade", prioridade: "critica", inicio: "2026-10-14T06:00", fim: "2026-10-16T06:00", chamadosPorDia: 7, probabilidadeReabertura: 0.05 },
    { funcionalidadeId: "pix-agendado", motivo: "Pix agendado não foi executado", categoria: "erro-transacao", prioridade: "media", inicio: "2026-10-18T06:00", fim: "2026-10-19T18:00", chamadosPorDia: 5, probabilidadeReabertura: 0.05 },
    { funcionalidadeId: "tr-agendada", motivo: "Transferência agendada não ocorreu na data", categoria: "erro-transacao", prioridade: "alta", inicio: "2026-10-20T06:00", fim: "2026-10-22T06:00", chamadosPorDia: 4, probabilidadeReabertura: 0.05 },
    { funcionalidadeId: "ac-contrato", motivo: "Conta aprovada não foi aberta", categoria: "erro-transacao", prioridade: "alta", inicio: "2026-10-22T06:00", fim: "2026-10-24T06:00", chamadosPorDia: 3, probabilidadeReabertura: 0.05 },
    { funcionalidadeId: "ct-virtual", motivo: "Cartão virtual não é gerado", categoria: "erro-transacao", prioridade: "media", inicio: "2026-10-27T06:00", fim: "2026-10-28T18:00", chamadosPorDia: 5, probabilidadeReabertura: 0.05 },
    { funcionalidadeId: "ac-selfie", motivo: "Cadastro travado na etapa da selfie", categoria: "lentidao", prioridade: "alta", inicio: "2026-11-02T06:00", fim: "2026-11-03T18:00", chamadosPorDia: 6, probabilidadeReabertura: 0.05 },

    // --- Ainda em aberto: os mesmos problemas que a API fictícia reproduz ----
    { funcionalidadeId: "ib-dados", motivo: "Endereço e telefone não são atualizados", categoria: "erro-transacao", prioridade: "baixa", inicio: "2026-10-25T06:00", fim: null, chamadosPorDia: 1.5, probabilidadeReabertura: 0.1 },
    { funcionalidadeId: "pix-chave", motivo: "Mensagem de erro confusa ao enviar Pix", categoria: "duvida", prioridade: "media", inicio: "2026-11-01T06:00", fim: null, chamadosPorDia: 2, probabilidadeReabertura: 0.1 },
    { funcionalidadeId: "pix-comprovantes", motivo: "Comprovante de Pix sem data e hora", categoria: "erro-transacao", prioridade: "baixa", inicio: "2026-11-03T06:00", fim: null, chamadosPorDia: 3, probabilidadeReabertura: 0.1 },
    { funcionalidadeId: "ac-documentos", motivo: "Cadastro travado no envio de documentos", categoria: "indisponibilidade", prioridade: "critica", inicio: "2026-11-04T06:00", fim: null, chamadosPorDia: 12, probabilidadeReabertura: 0.2 },
    { funcionalidadeId: "pix-qrcode", motivo: "Pagamento por QR Code falha às vezes", categoria: "erro-transacao", prioridade: "alta", inicio: "2026-11-06T06:00", fim: null, chamadosPorDia: 6, probabilidadeReabertura: 0.2 },
    { funcionalidadeId: "pix-devolucao", motivo: "Devolução de Pix com valor errado", categoria: "erro-transacao", prioridade: "alta", inicio: "2026-11-07T06:00", fim: null, chamadosPorDia: 4, probabilidadeReabertura: 0.15 },
    { funcionalidadeId: "ct-limite", motivo: "Limite do cartão demora a aparecer", categoria: "lentidao", prioridade: "media", inicio: "2026-11-08T06:00", fim: null, chamadosPorDia: 5, probabilidadeReabertura: 0.1 },
  ],
};
