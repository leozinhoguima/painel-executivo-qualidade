/**
 * Rotas da API FICTÍCIA do Banco Aurora. Respostas e regras de negócio são
 * inventadas e servem apenas para a suíte de testes da demonstração.
 */
import type { Resposta } from "./falhas";

export interface Requisicao {
  params: Record<string, string>;
  query: URLSearchParams;
  corpo: Record<string, unknown>;
}

export interface Rota {
  metodo: string;
  /** Mesmo formato do catálogo de casos de teste: "/pix/comprovantes/{id}". */
  padrao: string;
  tratar: (r: Requisicao) => Resposta;
}

const ok = (corpo: unknown, status = 200): Resposta => ({ status, corpo });
const recusa = (status: number, mensagem: string): Resposta => ({ status, corpo: { mensagem } });
const num = (v: unknown, padrao = 0) => (typeof v === "number" ? v : padrao);
const txt = (v: unknown, padrao = "") => (typeof v === "string" ? v : padrao);
const PDF = { status: 200, corpo: "%PDF-1.4 documento fictício", tipoConteudo: "application/pdf" };

const SALDO_PIX = 1500;
const LIMITE_CARTAO = { total: 8000, utilizado: 2350, pendente: 400 };
const tentativasAcesso = new Map<string, number>();

