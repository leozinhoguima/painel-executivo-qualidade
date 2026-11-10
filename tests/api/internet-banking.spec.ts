import { caso, test } from "./apoio";

const CONTA = "/ib/contas/CC-0001";

test.describe("Internet Banking", () => {
  test(...caso("ib-acesso-01"), async ({ api }) => {
    await api.chamar("POST", "/ib/sessoes", { dados: { usuario: "cliente-1", senha: "senha-ficticia", token: "123456" }, esperado: 201 });
  });

  test(...caso("ib-acesso-02"), async ({ api }) => {
    await api.chamar("POST", "/ib/sessoes", {
      dados: { usuario: `cliente-${Date.now()}-a`, senha: "senha-ficticia", token: "000000" },
      esperado: 401,
    });
  });

  test(...caso("ib-acesso-03"), async ({ api }) => {
    const usuario = `cliente-${Date.now()}-b`;
    const tentativa = { usuario, senha: "senha-ficticia", token: "000000" };
    await api.chamar("POST", "/ib/sessoes", { dados: tentativa, esperado: 401 });
    await api.chamar("POST", "/ib/sessoes", { dados: tentativa, esperado: 401 });
    await api.chamar("POST", "/ib/sessoes", { dados: tentativa, esperado: 423 });
  });

  test(...caso("ib-boletos-01"), async ({ api }) => {
    await api.chamar("POST", "/ib/boletos/pagamentos", { dados: { codigo: "34191.79001 01043.510047" }, esperado: 201 });
  });

  test(...caso("ib-boletos-02"), async ({ api }) => {
    const r = await api.json<{ valor: number; vencimento: string }>("GET", "/ib/boletos/34191790010104351004", { esperado: 200 });
    api.conferir(r.valor > 0 && Boolean(r.vencimento), "Asserção falhou: valor ou vencimento ausente");
  });

  test(...caso("ib-boletos-03"), async ({ api }) => {
    const r = await api.json<{ juros: number; multa: number }>("POST", "/ib/boletos/pagamentos", {
      dados: { codigo: "34191.79001 01043.510047", vencido: true },
      esperado: 201,
    });
    api.conferir(r.juros > 0 && r.multa > 0, "Asserção falhou: juros e multa não foram calculados");
  });

  test(...caso("ib-saldo-01"), async ({ api }) => {
    const r = await api.json<{ disponivel: number }>("GET", `${CONTA}/saldo`, { esperado: 200 });
    api.conferir(typeof r.disponivel === "number", "Asserção falhou: saldo disponível ausente");
  });

  test(...caso("ib-saldo-02"), async ({ api }) => {
    const r = await api.json<{ chequeEspecial: number }>("GET", `${CONTA}/saldo`, { esperado: 200 });
    api.conferir(typeof r.chequeEspecial === "number", "Asserção falhou: cheque especial não está separado");
  });

  test(...caso("ib-saldo-03"), async ({ api }) => {
    await api.chamar("GET", `${CONTA}/saldo`, { esperado: 200, limiteMs: 1000 });
  });

  test(...caso("ib-extrato-01"), async ({ api }) => {
    await api.chamar("GET", `${CONTA}/extrato`, { esperado: 200 });
  });

  test(...caso("ib-extrato-02"), async ({ api }) => {
    await api.chamar("GET", `${CONTA}/extrato?inicio=2026-10-01&fim=2026-10-31`, { esperado: 200 });
  });

  test(...caso("ib-extrato-03"), async ({ api }) => {
    await api.chamar("GET", `${CONTA}/extrato/pdf`, { esperado: 200 });
  });

  test(...caso("ib-dados-01"), async ({ api }) => {
    await api.chamar("PUT", "/ib/clientes/CLI-1", { dados: { endereco: "Rua Fictícia, 100" }, esperado: 200 });
  });

  test(...caso("ib-dados-02"), async ({ api }) => {
    const r = await api.json<{ confirmacaoPendente: string }>("PUT", "/ib/clientes/CLI-1", {
      dados: { telefone: "(11) 90000-0000" },
      esperado: 200,
    });
    api.conferir(r.confirmacaoPendente === "sms", "Asserção falhou: confirmação por SMS não foi exigida");
  });

  test(...caso("ib-dados-03"), async ({ api }) => {
    await api.chamar("PUT", "/ib/clientes/CLI-1", { dados: { email: "email-invalido" }, esperado: 422 });
  });
});
