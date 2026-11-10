import { describe, expect, it } from "vitest";
import { descreverImpacto } from "../problemas";
import { gerarResumoSemana, resumoComoTexto, type SistemaNoResumo } from "../resumo";
import { direcaoDaVariacao } from "../tendencia";
import { traduzirErro } from "../traducao";
import { REGRAS_TESTE } from "./apoio";

describe("tradução de erros técnicos para linguagem de negócio", () => {
  const funcionalidade = { nome: "Consulta de limite" };

  it("usa a regra específica quando o padrão casa", () => {
    expect(traduzirErro("POST /pix retornou 500 (esperado 201)", funcionalidade, REGRAS_TESTE)).toBe(
      "Falha no envio de Pix",
    );
  });

  it("aplica regras genéricas por tipo de erro", () => {
    expect(traduzirErro("Tempo limite de 8000 ms excedido em GET /x", funcionalidade, [])).toBe(
      "Lentidão em “Consulta de limite”",
    );
    expect(traduzirErro("GET /x retornou 503", funcionalidade, [])).toBe("Falha em “Consulta de limite”");
    expect(traduzirErro("PUT /x retornou 409", funcionalidade, [])).toBe(
      "“Consulta de limite” recusada indevidamente",
    );
    expect(traduzirErro("Asserção falhou", funcionalidade, [])).toBe("Resultado incorreto em “Consulta de limite”");
    expect(traduzirErro(undefined, funcionalidade, [])).toBe("Resultado incorreto em “Consulta de limite”");
  });
});

describe("impacto exibido nos principais problemas", () => {
  const f = { impactoNegocio: "clientes não enviam Pix" };

  it("problema intermitente mostra a frequência", () => {
    expect(descreverImpacto(f, 0.2)).toBe("cerca de 1 em cada 5 tentativas falha nos testes");
  });

  it("problema constante mostra a consequência de negócio", () => {
    expect(descreverImpacto(f, 0.9)).toBe("clientes não enviam Pix");
    expect(descreverImpacto(f, null)).toBe("clientes não enviam Pix");
  });
});

describe("resumo da semana", () => {
  const sistema = (nome: string, artigo: "o" | "a" | "os" | "as", status: SistemaNoResumo["status"], extra: Partial<SistemaNoResumo> = {}): SistemaNoResumo => ({
    sistema: { nome, artigo },
    status,
    taxa: 0.97,
    problemaPrincipal: null,
    ...extra,
  });

  it("gera o texto do exemplo, com nomes de sistemas em destaque", () => {
    const trechos = gerarResumoSemana({
      sistemas: [
        sistema("Abertura de Conta", "a", "risco", {
          taxa: 0.84,
          problemaPrincipal: { descricao: "Falha na validação de documentos", diasAberto: 5 },
        }),
        sistema("Pix", "o", "atencao", { problemaPrincipal: { descricao: "Erro no envio por QR Code", diasAberto: 3 } }),
        sistema("Cartões", "os", "pronto"),
        sistema("Transferências", "as", "pronto"),
        sistema("Internet Banking", "o", "pronto"),
      ],
      taxaSemana: 0.942,
      variacaoPontos: 2.4,
      aguardandoDecisao: 1,
    });

    expect(resumoComoTexto(trechos)).toBe(
      "3 de 5 sistemas estão prontos para publicação. A Abertura de Conta está em risco por falha na validação de documentos, em aberto há 5 dias. O Pix pede atenção: erro no envio por QR Code. A taxa geral de sucesso subiu 2,4 pontos, para 94,2%. 1 problema aguarda decisão da gestão.",
    );
    expect(trechos.filter((t) => t.destaque).map((t) => t.texto)).toEqual(["Abertura de Conta", "Pix"]);
  });

  it("concorda plural e explica risco por taxa quando não há defeito", () => {
    const texto = resumoComoTexto(
      gerarResumoSemana({
        sistemas: [sistema("Cartões", "os", "risco", { taxa: 0.8 }), sistema("Pix", "o", "pronto")],
        taxaSemana: 0.9,
        variacaoPontos: -1,
        aguardandoDecisao: 0,
      }),
    );
    expect(texto).toBe(
      "1 de 2 sistemas está pronto para publicação. Os Cartões estão em risco: 80,0% de sucesso na semana, abaixo do mínimo de 85%. A taxa geral de sucesso caiu 1,0 ponto, para 90,0%.",
    );
  });

  it("todos prontos, sem dados e estabilidade", () => {
    expect(
      resumoComoTexto(
        gerarResumoSemana({
          sistemas: [sistema("Pix", "o", "pronto"), sistema("Cartões", "os", "pronto")],
          taxaSemana: 0.98,
          variacaoPontos: 0.2,
          aguardandoDecisao: 0,
        }),
      ),
    ).toBe("Todos os 2 sistemas estão prontos para publicação. A taxa geral de sucesso ficou estável em 98,0%.");

    expect(
      resumoComoTexto(
        gerarResumoSemana({
          sistemas: [sistema("Internet Banking", "o", "sem-dados", { taxa: null })],
          taxaSemana: null,
          variacaoPontos: null,
          aguardandoDecisao: 0,
        }),
      ),
    ).toBe("Nenhum dos 1 sistemas está pronto para publicação. Não houve testes do Internet Banking na semana.");
  });

  it("direção da variação ignora oscilações menores que 0,5 ponto", () => {
    expect(direcaoDaVariacao(0.4)).toBe("estavel");
    expect(direcaoDaVariacao(-0.6)).toBe("caiu");
    expect(direcaoDaVariacao(null)).toBe("estavel");
  });
});
