import { test } from "@playwright/test";
import { caso } from "./apoio";

const CARTAO = "/cartoes/CRT-0001";

test.describe("Cartões", () => {
  caso("ct-bloqueio-01", async (api) => {
    const r = await api.json<{ bloqueado: boolean }>("POST", `${CARTAO}/bloqueio`, { dados: { tipo: "temporario" }, esperado: 200 });
    api.conferir(r.bloqueado === true, "Asserção falhou: cartão não ficou bloqueado");
  });

  caso("ct-bloqueio-02", async (api) => {
    const r = await api.json<{ bloqueado: boolean }>("DELETE", `${CARTAO}/bloqueio`, { esperado: 200 });
    api.conferir(r.bloqueado === false, "Asserção falhou: cartão continua bloqueado");
  });

  caso("ct-bloqueio-03", async (api) => {
    const r = await api.json<{ segundaVia: boolean }>("POST", `${CARTAO}/bloqueio`, {
      dados: { tipo: "definitivo", motivo: "perda" },
      esperado: 200,
    });
    api.conferir(r.segundaVia === true, "Asserção falhou: segunda via não foi gerada");
  });

  caso("ct-pagamento-fatura-01", async (api) => {
    await api.chamar("POST", `${CARTAO}/fatura/pagamento`, { dados: { valor: 1840.3 }, esperado: 201 });
  });

  caso("ct-pagamento-fatura-02", async (api) => {
    const r = await api.json<{ saldoRemanescente: number }>("POST", `${CARTAO}/fatura/pagamento`, {
      dados: { valor: 276 },
      esperado: 201,
    });
    api.conferir(r.saldoRemanescente > 0, "Asserção falhou: saldo remanescente ausente após pagamento mínimo");
  });

  caso("ct-pagamento-fatura-03", async (api) => {
    await api.chamar("POST", `${CARTAO}/fatura/pagamento`, { dados: { valor: 99_999 }, esperado: 422 });
  });

  caso("ct-fatura-01", async (api) => {
    const r = await api.json<{ lancamentos: unknown[] }>("GET", `${CARTAO}/fatura`, { esperado: 200 });
    api.conferir(Array.isArray(r.lancamentos) && r.lancamentos.length > 0, "Asserção falhou: fatura sem lançamentos");
  });

  caso("ct-fatura-02", async (api) => {
    await api.chamar("GET", `${CARTAO}/fatura?mes=anterior`, { esperado: 200 });
  });

  caso("ct-fatura-03", async (api) => {
    await api.chamar("GET", `${CARTAO}/fatura/pdf`, { esperado: 200 });
  });

  caso("ct-limite-01", async (api) => {
    await api.chamar("GET", `${CARTAO}/limite`, { esperado: 200, limiteMs: 2000 });
  });

  caso("ct-limite-02", async (api) => {
    const r = await api.json<{ total: number; utilizado: number; pendente: number; disponivel: number }>(
      "GET",
      `${CARTAO}/limite`,
      { esperado: 200 },
    );
    api.conferir(
      r.disponivel === r.total - r.utilizado - r.pendente,
      `Asserção falhou: limite disponível ${r.disponivel} não desconta compras pendentes`,
    );
  });

  caso("ct-limite-03", async (api) => {
    await api.chamar("PUT", `${CARTAO}/limite`, { dados: { valor: 6000 }, esperado: 200 });
  });

  caso("ct-virtual-01", async (api) => {
    const r = await api.json<{ numero: string }>("POST", "/cartoes/virtuais", { dados: { cliente: "cliente-1" }, esperado: 201 });
    api.conferir(/^\*{4} \*{4} \*{4} \d{4}$/.test(r.numero ?? ""), "Asserção falhou: número do cartão não está mascarado");
  });

  caso("ct-virtual-02", async (api) => {
    await api.chamar("DELETE", "/cartoes/virtuais/VIR-001", { esperado: 204 });
  });

  caso("ct-virtual-03", async (api) => {
    await api.chamar("POST", "/cartoes/virtuais", { dados: { cliente: "cliente-com-5-virtuais" }, esperado: 422 });
  });
});
