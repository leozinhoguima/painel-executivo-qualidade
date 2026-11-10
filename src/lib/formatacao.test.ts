import { describe, expect, it } from "vitest";
import { instanteLocal } from "./datas";
import {
  formatarDataHora,
  formatarIntervaloSemana,
  formatarPercentual,
  formatarPercentualCurto,
  formatarPontos,
  formatarTempoAberto,
  minusculaInicial,
  pluralizar,
} from "./formatacao";

describe("formatação pt-BR", () => {
  it("percentual com uma casa e vírgula", () => {
    expect(formatarPercentual(0.942)).toBe("94,2%");
    expect(formatarPercentual(1)).toBe("100,0%");
    expect(formatarPercentual(null)).toBe("—");
  });

  it("percentual curto para metas", () => {
    expect(formatarPercentualCurto(0.95)).toBe("95%");
    expect(formatarPercentualCurto(0.925)).toBe("92,5%");
  });

  it("pontos com sinal tipográfico", () => {
    expect(formatarPontos(2.44)).toBe("+2,4");
    expect(formatarPontos(-1.6)).toBe("−1,6");
    expect(formatarPontos(0.01)).toBe("0,0");
  });

  it("intervalo da semana no mesmo mês, entre meses e entre anos", () => {
    expect(formatarIntervaloSemana({ inicio: instanteLocal(2026, 11, 2) })).toBe("02 a 08 de novembro de 2026");
    expect(formatarIntervaloSemana({ inicio: instanteLocal(2026, 10, 26) })).toBe(
      "26 de outubro a 01 de novembro de 2026",
    );
    expect(formatarIntervaloSemana({ inicio: instanteLocal(2025, 12, 29) })).toBe(
      "29 de dezembro de 2025 a 04 de janeiro de 2026",
    );
  });

  it("tempo em aberto no singular, plural e hoje", () => {
    expect(formatarTempoAberto(5)).toBe("Aberta há 5 dias");
    expect(formatarTempoAberto(1)).toBe("Aberta há 1 dia");
    expect(formatarTempoAberto(0, "o")).toBe("Aberto hoje");
  });

  it("data e hora local", () => {
    expect(formatarDataHora(instanteLocal(2026, 11, 9, 6))).toBe("09/11/2026, 06:00");
  });

  it("auxiliares de texto", () => {
    expect(pluralizar(1842, "teste", "testes")).toBe("1.842 testes");
    expect(minusculaInicial("Falha na validação")).toBe("falha na validação");
  });
});