export const ROTAS: Rota[] = [
  // ---------------------------------------------------------------- Pix
  {
    metodo: "POST",
    padrao: "/pix/transferencias",
    tratar: ({ corpo }) => {
      const valor = num(corpo.valor);
      if (valor > SALDO_PIX) return recusa(422, "Saldo insuficiente para concluir o Pix.");
      return ok({ id: `PIX-${Math.round(valor * 100)}-${txt(corpo.tipoChave, "chave")}`, situacao: "concluida", saldoRestante: SALDO_PIX - valor }, 201);
    },
  },
  {
    metodo: "POST",
    padrao: "/pix/qrcode/pagamentos",
    tratar: ({ corpo }) => ok({ id: "PIX-QR-001", situacao: "concluida", valor: num(corpo.valor, 35) }, 201),
  },
  {
    metodo: "POST",
    padrao: "/pix/qrcode/leitura",
    tratar: ({ corpo }) =>
      txt(corpo.qrcode).startsWith("expirado")
        ? recusa(410, "Este QR Code expirou. Peça um novo ao recebedor.")
        : ok({ valor: 35, recebedor: "Loja Fictícia" }),
  },
  {
    metodo: "POST",
    padrao: "/pix/devolucoes",
    tratar: ({ corpo }) => {
      const original = num(corpo.valorOriginal);
      const solicitado = num(corpo.valor);
      if (solicitado > original) return recusa(422, "O valor da devolução é maior que o do Pix original.");
      return ok({ id: "DEV-001", valorOriginal: original, valorDevolvido: solicitado }, 201);
    },
  },
  {
    metodo: "POST",
    padrao: "/pix/agendamentos",
    tratar: ({ corpo }) =>
      Date.parse(txt(corpo.data)) < Date.now()
        ? recusa(422, "A data do agendamento precisa ser futura.")
        : ok({ id: "AGD-001", situacao: "agendado" }, 201),
  },
  { metodo: "DELETE", padrao: "/pix/agendamentos/{id}", tratar: () => ({ status: 204 }) },
  {
    metodo: "GET",
    padrao: "/pix/comprovantes/{id}",
    tratar: ({ params }) =>
      params.id === "inexistente"
        ? recusa(404, "Comprovante não encontrado.")
        : ok({ id: params.id, valor: 120.5, favorecido: "Favorecido Fictício", dataHora: "2026-11-08T14:32:00-03:00" }),
  },
  {
    metodo: "GET",
    padrao: "/pix/comprovantes",
    tratar: () => ok({ pagina: 1, totalPaginas: 3, itens: [{ id: "CMP-1" }, { id: "CMP-2" }] }),
  },

  // ---------------------------------------------------------------- Transferências
  {
    metodo: "POST",
    padrao: "/transferencias/ted",
    tratar: ({ corpo }) => {
      if (txt(corpo.agencia) === "0000") return recusa(422, "Agência inválida.");
      if (corpo.foraDoHorario === true) return ok({ id: "TED-002", situacao: "agendada-proximo-dia-util" }, 202);
      return ok({ id: "TED-001", situacao: "concluida" }, 201);
    },
  },
  {
    metodo: "POST",
    padrao: "/transferencias/internas",
    tratar: ({ corpo }) =>
      txt(corpo.contaDestino) === "99999-9"
        ? recusa(422, "A conta de destino está encerrada.")
        : ok({ id: "TRI-001", situacao: "concluida" }, 201),
  },
  { metodo: "GET", padrao: "/transferencias/{id}", tratar: ({ params }) => ok({ id: params.id, situacao: "concluida" }) },
  { metodo: "POST", padrao: "/transferencias/agendamentos", tratar: () => ok({ id: "TRA-001", situacao: "agendada" }, 201) },
  { metodo: "GET", padrao: "/transferencias/agendamentos", tratar: () => ok({ itens: [{ id: "TRA-001" }] }) },
  { metodo: "DELETE", padrao: "/transferencias/agendamentos/{id}", tratar: () => ({ status: 204 }) },
  {
    metodo: "POST",
    padrao: "/favorecidos",
    tratar: ({ corpo }) =>
      txt(corpo.cpf) === "111.111.111-11"
        ? recusa(409, "Este favorecido já está cadastrado.")
        : ok({ id: "FAV-001" }, 201),
  },
  { metodo: "GET", padrao: "/favorecidos", tratar: () => ok({ itens: [{ id: "FAV-001", nome: "Favorecido Fictício" }] }) },
  {
    metodo: "GET",
    padrao: "/transferencias/limites",
    tratar: () => ok({ diurno: 10000, noturno: 1000, disponivelHoje: 7200 }),
  },
  { metodo: "PUT", padrao: "/transferencias/limites", tratar: () => ok({ situacao: "pendente-confirmacao" }, 202) },

  // ---------------------------------------------------------------- Abertura de Conta
  {
    metodo: "POST",
    padrao: "/onboarding/documentos/validacao",
    tratar: ({ corpo }) =>
      corpo.legivel === false
        ? recusa(422, "Não conseguimos ler o documento. Envie uma nova foto com boa iluminação.")
        : ok({ resultado: "aprovado", tipo: txt(corpo.tipo) }),
  },
  {
    metodo: "POST",
    padrao: "/onboarding/biometria",
    tratar: ({ corpo }) =>
      txt(corpo.iluminacao) === "baixa"
        ? recusa(422, "A foto ficou escura. Procure um lugar mais iluminado.")
        : ok({ resultado: "compativel" }),
  },
  {
    metodo: "POST",
    padrao: "/onboarding/cadastro",
    tratar: ({ corpo }) =>
      txt(corpo.cpf) === "222.222.222-22"
        ? recusa(409, "Este CPF já é cliente do Banco Aurora.")
        : ok({ id: "CAD-001", nome: txt(corpo.nome) }, 201),
  },
  {
    metodo: "PATCH",
    padrao: "/onboarding/cadastro/{id}",
    tratar: ({ params, corpo }) => ok({ id: params.id, nome: "Cliente Fictício", ...corpo }),
  },
  {
    metodo: "POST",
    padrao: "/onboarding/contrato/assinatura",
    tratar: ({ corpo }) =>
      txt(corpo.codigo) === "expirado"
        ? recusa(410, "O código de assinatura expirou.")
        : ok({ contaAberta: true, conta: "12345-6" }, 201),
  },
  { metodo: "GET", padrao: "/onboarding/contrato/{id}", tratar: () => PDF },
  {
    metodo: "GET",
    padrao: "/onboarding/propostas/{id}",
    tratar: ({ params }) => {
      if (params.id === "inexistente") return recusa(404, "Proposta não encontrada.");
      if (params.id === "reprovada") return ok({ situacao: "reprovada", motivo: "Documento com dados divergentes do cadastro." });
      return ok({ situacao: "em-analise", etapa: "validacao-documentos" });
    },
  },

  // ---------------------------------------------------------------- Cartões
  {
    metodo: "POST",
    padrao: "/cartoes/{id}/bloqueio",
    tratar: ({ corpo }) =>
      ok({ bloqueado: true, tipo: txt(corpo.tipo), segundaVia: txt(corpo.tipo) === "definitivo" }),
  },
  { metodo: "DELETE", padrao: "/cartoes/{id}/bloqueio", tratar: () => ok({ bloqueado: false }) },
  {
    metodo: "POST",
    padrao: "/cartoes/{id}/fatura/pagamento",
    tratar: ({ corpo }) => {
      const valor = num(corpo.valor);
      if (valor > 5000) return recusa(422, "Saldo insuficiente para pagar a fatura.");
      return ok({ id: "PGF-001", saldoRemanescente: Math.max(0, 1840.3 - valor) }, 201);
    },
  },
  {
    metodo: "GET",
    padrao: "/cartoes/{id}/fatura",
    tratar: ({ query }) =>
      ok({ mes: query.get("mes") ?? "atual", total: 1840.3, lancamentos: [{ descricao: "Compra fictícia", valor: 89.9 }] }),
  },
  { metodo: "GET", padrao: "/cartoes/{id}/fatura/pdf", tratar: () => PDF },
  {
    metodo: "GET",
    padrao: "/cartoes/{id}/limite",
    tratar: () =>
      ok({
        ...LIMITE_CARTAO,
        disponivel: LIMITE_CARTAO.total - LIMITE_CARTAO.utilizado - LIMITE_CARTAO.pendente,
      }),
  },
  {
    metodo: "PUT",
    padrao: "/cartoes/{id}/limite",
    tratar: ({ corpo }) =>
      num(corpo.valor) > LIMITE_CARTAO.total
        ? recusa(422, "O valor ultrapassa o limite aprovado.")
        : ok({ total: num(corpo.valor) }),
  },
  {
    metodo: "POST",
    padrao: "/cartoes/virtuais",
    tratar: ({ corpo }) =>
      txt(corpo.cliente) === "cliente-com-5-virtuais"
        ? recusa(422, "Limite de 5 cartões virtuais atingido.")
        : ok({ id: "VIR-001", numero: "**** **** **** 4821" }, 201),
  },
  { metodo: "DELETE", padrao: "/cartoes/virtuais/{id}", tratar: () => ({ status: 204 }) },

  // ---------------------------------------------------------------- Internet Banking
  {
    metodo: "POST",
    padrao: "/ib/sessoes",
    tratar: ({ corpo }) => {
      const usuario = txt(corpo.usuario);
      if (txt(corpo.token) === "123456") return ok({ sessao: "SES-001" }, 201);
      const tentativas = (tentativasAcesso.get(usuario) ?? 0) + 1;
      tentativasAcesso.set(usuario, tentativas);
      return tentativas >= 3 ? recusa(423, "Acesso bloqueado após 3 tentativas.") : recusa(401, "Token inválido.");
    },
  },
  {
    metodo: "POST",
    padrao: "/ib/boletos/pagamentos",
    tratar: ({ corpo }) => {
      const valor = 250;
      if (corpo.vencido === true) return ok({ id: "BOL-002", valor, juros: 2.5, multa: 5, total: 257.5 }, 201);
      return ok({ id: "BOL-001", valor, juros: 0, multa: 0, total: valor }, 201);
    },
  },
  {
    metodo: "GET",
    padrao: "/ib/boletos/{codigo}",
    tratar: () => ok({ valor: 250, vencimento: "2026-11-20", beneficiario: "Empresa Fictícia" }),
  },
  {
    metodo: "GET",
    padrao: "/ib/contas/{id}/saldo",
    tratar: () => ok({ disponivel: 3250.75, chequeEspecial: 2000 }),
  },
  {
    metodo: "GET",
    padrao: "/ib/contas/{id}/extrato",
    tratar: ({ query }) =>
      ok({ inicio: query.get("inicio") ?? "ultimos-30-dias", lancamentos: [{ descricao: "Pix recebido", valor: 120 }] }),
  },
  { metodo: "GET", padrao: "/ib/contas/{id}/extrato/pdf", tratar: () => PDF },
  {
    metodo: "PUT",
    padrao: "/ib/clientes/{id}",
    tratar: ({ corpo }) => {
      if (typeof corpo.email === "string" && !corpo.email.includes("@")) return recusa(422, "E-mail inválido.");
      if (typeof corpo.telefone === "string") return ok({ atualizado: false, confirmacaoPendente: "sms" });
      return ok({ atualizado: true });
    },
  },
];

/** Converte "/cartoes/{id}/limite" em expressão regular com grupos nomeados. */
function compilar(padrao: string): RegExp {
  const corpo = padrao.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\\?\{(\w+)\\?\}/g, "(?<$1>[^/]+)");
  return new RegExp(`^${corpo}$`);
}

const COMPILADAS = ROTAS.map((r) => ({ ...r, regex: compilar(r.padrao) }));

/** Encontra a rota (rotas fixas têm prioridade sobre as com parâmetro). */
export function encontrarRota(metodo: string, caminho: string) {
  const candidatas = COMPILADAS.filter((r) => r.metodo === metodo)
    .map((r) => ({ rota: r, encontro: r.regex.exec(caminho) }))
    .filter((c) => c.encontro !== null)
    .sort((a, b) => a.rota.padrao.split("{").length - b.rota.padrao.split("{").length);
  const melhor = candidatas[0];
  if (!melhor || !melhor.encontro) return null;
  return { rota: melhor.rota, params: { ...melhor.encontro.groups } as Record<string, string> };
}
