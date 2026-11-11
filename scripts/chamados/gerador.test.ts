import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validarCatalogo } from "@/dados/validacao";
import { validarArquivoChamados } from "@/dados/validacaoChamados";
import { criarAleatorio } from "@/lib/aleatorio";
import { CENARIO_CHAMADOS } from "./cenarios";
import { gerarChamados, serializarChamados, sortearPoisson } from "./gerador";

const raiz = process.cwd();
const catalogo = validarCatalogo(JSON.parse(readFileSync(path.join(raiz, "data", "catalogo.json"), "utf8")));
const REFERENCIA = "2026-11-09T06:00:00-03:00";

describe("gerador da central de chamados fictícia", () => {
  const arquivo = gerarChamados(catalogo, CENARIO_CHAMADOS, REFERENCIA);

  it("é determinístico: mesma seed, mesmo resultado", () => {
    expect(serializarChamados(gerarChamados(catalogo, CENARIO_CHAMADOS, REFERENCIA))).toBe(serializarChamados(arquivo));
  });

  it("seed diferente produz resultado diferente", () => {
    const outro = gerarChamados(catalogo, { ...CENARIO_CHAMADOS, seed: 1 }, REFERENCIA);
    expect(serializarChamados(outro)).not.toBe(serializarChamados(arquivo));
  });

  it("gerar um dia depois mantém o passado e só acrescenta o que aconteceu depois", () => {
    const depois = gerarChamados(catalogo, CENARIO_CHAMADOS, "2026-11-10T18:00:00-03:00");
    const limite = Date.parse(REFERENCIA);
    const cortado = depois.chamados
      .map((c) => ({ ...c, eventos: c.eventos.filter((e) => Date.parse(e.dataHora) <= limite) }))
      .filter((c) => c.eventos.length > 0);
    expect(cortado).toEqual(arquivo.chamados);
    expect(depois.chamados.length).toBeGreaterThan(arquivo.chamados.length);
  });

  it("passa na validação e não tem eventos depois da exportação", () => {
    expect(() => validarArquivoChamados(JSON.parse(serializarChamados(arquivo)), catalogo)).not.toThrow();
    expect(arquivo.geradoAte).toBe(REFERENCIA);
  });

  it("os chamados de surto apontam para funcionalidades do sistema certo", () => {
    const sistemaDe = new Map(catalogo.funcionalidades.map((f) => [f.id, f.sistemaId]));
    for (const c of arquivo.chamados.filter((c) => c.funcionalidadeId)) {
      expect(sistemaDe.get(c.funcionalidadeId as string)).toBe(c.sistemaId);
    }
  });

  it("o arquivo versionado está atualizado com o gerador (até a data gravada nele)", () => {
    const versionado = readFileSync(path.join(raiz, "data", "chamados", "chamados.json"), "utf8").replace(/\r\n/g, "\n");
    const { geradoAte } = JSON.parse(versionado) as { geradoAte: string };
    expect(versionado).toBe(serializarChamados(gerarChamados(catalogo, CENARIO_CHAMADOS, geradoAte)));
  });

  it("o sorteio de Poisson tem a média pedida", () => {
    const aleatorio = criarAleatorio(42);
    const amostras = Array.from({ length: 5000 }, () => sortearPoisson(aleatorio, 6));
    const media = amostras.reduce((a, b) => a + b, 0) / amostras.length;
    expect(media).toBeGreaterThan(5.8);
    expect(media).toBeLessThan(6.2);
    expect(sortearPoisson(aleatorio, 0)).toBe(0);
  });
});
