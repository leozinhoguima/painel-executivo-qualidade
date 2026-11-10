import { describe, expect, it } from "vitest";
import { carregarBaseDemonstracao } from "@/dados/repositorio";
import { criarBase } from "../regras/__testes__/apoio";
import { resumoComoTexto } from "../regras/resumo";
import { montarVisaoDiretor } from "./diretor";
import { montarRelatorio } from "./relatorio";

const base = carregarBaseDemonstracao();
const relatorio = montarRelatorio(base);
if (!relatorio) throw new Error("relatório ausente");

describe("relatório semanal", () => {
  it("usa exatamente os mesmos números da visão executiva", () => {
    const visao = montarVisaoDiretor(base);
    expect(relatorio.indicadores).toEqual(visao?.indicadores);
    expect(relatorio.prontidao).toEqual(visao?.prontidao);
    expect(relatorio.problemas).toEqual(visao?.problemas);
    expect(relatorio.resumo).toEqual(visao?.resumo);
  });

  it("volume da semana: 14 rodadas × 75 testes", () => {
    expect(relatorio.rodadasSemana).toBe(14);
    expect(relatorio.execucoesSemana).toBe(14 * 75);
    expect(relatorio.tendencia.at(-1)?.execucoes).toBe(relatorio.execucoesSemana);
  });

  it("o texto para copiar contém resumo, indicadores, sistemas e problemas", () => {
    const t = relatorio.texto;
    expect(t.startsWith("Relatório semanal de qualidade · Semana 45 (02 a 08 de novembro de 2026)")).toBe(true);
    expect(t).toContain("dados fictícios");
    expect(t).toContain(resumoComoTexto(relatorio.resumo));
    expect(t).toContain("• Sistemas prontos: 3 de 5 (1 em atenção, 1 em risco)");
    expect(t).toContain("• Abertura de Conta: 83,8% · Risco");
    expect(t).toContain(
      "1. Falha na validação de documentos do cliente (Abertura de Conta · severidade crítica · aberta há 5 dias · aguardando decisão)",
    );
    expect(t).toContain("Base: 1.050 execuções em 14 rodadas automáticas; última em 09/11/2026, 06:00.");
  });

  it("o texto não tem marcações de formatação (cola limpo em qualquer lugar)", () => {
    expect(relatorio.texto).not.toMatch(/[*_#<>]/);
  });

  it("sem rodadas retorna nulo", () => {
    expect(montarRelatorio(criarBase([]))).toBeNull();
  });
});
