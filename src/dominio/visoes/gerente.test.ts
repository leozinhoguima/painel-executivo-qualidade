import { describe, expect, it } from "vitest";
import { carregarBaseDemonstracao } from "@/dados/repositorio";
import { criarBase } from "../regras/__testes__/apoio";
import { calcularTaxa, noIntervalo } from "../regras/taxa";
import { montarVisaoDiretor } from "./diretor";
import { montarVisaoGerente } from "./gerente";

const base = carregarBaseDemonstracao();

describe("visão do gerente com os dados de demonstração", () => {
  const visao = montarVisaoGerente(base, "pix", 30);
  if (!visao) throw new Error("visão do Pix ausente");

  it("a taxa bate com a contagem direta das execuções do sistema no período", () => {
    const execs = noIntervalo(
      base.execucoes.filter((e) => e.sistemaId === "pix"),
      visao.janela.inicio,
      visao.janela.fim,
    );
    expect(visao.indicadores.taxa).toBe(calcularTaxa(execs).valor);
    expect(visao.indicadores.execucoes).toBe(execs.length);
  });

  it("30 dias com rodadas a cada 12 horas = 60 execuções automáticas", () => {
    expect(visao.indicadores.rodadas).toBe(60);
    expect(montarVisaoGerente(base, "pix", 7)?.indicadores.rodadas).toBe(14);
  });

  it("o total de defeitos em aberto é a soma das severidades e o tamanho da tabela", () => {
    const s = visao.indicadores.porSeveridade;
    expect(s.critica + s.alta + s.media + s.baixa).toBe(visao.indicadores.defeitosAbertos);
    expect(visao.defeitos).toHaveLength(visao.indicadores.defeitosAbertos);
  });

  it("as execuções das funcionalidades somam as do sistema", () => {
    const soma = visao.funcionalidades.reduce((acc, f) => acc + f.execucoes, 0);
    expect(soma).toBe(visao.indicadores.execucoes);
  });

  it("os defeitos em aberto são os mesmos contados na visão executiva", () => {
    const diretor = montarVisaoDiretor(base);
    const linha = diretor?.prontidao.find((l) => l.sistema.id === "pix");
    expect(linha?.defeitosAbertos).toBe(visao.indicadores.defeitosAbertos);
  });

  it("funcionalidades vêm da pior para a melhor e defeitos do mais grave", () => {
    expect(visao.funcionalidades[0].status).not.toBe("pronto");
    expect(visao.defeitos[0].severidade).toBe("alta");
  });

  it("um defeito crítico deixa o sistema em Risco em qualquer período", () => {
    for (const periodo of [7, 30, 90] as const) {
      expect(montarVisaoGerente(base, "abertura-conta", periodo)?.status).toBe("risco");
    }
  });
});

describe("visão do gerente: casos-limite", () => {
  it("sistema inexistente retorna nulo", () => {
    expect(montarVisaoGerente(base, "nao-existe", 30)).toBeNull();
  });

  it("sem execuções retorna nulo", () => {
    expect(montarVisaoGerente(criarBase([]), "pix", 30)).toBeNull();
  });
});
