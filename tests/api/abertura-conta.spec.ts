import { test } from "@playwright/test";
import { caso } from "./apoio";

test.describe("Abertura de Conta", () => {
  caso("ac-documentos-01", async (api) => {
    const r = await api.json<{ resultado: string }>("POST", "/onboarding/documentos/validacao", {
      dados: { tipo: "rg", frente: "imagem-ficticia", verso: "imagem-ficticia" },
      esperado: 200,
    });
    api.conferir(r.resultado === "aprovado", `Asserção falhou: resultado '${r.resultado}', esperado 'aprovado'`);
  });

  caso("ac-documentos-02", async (api) => {
    const r = await api.json<{ resultado: string }>("POST", "/onboarding/documentos/validacao", {
      dados: { tipo: "cnh-digital", arquivo: "cnh-ficticia.pdf" },
      esperado: 200,
    });
    api.conferir(r.resultado === "aprovado", `Asserção falhou: resultado '${r.resultado}', esperado 'aprovado'`);
  });

  caso("ac-documentos-03", async (api) => {
    const r = await api.json<{ mensagem: string }>("POST", "/onboarding/documentos/validacao", {
      dados: { tipo: "rg", legivel: false },
      esperado: 422,
    });
    api.conferir(/nova foto/.test(r.mensagem ?? ""), "Asserção falhou: orientação de reenvio ausente");
  });

  caso("ac-selfie-01", async (api) => {
    await api.chamar("POST", "/onboarding/biometria", { dados: { selfie: "imagem-ficticia" }, esperado: 200 });
  });

  caso("ac-selfie-02", async (api) => {
    await api.chamar("POST", "/onboarding/biometria", { dados: { selfie: "imagem-ficticia", iluminacao: "baixa" }, esperado: 422 });
  });

  caso("ac-selfie-03", async (api) => {
    await api.chamar("POST", "/onboarding/biometria", { dados: { selfie: "imagem-ficticia", provaDeVida: true }, esperado: 200, limiteMs: 5000 });
  });

  caso("ac-cadastro-01", async (api) => {
    await api.chamar("POST", "/onboarding/cadastro", { dados: { nome: "Cliente Fictício", cpf: "444.444.444-44" }, esperado: 201 });
  });

  caso("ac-cadastro-02", async (api) => {
    await api.chamar("POST", "/onboarding/cadastro", { dados: { nome: "Já Cliente", cpf: "222.222.222-22" }, esperado: 409 });
  });

  caso("ac-cadastro-03", async (api) => {
    const r = await api.json<{ nome: string; cep: string }>("PATCH", "/onboarding/cadastro/CAD-001", {
      dados: { cep: "01000-000" },
      esperado: 200,
    });
    api.conferir(r.nome === "Cliente Fictício" && r.cep === "01000-000", "Asserção falhou: dados preenchidos foram perdidos");
  });

  caso("ac-contrato-01", async (api) => {
    const r = await api.json<{ contaAberta: boolean }>("POST", "/onboarding/contrato/assinatura", {
      dados: { proposta: "PRO-1", codigo: "valido" },
      esperado: 201,
    });
    api.conferir(r.contaAberta === true, "Asserção falhou: conta não foi aberta após a assinatura");
  });

  caso("ac-contrato-02", async (api) => {
    const r = await api.chamar("GET", "/onboarding/contrato/PRO-1", { esperado: 200 });
    api.conferir(r.headers()["content-type"] === "application/pdf", "Asserção falhou: contrato não veio em PDF");
  });

  caso("ac-contrato-03", async (api) => {
    await api.chamar("POST", "/onboarding/contrato/assinatura", { dados: { proposta: "PRO-1", codigo: "expirado" }, esperado: 410 });
  });

  caso("ac-proposta-01", async (api) => {
    const r = await api.json<{ etapa: string }>("GET", "/onboarding/propostas/PRO-1", { esperado: 200 });
    api.conferir(Boolean(r.etapa), "Asserção falhou: etapa atual ausente");
  });

  caso("ac-proposta-02", async (api) => {
    const r = await api.json<{ motivo: string }>("GET", "/onboarding/propostas/reprovada", { esperado: 200 });
    api.conferir(Boolean(r.motivo), "Asserção falhou: motivo da reprovação ausente");
  });

  caso("ac-proposta-03", async (api) => {
    await api.chamar("GET", "/onboarding/propostas/inexistente", { esperado: 404 });
  });
});
