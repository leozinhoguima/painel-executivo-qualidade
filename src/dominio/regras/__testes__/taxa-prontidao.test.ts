import { describe, expect, it } from "vitest";
import { classificarProntidao, compararPiorPrimeiro } from "../prontidao";
import { arredondarComoExibido, calcularTaxa, noIntervalo, variacaoEmPontos } from "../taxa";

const resultados = (sucessos: number, falhas: number) => [
  ...Array.from({ length: sucessos }, () => ({ resultado: "sucesso" as const })),
  ...Array.from({ length: falhas }, () => ({ resultado: "falha" as const })),
];

describe("taxa de sucesso", () => {
  it("é sucessos ÷ execuções", () => {
    expect(calcularTaxa(resultados(47, 3))).toEqual({ sucessos: 47, total: 50, valor: 0.94 });
  });

  it("é nula sem execuções (nunca 0% nem 100% inventado)", () => {
    expect(calcularTaxa([]).valor).toBeNull();
  });

  it("filtra por intervalo [início, fim)", () => {
    const execs = [{ instante: 10 }, { instante: 20 }, { instante: 30 }];
    expect(noIntervalo(execs, 10, 30)).toEqual([{ instante: 10 }, { instante: 20 }]);
  });

  it("variação em pontos percentuais", () => {
    expect(variacaoEmPontos(0.942, 0.918)).toBeCloseTo(2.4);
    expect(variacaoEmPontos(0.9, null)).toBeNull();
  });

  it("arredonda como exibido na tela", () => {
    expect(arredondarComoExibido(0.9496)).toBe(0.95);
    expect(arredondarComoExibido(0.94949)).toBe(0.949);
  });
});

describe("semáforo de prontidão", () => {
  it("Pronto com 95% ou mais e sem defeito crítico ou alto", () => {
    expect(classificarProntidao(0.95, [])).toBe("pronto");
    expect(classificarProntidao(0.99, ["media", "baixa"])).toBe("pronto");
  });

  it("Atenção abaixo de 95% ou com defeito alto", () => {
    expect(classificarProntidao(0.94, [])).toBe("atencao");
    expect(classificarProntidao(1, ["alta"])).toBe("atencao");
    expect(classificarProntidao(0.85, [])).toBe("atencao");
  });

  it("Risco abaixo de 85% ou com defeito crítico, mesmo com 100%", () => {
    expect(classificarProntidao(0.849, [])).toBe("risco");
    expect(classificarProntidao(1, ["critica"])).toBe("risco");
  });

  it("usa o valor exibido: 94,96% aparece como 95,0% e é Pronto", () => {
    expect(classificarProntidao(0.9496, [])).toBe("pronto");
    expect(classificarProntidao(0.9494, [])).toBe("atencao");
  });

  it("sem execuções: Sem dados, a menos que haja defeito grave aberto", () => {
    expect(classificarProntidao(null, [])).toBe("sem-dados");
    expect(classificarProntidao(null, ["critica"])).toBe("risco");
  });

  it("ordena do pior para o melhor", () => {
    const linhas = [
      { id: "a", status: "pronto" as const, taxa: 0.99 },
      { id: "b", status: "risco" as const, taxa: 0.9 },
      { id: "c", status: "pronto" as const, taxa: 0.96 },
      { id: "d", status: "atencao" as const, taxa: 0.93 },
    ];
    expect([...linhas].sort(compararPiorPrimeiro).map((l) => l.id)).toEqual(["b", "d", "c", "a"]);
  });
});
