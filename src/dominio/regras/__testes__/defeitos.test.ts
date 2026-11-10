import { describe, expect, it } from "vitest";
import { DIA_MS } from "@/lib/datas";
import type { Defeito } from "@/dominio/tipos";
import { compararPorPrioridade, derivarDefeitos, diasEmAberto, tempoMedioCorrecao } from "../defeitos";
import { criarBase, instante } from "./apoio";

const ERRO = "POST /pix retornou 500 (esperado 201)";

describe("derivação de defeitos a partir das execuções", () => {
  it("uma falha isolada não abre defeito", () => {
    const base = criarBase([
      { em: "2026-11-01T06:00", resultados: { "chave-1": ERRO } },
      { em: "2026-11-01T18:00", resultados: { "chave-1": "ok" } },
    ]);
    expect(derivarDefeitos(base, instante("2026-11-02T06:00"))).toEqual([]);
  });

  it("duas falhas do mesmo problema em menos de 4 dias abrem um defeito", () => {
    const base = criarBase([
      { em: "2026-11-01T06:00", resultados: { "chave-1": ERRO } },
      { em: "2026-11-02T06:00", resultados: { "chave-1": ERRO } },
    ]);
    const [defeito] = derivarDefeitos(base, instante("2026-11-03T06:00"));
    expect(defeito).toMatchObject({
      codigo: "PX-101",
      severidade: "critica",
      situacao: "aberto",
      descricaoNegocio: "Falha no envio de Pix",
      abertoEm: instante("2026-11-01T06:00"),
      resolvidoEm: null,
      ocorrencias: 2,
    });
  });

  it("falhas de testes diferentes pelo mesmo motivo formam um único defeito", () => {
    const base = criarBase([{ em: "2026-11-01T06:00", resultados: { "chave-1": ERRO, "chave-2": ERRO } }]);
    const defeitos = derivarDefeitos(base, instante("2026-11-01T07:00"));
    expect(defeitos).toHaveLength(1);
    expect(defeitos[0].casosAfetados).toEqual(["chave-1", "chave-2"]);
  });

  it("resolve após 4 dias sem falhas e 2 sucessos; resolução = primeiro sucesso", () => {
    const base = criarBase([
      { em: "2026-11-01T06:00", resultados: { "chave-1": ERRO } },
      { em: "2026-11-01T18:00", resultados: { "chave-1": ERRO } },
      { em: "2026-11-02T06:00", resultados: { "chave-1": "ok" } },
      { em: "2026-11-03T06:00", resultados: { "chave-1": "ok" } },
    ]);
    // 3 dias após a última falha: ainda aberto
    expect(derivarDefeitos(base, instante("2026-11-04T18:00"))[0].resolvidoEm).toBeNull();
    // 4 dias após a última falha: resolvido
    const [resolvido] = derivarDefeitos(base, instante("2026-11-05T18:00"));
    expect(resolvido.situacao).toBe("resolvido");
    expect(resolvido.resolvidoEm).toBe(instante("2026-11-02T06:00"));
  });

  it("sem sucessos depois da última falha, continua aberto mesmo após 4 dias", () => {
    const base = criarBase([
      { em: "2026-11-01T06:00", resultados: { "chave-1": ERRO } },
      { em: "2026-11-01T18:00", resultados: { "chave-1": ERRO } },
    ]);
    expect(derivarDefeitos(base, instante("2026-11-10T06:00"))[0].resolvidoEm).toBeNull();
  });

  it("um problema que volta depois de resolvido gera novo defeito com novo código", () => {
    const base = criarBase([
      { em: "2026-11-01T06:00", resultados: { "chave-1": ERRO } },
      { em: "2026-11-01T18:00", resultados: { "chave-1": ERRO } },
      { em: "2026-11-02T06:00", resultados: { "chave-1": "ok" } },
      { em: "2026-11-02T18:00", resultados: { "chave-1": "ok" } },
      { em: "2026-11-08T06:00", resultados: { "chave-1": ERRO } },
      { em: "2026-11-08T18:00", resultados: { "chave-1": ERRO } },
    ]);
    const defeitos = derivarDefeitos(base, instante("2026-11-09T06:00"));
    expect(defeitos.map((d) => [d.codigo, d.situacao])).toEqual([
      ["PX-101", "resolvido"],
      ["PX-102", "aberto"],
    ]);
  });

  it("ignora o que aconteceu depois da data de referência", () => {
    const base = criarBase([
      { em: "2026-11-01T06:00", resultados: { "chave-1": ERRO } },
      { em: "2026-11-05T06:00", resultados: { "chave-1": ERRO } },
    ]);
    expect(derivarDefeitos(base, instante("2026-11-03T06:00"))).toEqual([]);
  });

  it("numera por sistema na ordem de confirmação", () => {
    const base = criarBase([
      { em: "2026-11-01T06:00", resultados: { "limite-1": "Tempo limite de 8000 ms excedido em GET /limite" } },
      { em: "2026-11-01T18:00", resultados: { "limite-1": "Tempo limite de 8000 ms excedido em GET /limite", "qr-1": "POST /pix/qr retornou 500" } },
      { em: "2026-11-02T06:00", resultados: { "qr-1": "POST /pix/qr retornou 500", "chave-1": ERRO } },
      { em: "2026-11-02T18:00", resultados: { "chave-1": ERRO } },
    ]);
    const defeitos = derivarDefeitos(base, instante("2026-11-03T06:00"));
    expect(defeitos.map((d) => `${d.codigo} ${d.descricaoNegocio}`)).toEqual([
      "CT-101 Lentidão em “Consulta de limite”",
      "PX-101 Falha em “Envio por QR Code”",
      "PX-102 Falha no envio de Pix",
    ]);
  });

  it("o acompanhamento define situação, responsável e pode rebaixar a severidade", () => {
    const base = criarBase(
      [{ em: "2026-11-01T06:00", resultados: { "chave-1": ERRO, "chave-2": ERRO } }],
      [{ codigoDefeito: "PX-101", situacao: "aguardando-decisao", responsavel: "Gerência X", severidade: "baixa" }],
    );
    expect(derivarDefeitos(base, instante("2026-11-02T06:00"))[0]).toMatchObject({
      situacao: "aguardando-decisao",
      responsavel: "Gerência X",
      severidade: "baixa",
    });
  });
});

