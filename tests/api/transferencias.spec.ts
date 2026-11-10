import { caso, test } from "./apoio";

test.describe("Transferências", () => {
  test(...caso("tr-ted-01"), async ({ api }) => {
    await api.chamar("POST", "/transferencias/ted", {
      dados: { banco: "999", agencia: "0001", conta: "12345-6", valor: 300 },
      esperado: 201,
    });
  });

  test(...caso("tr-ted-02"), async ({ api }) => {
    const r = await api.json<{ situacao: string }>("POST", "/transferencias/ted", {
      dados: { banco: "999", agencia: "0001", conta: "12345-6", valor: 300, foraDoHorario: true },
      esperado: 202,
    });
    api.conferir(r.situacao === "agendada-proximo-dia-util", `Asserção falhou: situação '${r.situacao}', esperada agendamento`);
  });

  test(...caso("tr-ted-03"), async ({ api }) => {
    await api.chamar("POST", "/transferencias/ted", {
      dados: { banco: "999", agencia: "0000", conta: "12345-6", valor: 300 },
      esperado: 422,
    });
  });

  test(...caso("tr-interna-01"), async ({ api }) => {
    await api.chamar("POST", "/transferencias/internas", { dados: { contaDestino: "54321-0", valor: 80 }, esperado: 201 });
  });

  test(...caso("tr-interna-02"), async ({ api }) => {
    await api.chamar("POST", "/transferencias/internas", { dados: { contaDestino: "99999-9", valor: 80 }, esperado: 422 });
  });

  test(...caso("tr-interna-03"), async ({ api }) => {
    const r = await api.json<{ situacao: string }>("GET", "/transferencias/TRI-001", { esperado: 200 });
    api.conferir(r.situacao === "concluida", `Asserção falhou: situação '${r.situacao}', esperada 'concluida'`);
  });

  test(...caso("tr-agendada-01"), async ({ api }) => {
    await api.chamar("POST", "/transferencias/agendamentos", { dados: { data: "2099-02-01", valor: 500 }, esperado: 201 });
  });

  test(...caso("tr-agendada-02"), async ({ api }) => {
    await api.chamar("GET", "/transferencias/agendamentos", { esperado: 200 });
  });

  test(...caso("tr-agendada-03"), async ({ api }) => {
    await api.chamar("DELETE", "/transferencias/agendamentos/TRA-001", { esperado: 204 });
  });

  test(...caso("tr-favorecidos-01"), async ({ api }) => {
    await api.chamar("POST", "/favorecidos", { dados: { nome: "Favorecido Novo", cpf: "333.333.333-33" }, esperado: 201 });
  });

  test(...caso("tr-favorecidos-02"), async ({ api }) => {
    await api.chamar("GET", "/favorecidos", { esperado: 200 });
  });

  test(...caso("tr-favorecidos-03"), async ({ api }) => {
    await api.chamar("POST", "/favorecidos", { dados: { nome: "Já Cadastrado", cpf: "111.111.111-11" }, esperado: 409 });
  });

  test(...caso("tr-limites-01"), async ({ api }) => {
    const r = await api.json<{ disponivelHoje: number }>("GET", "/transferencias/limites", { esperado: 200 });
    api.conferir(typeof r.disponivelHoje === "number", "Asserção falhou: valor disponível ausente");
  });

  test(...caso("tr-limites-02"), async ({ api }) => {
    const r = await api.json<{ diurno: number; noturno: number }>("GET", "/transferencias/limites", { esperado: 200 });
    api.conferir(r.noturno < r.diurno, `Asserção falhou: limite noturno ${r.noturno} não é menor que o diurno ${r.diurno}`);
  });

  test(...caso("tr-limites-03"), async ({ api }) => {
    await api.chamar("PUT", "/transferencias/limites", { dados: { diurno: 15000 }, esperado: 202 });
  });
});
