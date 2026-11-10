import { describe, expect, it } from "vitest";
import { carregarBase } from "@/dados/repositorio";
import { calcularTaxa, noIntervalo } from "../regras/taxa";
import { criarBase } from "../regras/__testes__/apoio";
import { montarVisaoDiretor } from "./diretor";

describe("visão do diretor com os dados de demonstração", () => {
  const base = carregarBase();
  const visao = montarVisaoDiretor(base);
  if (!visao) throw new Error("dados de demonstração ausentes");

  it("usa a última semana fechada antes da última execução", () => {
    expect(visao.semana.numero).toBe(45);
    expect(visao.ultimaRodada.instante).toBe(base.rodadas.at(-1)?.instante);
  });

  it("a taxa do cartão é a mesma do último ponto da tendência", () => {
    expect(visao.tendencia.at(-1)?.taxa).toBe(visao.indicadores.taxaSemana);
  });

  it("a taxa do cartão bate com a contagem direta das execuções da semana", () => {
    const execs = noIntervalo(base.execucoes, visao.semana.inicio, visao.semana.fim);
    expect(visao.indicadores.taxaSemana).toBe(calcularTaxa(execs).valor);
  });

  it("os contadores de status batem com a lista de prontidão", () => {
    const contar = (s: string) => visao.prontidao.filter((l) => l.status === s).length;
    expect(visao.indicadores.sistemasProntos).toBe(contar("pronto"));
    expect(visao.indicadores.emAtencao).toBe(contar("atencao"));
    expect(visao.indicadores.emRisco).toBe(contar("risco"));
    expect(visao.indicadores.totalSistemas).toBe(base.catalogo.sistemas.length);
  });

  it("a lista de prontidão vem do pior para o melhor", () => {
    expect(visao.prontidao[0].status).toBe("risco");
    expect(visao.prontidao.at(-1)?.status).toBe("pronto");
  });

  it("mostra no máximo três problemas, o mais grave primeiro", () => {
    expect(visao.problemas.length).toBeLessThanOrEqual(3);
    expect(visao.problemas[0].severidade).toBe("critica");
  });

  it("conta a narrativa da demonstração", () => {
    const status = Object.fromEntries(visao.prontidao.map((l) => [l.sistema.id, l.status]));
    expect(status["abertura-conta"]).toBe("risco");
    expect(status.pix).toBe("atencao");
    expect(visao.indicadores.falhasCriticasAbertas).toBe(1);
  });
});

describe("visão do diretor sem dados", () => {
  it("retorna nulo quando não há rodadas", () => {
    expect(montarVisaoDiretor(criarBase([]))).toBeNull();
  });
});
