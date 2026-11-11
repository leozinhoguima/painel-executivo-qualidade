import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CENARIO_CHAMADOS } from "../../../scripts/chamados/cenarios";
import { gerarChamados } from "../../../scripts/chamados/gerador";
import { validarCatalogo } from "@/dados/validacao";
import { montarBaseChamados } from "@/dados/validacaoChamados";
import { chamadosEmAberto, contarEventos } from "../regras/chamados";
import { montarVisaoSustentacao } from "./sustentacao";

// Base fixa (09/11/2026 06:00), independente do arquivo que o robô atualiza.
const catalogo = validarCatalogo(JSON.parse(readFileSync(path.join(process.cwd(), "data", "catalogo.json"), "utf8")));
const base = montarBaseChamados(catalogo, gerarChamados(catalogo, CENARIO_CHAMADOS, "2026-11-09T06:00:00-03:00"));

describe("visão de sustentação com os dados de demonstração", () => {
  for (const recorte of ["dia", "semana", "mes"] as const) {
    const visao = montarVisaoSustentacao(base, recorte);
    if (!visao) throw new Error("visão ausente");

    describe(`recorte ${recorte}`, () => {
      it("os cartões batem com a contagem direta dos eventos", () => {
        const c = contarEventos(base.chamados, visao.periodo.atual);
        expect(visao.indicadores.abertos.valor).toBe(c.abertos);
        expect(visao.indicadores.fechados.valor).toBe(c.fechados);
        expect(visao.indicadores.reabertos.valor).toBe(c.reabertos);
      });

      it("as distribuições somam os chamados abertos no período", () => {
        const total = visao.indicadores.abertos.valor;
        const soma = (fatias: { quantidade: number }[]) => fatias.reduce((a, f) => a + f.quantidade, 0);
        expect(soma(visao.porCategoria)).toBe(total);
        expect(soma(visao.porPrioridade)).toBe(total);
        expect(soma(visao.porSistema)).toBe(total);
      });
    });
  }

  const semana = montarVisaoSustentacao(base, "semana");
  if (!semana) throw new Error("visão ausente");

  it("a fila em aberto é a da data de referência e o gráfico termina no fim de ontem", () => {
    expect(semana.indicadores.emAberto.valor).toBe(chamadosEmAberto(base.chamados, base.referencia).length);
    expect(semana.fila).toHaveLength(90);
    expect(semana.fila.at(-1)?.rotulo).toBe("08/11");
    expect(semana.indicadores.emAberto.foraDoPrazo).toBeLessThanOrEqual(semana.indicadores.emAberto.valor);
  });

  it("gráficos de evolução: 30 dias, 6 meses e 7 dias da semana", () => {
    expect(semana.diario).toHaveLength(30);
    expect(semana.diario.at(-1)?.descricao).toBe("domingo, 08/11/2026");
    expect(semana.mensal.map((m) => m.rotulo)).toEqual(["mai", "jun", "jul", "ago", "set", "out"]);
    expect(semana.diasDaSemana.map((d) => d.rotulo)).toEqual(["seg", "ter", "qua", "qui", "sex", "sáb", "dom"]);
  });

  it("a última semana do gráfico por dia da semana soma os chamados da semana fechada", () => {
    const soma = semana.diasDaSemana.reduce((a, d) => a + d.ultimaSemana, 0);
    expect(soma).toBe(semana.indicadores.abertos.valor);
  });

  it("conta a narrativa: Abertura de Conta lidera os problemas da semana 45", () => {
    expect(semana.rotuloPeriodo).toBe("Semana 45 · 02 a 08 de novembro de 2026");
    expect(semana.problemas[0]).toMatchObject({
      sistemaNome: "Abertura de Conta",
      motivo: "Cadastro travado no envio de documentos",
    });
    expect(semana.indicadores.abertos.variacao).toBeGreaterThan(0.5);
  });

  it("outubro teve a onda de reaberturas de Cartões", () => {
    const outubro = semana.mensal.find((m) => m.rotulo === "out");
    const setembro = semana.mensal.find((m) => m.rotulo === "set");
    expect(outubro && setembro && outubro.reabertos > 2 * setembro.reabertos).toBe(true);
  });

  it("rótulos de comparação por recorte", () => {
    expect(montarVisaoSustentacao(base, "dia")?.rotuloComparacao).toBe("vs. o domingo anterior (01/11)");
    expect(montarVisaoSustentacao(base, "mes")?.rotuloPeriodo).toBe("Novembro de 2026 até 08/11 (8 dias)");
    expect(montarVisaoSustentacao(base, "mes")?.rotuloComparacao).toBe("vs. 01 a 08/10");
  });

  it("sem chamados, não há visão", () => {
    expect(montarVisaoSustentacao({ ...base, chamados: [] }, "semana")).toBeNull();
  });
});
