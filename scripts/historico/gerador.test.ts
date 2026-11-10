import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validarArquivoExecucoes, validarCatalogo } from "@/dados/validacao";
import { INCIDENTES, INTERVALO_RODADAS_HORAS, PRIMEIRA_RODADA, PROBABILIDADE_RUIDO, SEED, ULTIMA_RODADA } from "./cenarios";
import { gerarHistorico, serializarArquivo } from "./gerador";

const catalogo = validarCatalogo(
  JSON.parse(readFileSync(path.join(process.cwd(), "data", "catalogo.json"), "utf8")),
);
const parametros = {
  seed: SEED,
  primeiraRodada: PRIMEIRA_RODADA,
  ultimaRodada: ULTIMA_RODADA,
  intervaloHoras: INTERVALO_RODADAS_HORAS,
  probabilidadeRuido: PROBABILIDADE_RUIDO,
  incidentes: INCIDENTES,
};

describe("gerador do histórico fictício", () => {
  it("é determinístico: mesma seed, mesmo resultado", () => {
    expect(serializarArquivo(gerarHistorico(catalogo, parametros))).toBe(
      serializarArquivo(gerarHistorico(catalogo, parametros)),
    );
  });

  it("seed diferente produz resultado diferente", () => {
    expect(serializarArquivo(gerarHistorico(catalogo, { ...parametros, seed: 1 }))).not.toBe(
      serializarArquivo(gerarHistorico(catalogo, parametros)),
    );
  });

  it("o arquivo versionado está atualizado com o gerador", () => {
    const versionado = readFileSync(path.join(process.cwd(), "data", "execucoes", "historico-ficticio.json"), "utf8");
    expect(versionado.replace(/\r\n/g, "\n")).toBe(serializarArquivo(gerarHistorico(catalogo, parametros)));
  });

  it("produz o mesmo formato dos relatórios importados", () => {
    const serializado = serializarArquivo(gerarHistorico(catalogo, parametros));
    const arquivo = validarArquivoExecucoes(JSON.parse(serializado), "teste");
    expect(arquivo.rodadas).toHaveLength(183);
    expect(arquivo.rodadas[0].execucoes).toHaveLength(catalogo.casos.length);
    expect(arquivo.rodadas.at(-1)?.dataHora).toBe(ULTIMA_RODADA);
  });

  it("toda falha tem mensagem técnica e todo sucesso não tem", () => {
    const arquivo = gerarHistorico(catalogo, parametros);
    for (const execucao of arquivo.rodadas.flatMap((r) => r.execucoes)) {
      expect(Boolean(execucao.erroTecnico)).toBe(execucao.resultado === "falha");
    }
  });
});
