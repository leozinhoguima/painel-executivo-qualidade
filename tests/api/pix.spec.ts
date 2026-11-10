import { caso, test } from "./apoio";

const MENSAGEM_SALDO = "Saldo insuficiente para concluir o Pix.";

test.describe("Pix", () => {
  test(...caso("pix-chave-01"), async ({ api }) => {
    const r = await api.json<{ saldoRestante: number }>("POST", "/pix/transferencias", {
      dados: { tipoChave: "cpf", chave: "123.456.789-09", valor: 50 },
      esperado: 201,
    });
    api.conferir(r.saldoRestante === 1450, `Asserção falhou: saldo restante ${r.saldoRestante}, esperado 1450`);
  });

  test(...caso("pix-chave-02"), async ({ api }) => {
    const r = await api.json<{ id: string }>("POST", "/pix/transferencias", {
      dados: { tipoChave: "aleatoria", chave: "7f3c-ficticia", valor: 20 },
      esperado: 201,
    });
    api.conferir(/^PIX-/.test(r.id ?? ""), "Asserção falhou: identificador da transação ausente");
  });

  test(...caso("pix-chave-03"), async ({ api }) => {
    const r = await api.json<{ mensagem: string }>("POST", "/pix/transferencias", {
      dados: { tipoChave: "cpf", chave: "123.456.789-09", valor: 999_999 },
      esperado: 422,
    });
    api.conferir(
      r.mensagem === MENSAGEM_SALDO,
      `Texto da mensagem de erro '${r.mensagem}' não corresponde ao texto esperado`,
    );
  });

  test(...caso("pix-qrcode-01"), async ({ api }) => {
    await api.chamar("POST", "/pix/qrcode/pagamentos", { dados: { qrcode: "estatico-loja-ficticia" }, esperado: 201 });
  });

  test(...caso("pix-qrcode-02"), async ({ api }) => {
    const r = await api.json<{ valor: number }>("POST", "/pix/qrcode/pagamentos", {
      dados: { qrcode: "dinamico-pedido-42", valor: 89.9 },
      esperado: 201,
    });
    api.conferir(r.valor === 89.9, `Asserção falhou: valor pago ${r.valor}, esperado 89.9`);
  });

  test(...caso("pix-qrcode-03"), async ({ api }) => {
    await api.chamar("POST", "/pix/qrcode/leitura", { dados: { qrcode: "expirado-pedido-7" }, esperado: 410 });
  });

  test(...caso("pix-devolucao-01"), async ({ api }) => {
    const r = await api.json<{ valorDevolvido: number }>("POST", "/pix/devolucoes", {
      dados: { transacaoId: "PIX-1", valorOriginal: 50, valor: 50 },
      esperado: 201,
    });
    api.conferir(r.valorDevolvido === 50, `Asserção falhou: valor devolvido ${r.valorDevolvido}, esperado 50.00`);
  });

  test(...caso("pix-devolucao-02"), async ({ api }) => {
    const r = await api.json<{ valorDevolvido: number }>("POST", "/pix/devolucoes", {
      dados: { transacaoId: "PIX-2", valorOriginal: 50, valor: 25 },
      esperado: 201,
    });
    api.conferir(
      r.valorDevolvido === 25,
      `Asserção falhou: valor devolvido ${Number(r.valorDevolvido).toFixed(2)}, esperado 25.00`,
    );
  });

  test(...caso("pix-devolucao-03"), async ({ api }) => {
    await api.chamar("POST", "/pix/devolucoes", {
      dados: { transacaoId: "PIX-3", valorOriginal: 50, valor: 80 },
      esperado: 422,
    });
  });

  test(...caso("pix-agendado-01"), async ({ api }) => {
    await api.chamar("POST", "/pix/agendamentos", { dados: { data: "2099-01-15", valor: 100 }, esperado: 201 });
  });

  test(...caso("pix-agendado-02"), async ({ api }) => {
    await api.chamar("DELETE", "/pix/agendamentos/AGD-001", { esperado: 204 });
  });

  test(...caso("pix-agendado-03"), async ({ api }) => {
    await api.chamar("POST", "/pix/agendamentos", { dados: { data: "2020-01-15", valor: 100 }, esperado: 422 });
  });

  test(...caso("pix-comprovantes-01"), async ({ api }) => {
    const r = await api.json("GET", "/pix/comprovantes/CMP-1", { esperado: 200 });
    api.conferir("valor" in r && "favorecido" in r, "Asserção falhou: campos 'valor' e 'favorecido' ausentes na resposta");
    api.conferir("dataHora" in r, "Asserção falhou: campo 'dataHora' ausente na resposta");
  });

  test(...caso("pix-comprovantes-02"), async ({ api }) => {
    const r = await api.json<{ pagina: number; itens: unknown[] }>("GET", "/pix/comprovantes?mes=2026-11", { esperado: 200 });
    api.conferir(r.pagina === 1 && Array.isArray(r.itens), "Asserção falhou: listagem sem paginação");
  });

  test(...caso("pix-comprovantes-03"), async ({ api }) => {
    await api.chamar("GET", "/pix/comprovantes/inexistente", { esperado: 404 });
  });
});
