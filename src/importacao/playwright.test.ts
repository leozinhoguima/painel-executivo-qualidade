import { describe, expect, it } from "vitest";
import { montarBase, validarArquivoExecucoes } from "@/dados/validacao";
import { CATALOGO_TESTE, REGRAS_TESTE } from "@/dominio/regras/__testes__/apoio";
import { derivarDefeitos } from "@/dominio/regras/defeitos";
import { converterRelatorioPlaywright, ErroImportacao, limparMensagem } from "./playwright";

/** Relatório no formato do reporter "json" do Playwright, reduzido ao essencial. */
function relatorio(testes: { caso?: string; status: string; mensagem?: string; duracao?: number }[]) {
  return {
    config: {},
    stats: { startTime: "2026-11-10T19:43:24.996Z", duration: 5256, expected: 1, unexpected: 1 },
    errors: [],
    suites: [
      {
        title: "pix.spec.ts",
        specs: [],
        suites: [
          {
            title: "Pix",
            specs: testes.map((t, i) => ({
              title: `teste ${i}`,
              tests: [
                {
                  timeout: 15000,
                  annotations: t.caso ? [{ type: "caso", description: t.caso }] : [],
                  status: t.status === "passed" ? "expected" : "unexpected",
                  results: [
                    {
                      status: t.status,
                      duration: t.duracao ?? 120.4,
                      ...(t.mensagem ? { error: { message: t.mensagem } } : {}),
                    },
                  ],
                },
              ],
            })),
          },
        ],
      },
    ],
  };
}

describe("importação do relatório do Playwright", () => {
  it("converte sucessos e falhas para o formato do painel", () => {
    const r = converterRelatorioPlaywright(
      relatorio([
        { caso: "chave-1", status: "passed" },
        { caso: "chave-2", status: "failed", mensagem: "Error: POST /pix retornou 500 (esperado 201)\n\n  at apoio.ts:30" },
      ]),
      CATALOGO_TESTE,
    );
    expect(r.arquivo.rodadas).toHaveLength(1);
    expect(r.arquivo.rodadas[0]).toMatchObject({
      id: "suite-20261110-164324",
      dataHora: "2026-11-10T16:43:24-03:00",
      origem: "suite-automatizada",
    });
    expect(r.arquivo.rodadas[0].execucoes).toEqual([
      { casoId: "chave-1", resultado: "sucesso", duracaoMs: 120 },
      { casoId: "chave-2", resultado: "falha", duracaoMs: 120, erroTecnico: "POST /pix retornou 500 (esperado 201)" },
    ]);
    expect(r.nomeArquivo).toBe("2026-11-10-164324.json");
    expect(r.resumo).toEqual({ total: 2, sucessos: 1, falhas: 1 });
  });

  it("gera um arquivo válido no mesmo formato do histórico, que alimenta as regras", () => {
    const r = converterRelatorioPlaywright(
      relatorio([
        { caso: "chave-1", status: "failed", mensagem: "Error: POST /pix retornou 500 (esperado 201)" },
        { caso: "chave-2", status: "failed", mensagem: "Error: POST /pix retornou 500 (esperado 201)" },
      ]),
      CATALOGO_TESTE,
    );
    const arquivo = validarArquivoExecucoes(JSON.parse(JSON.stringify(r.arquivo)), "teste");
    const base = montarBase(CATALOGO_TESTE, [{ origem: "teste", conteudo: arquivo }], [], REGRAS_TESTE);
    const [defeito] = derivarDefeitos(base, Date.parse("2026-11-10T20:00:00Z"));
    expect(defeito.descricaoNegocio).toBe("Falha no envio de Pix");
  });

  it("tempo limite do Playwright vira mensagem de lentidão com a requisição do catálogo", () => {
    const r = converterRelatorioPlaywright(relatorio([{ caso: "limite-1", status: "timedOut" }]), CATALOGO_TESTE);
    expect(r.arquivo.rodadas[0].execucoes[0].erroTecnico).toBe("Tempo limite de 15000 ms excedido em GET /limite");
  });

  it("registra avisos sem interromper: sem anotação, caso desconhecido, repetido, pulado e ausentes", () => {
    const r = converterRelatorioPlaywright(
      relatorio([
        { status: "passed" },
        { caso: "nao-existe", status: "passed" },
        { caso: "chave-1", status: "passed" },
        { caso: "chave-1", status: "passed" },
        { caso: "qr-1", status: "skipped" },
      ]),
      CATALOGO_TESTE,
    );
    expect(r.resumo.total).toBe(1);
    expect(r.avisos).toEqual([
      'Teste sem anotação "caso" ignorado: "teste 0"',
      'Caso "nao-existe" não existe no catálogo; teste ignorado',
      'Caso "chave-1" apareceu mais de uma vez; mantida a primeira ocorrência',
      'Caso "qr-1" não foi executado (ignorado na rodada)',
      "3 caso(s) do catálogo sem resultado nesta rodada",
    ]);
  });

  it("recusa relatórios sem a estrutura esperada ou sem nenhum caso", () => {
    expect(() => converterRelatorioPlaywright({ foo: 1 }, CATALOGO_TESTE)).toThrow(ErroImportacao);
    expect(() => converterRelatorioPlaywright(relatorio([{ status: "passed" }]), CATALOGO_TESTE)).toThrow(/nenhum teste/);
  });

  it("limpa cores ANSI, prefixo de erro e linhas extras", () => {
    expect(limparMensagem("\u001b[31mError: falhou\u001b[39m\n  at x")).toBe("falhou");
    expect(limparMensagem("FalhaDeTeste: Tempo limite")).toBe("Tempo limite");
  });
});
