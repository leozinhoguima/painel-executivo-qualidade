import { describe, expect, it } from "vitest";
import { carregarBaseDemonstracao } from "@/dados/repositorio";
import { criarBase } from "../regras/__testes__/apoio";
import { montarVisaoGerente } from "./gerente";
import {
  consultaDosFiltros,
  ITENS_POR_PAGINA,
  lerFiltrosExecucoes,
  montarVisaoTecnica,
  type FiltrosExecucoes,
} from "./tecnica";

const base = carregarBaseDemonstracao();
const padrao: FiltrosExecucoes = { periodo: 7, sistemaId: null, funcionalidadeId: null, resultado: "todos", pagina: 1 };

describe("leitura dos filtros da URL", () => {
  it("sem parâmetros: 7 dias, tudo, página 1", () => {
    expect(lerFiltrosExecucoes({}, base)).toEqual(padrao);
  });

  it("aceita valores válidos", () => {
    expect(
      lerFiltrosExecucoes(
        { periodo: "30", sistema: "pix", funcionalidade: "pix-qrcode", resultado: "falha", pagina: "3" },
        base,
      ),
    ).toEqual({ periodo: 30, sistemaId: "pix", funcionalidadeId: "pix-qrcode", resultado: "falha", pagina: 3 });
  });

  it("ignora valores desconhecidos sem gerar erro", () => {
    expect(
      lerFiltrosExecucoes({ periodo: "15", sistema: "xyz", funcionalidade: "nada", resultado: "talvez", pagina: "-2" }, base),
    ).toEqual({ ...padrao, periodo: 30 });
  });

  it("descarta funcionalidade que não pertence ao sistema escolhido", () => {
    const f = lerFiltrosExecucoes({ sistema: "cartoes", funcionalidade: "pix-qrcode" }, base);
    expect(f.sistemaId).toBe("cartoes");
    expect(f.funcionalidadeId).toBeNull();
  });

  it("a query string omite os valores padrão e faz ida e volta", () => {
    expect(consultaDosFiltros(padrao)).toBe("");
    const filtros: FiltrosExecucoes = { periodo: 30, sistemaId: "pix", funcionalidadeId: null, resultado: "falha", pagina: 2 };
    const consulta = consultaDosFiltros(filtros);
    expect(consulta).toBe("?periodo=30&sistema=pix&resultado=falha&pagina=2");
    expect(lerFiltrosExecucoes(Object.fromEntries(new URLSearchParams(consulta)), base)).toEqual(filtros);
  });
});

describe("visão técnica com os dados de demonstração", () => {
  it("7 dias sem filtros = 14 rodadas × 75 casos, paginado", () => {
    const v = montarVisaoTecnica(base, padrao);
    expect(v?.total).toBe(14 * 75);
    expect(v?.linhas).toHaveLength(ITENS_POR_PAGINA);
    expect(v?.totalPaginas).toBe(Math.ceil((14 * 75) / ITENS_POR_PAGINA));
  });

  it("lista da mais recente para a mais antiga", () => {
    const linhas = montarVisaoTecnica(base, padrao)?.linhas ?? [];
    for (let i = 1; i < linhas.length; i++) expect(linhas[i - 1].instante).toBeGreaterThanOrEqual(linhas[i].instante);
  });

  it("filtro de falhas: toda linha tem mensagem técnica e tradução de negócio", () => {
    const v = montarVisaoTecnica(base, { ...padrao, resultado: "falha" });
    expect(v?.total).toBe(v?.falhas);
    for (const l of v?.linhas ?? []) {
      expect(l.resultado).toBe("falha");
      expect(l.erroTecnico).toBeTruthy();
      expect(l.descricaoNegocio).toBeTruthy();
    }
  });

  it("a taxa do sistema no período é a mesma da visão do gerente", () => {
    for (const periodo of [7, 30, 90] as const) {
      const tecnica = montarVisaoTecnica(base, { ...padrao, periodo, sistemaId: "pix" });
      const gerente = montarVisaoGerente(base, "pix", periodo);
      expect(tecnica?.taxa).toBe(gerente?.indicadores.taxa);
      expect(tecnica?.total).toBe(gerente?.indicadores.execucoes);
    }
  });

  it("página além do fim é ajustada para a última", () => {
    const v = montarVisaoTecnica(base, { ...padrao, pagina: 999 });
    expect(v?.filtros.pagina).toBe(v?.totalPaginas);
    expect(v?.linhas.length).toBeGreaterThan(0);
  });

  it("filtro sem resultados retorna lista vazia, sem erro", () => {
    const soSucessos = criarBase([{ em: "2026-11-09T06:00", resultados: { "chave-1": "ok", "qr-1": "ok" } }]);
    const v = montarVisaoTecnica(soSucessos, { ...padrao, resultado: "falha" });
    expect(v).toMatchObject({ total: 0, falhas: 0, taxa: null, totalPaginas: 1, primeiraPosicao: 0, ultimaPosicao: 0 });
    expect(v?.linhas).toEqual([]);
  });

  it("sem rodadas retorna nulo", () => {
    expect(montarVisaoTecnica(criarBase([]), padrao)).toBeNull();
  });
});
