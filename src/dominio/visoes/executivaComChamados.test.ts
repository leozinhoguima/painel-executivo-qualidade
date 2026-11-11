import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CENARIO_CHAMADOS } from "../../../scripts/chamados/cenarios";
import { gerarChamados } from "../../../scripts/chamados/gerador";
import { carregarBaseDemonstracao } from "@/dados/repositorio";
import { validarCatalogo } from "@/dados/validacao";
import { montarBaseChamados } from "@/dados/validacaoChamados";
import { resumoComoTexto } from "../regras/resumo";
import { montarVisaoDiretor } from "./diretor";
import { montarRelatorio } from "./relatorio";
import { montarVisaoSustentacao } from "./sustentacao";

// Testes e chamados fixos em 09/11/2026 06:00, independentes do que o robô grava.
const qualidade = carregarBaseDemonstracao();
const catalogo = validarCatalogo(JSON.parse(readFileSync(path.join(process.cwd(), "data", "catalogo.json"), "utf8")));
const chamados = montarBaseChamados(catalogo, gerarChamados(catalogo, CENARIO_CHAMADOS, "2026-11-09T06:00:00-03:00"));

describe("visão executiva com chamados", () => {
  const visao = montarVisaoDiretor(qualidade, chamados);
  if (!visao?.sustentacao) throw new Error("visão sem sustentação");
  const s = visao.sustentacao;

  it("usa a mesma semana e os mesmos números da tela de sustentação", () => {
    const sustentacao = montarVisaoSustentacao(chamados, "semana");
    expect(s.abertos).toBe(sustentacao?.indicadores.abertos.valor);
    expect(s.fechados).toBe(sustentacao?.indicadores.fechados.valor);
    expect(s.emAberto).toBe(sustentacao?.indicadores.emAberto.valor);
    expect(s.noPrazo.taxa).toBe(sustentacao?.indicadores.noPrazo.taxa);
    expect(s.motivos.map((m) => m.motivo)).toEqual(sustentacao?.problemas.slice(0, 3).map((p) => p.motivo));
  });

  it("os chamados por sistema somam os chamados da semana", () => {
    const soma = visao.prontidao.reduce((a, l) => a + (l.chamadosSemana ?? 0), 0);
    expect(soma).toBe(s.abertos);
  });

  it("o principal problema mostra os chamados de clientes ligados a ele", () => {
    expect(visao.problemas[0]).toMatchObject({ titulo: "Falha na validação de documentos do cliente" });
    expect(visao.problemas[0].chamados).toBeGreaterThan(40);
  });

  it("o resumo da semana ganha uma frase sobre os chamados", () => {
    expect(resumoComoTexto(visao.resumo)).toContain(
      `Os clientes abriram ${s.abertos} chamados (+${Math.round((s.variacao ?? 0) * 100)}% em relação à semana anterior); o principal motivo foi cadastro travado no envio de documentos, na Abertura de Conta.`,
    );
  });

  it("sem chamados, a visão executiva fica exatamente como antes", () => {
    const sem = montarVisaoDiretor(qualidade);
    expect(sem?.sustentacao).toBeNull();
    expect(sem?.prontidao.every((l) => l.chamadosSemana === null)).toBe(true);
    expect(resumoComoTexto(sem?.resumo ?? [])).not.toContain("chamado");
  });
});

describe("relatório semanal com chamados", () => {
  const relatorio = montarRelatorio(qualidade, chamados);
  if (!relatorio?.sustentacao) throw new Error("relatório sem sustentação");

  it("o texto copiado traz a seção de sustentação e os chamados por sistema", () => {
    const t = relatorio.texto;
    expect(t).toContain("Sustentação (chamados de clientes)");
    expect(t).toContain(`• Abertos: ${relatorio.sustentacao?.abertos} (+`);
    expect(t).toMatch(/• Abertura de Conta: 83,8% · Risco · \d+ chamados/);
    expect(t).toMatch(/1\. Cadastro travado no envio de documentos \(Abertura de Conta · \d+ chamados\)/);
    expect(t).toMatch(/aguardando decisão · \d+ chamados de clientes\)/);
    expect(t).not.toMatch(/[*_#<>]/);
  });
});
