import { describe, expect, it } from "vitest";
import { DIA_MS } from "@/lib/datas";
import { janelaAnterior, janelaMovel, lerOrigem, lerPeriodo } from "../periodo";

describe("origem da navegação (link de voltar)", () => {
  it("volta para Sistemas só quando a origem é a lista de sistemas", () => {
    expect(lerOrigem("sistemas")).toBe("sistemas");
    expect(lerOrigem(undefined)).toBe("executiva");
    expect(lerOrigem("qualquer")).toBe("executiva");
  });
});

describe("período de análise", () => {
  it("aceita 7, 30 e 90 dias; qualquer outro valor vira 30", () => {
    expect(lerPeriodo("7")).toBe(7);
    expect(lerPeriodo("90")).toBe(90);
    expect(lerPeriodo(["30", "7"])).toBe(30);
    expect(lerPeriodo("15")).toBe(30);
    expect(lerPeriodo("abc")).toBe(30);
    expect(lerPeriodo(undefined)).toBe(30);
  });

  it("janela móvel inclui a referência e exclui o instante exato N dias antes", () => {
    const ref = 100 * DIA_MS;
    const j = janelaMovel(ref, 7);
    expect(j.inicio).toBe(ref - 7 * DIA_MS + 1);
    expect(j.fim).toBe(ref + 1);
  });

  it("janela anterior tem o mesmo tamanho e termina onde a atual começa", () => {
    const j = janelaMovel(100 * DIA_MS, 30);
    const anterior = janelaAnterior(j);
    expect(anterior.fim).toBe(j.inicio);
    expect(anterior.fim - anterior.inicio).toBe(j.fim - j.inicio);
  });
});