describe("indicadores de defeitos", () => {
  const defeito = (parcial: Partial<Defeito>): Defeito => ({
    codigo: "PX-101",
    sistemaId: "pix",
    funcionalidadeId: "pix-chave",
    casosAfetados: [],
    severidade: "media",
    situacao: "aberto",
    abertoEm: 0,
    resolvidoEm: null,
    descricaoNegocio: "",
    erroTecnico: "",
    ocorrencias: 2,
    ...parcial,
  });

  it("tempo médio de correção considera só os resolvidos no período", () => {
    const defeitos = [
      defeito({ abertoEm: 0, resolvidoEm: 2 * DIA_MS }),
      defeito({ abertoEm: DIA_MS, resolvidoEm: 4 * DIA_MS }),
      defeito({ abertoEm: 0, resolvidoEm: null }),
      defeito({ abertoEm: 0, resolvidoEm: 40 * DIA_MS }),
    ];
    expect(tempoMedioCorrecao(defeitos, 0, 10 * DIA_MS)).toEqual({ mediaDias: 2.5, quantidade: 2 });
    expect(tempoMedioCorrecao([], 0, 1)).toEqual({ mediaDias: null, quantidade: 0 });
  });

  it("dias em aberto em dias corridos completos", () => {
    expect(diasEmAberto(defeito({ abertoEm: 0 }), 5.5 * DIA_MS)).toBe(5);
  });

  it("prioriza severidade, depois aguardando decisão, depois o mais antigo", () => {
    const lista = [
      defeito({ codigo: "A", severidade: "alta", abertoEm: 0 }),
      defeito({ codigo: "B", severidade: "critica", abertoEm: 5 }),
      defeito({ codigo: "C", severidade: "alta", abertoEm: 3, situacao: "aguardando-decisao" }),
      defeito({ codigo: "D", severidade: "critica", abertoEm: 1 }),
    ];
    expect([...lista].sort(compararPorPrioridade).map((d) => d.codigo)).toEqual(["D", "B", "C", "A"]);
  });
});
