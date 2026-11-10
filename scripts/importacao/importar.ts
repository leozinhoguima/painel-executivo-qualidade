import { appendFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { validarArquivoExecucoes, validarCatalogo } from "@/dados/validacao";
import { converterRelatorioPlaywright, type ResultadoImportacao } from "@/importacao/playwright";
import { serializarArquivo } from "../historico/gerador";

export const RELATORIO_PADRAO = path.join("test-results", "relatorio-playwright.json");

/**
 * Lê o relatório do Playwright, converte e grava em data/execucoes/.
 * Recusa importar a mesma rodada duas vezes.
 */
export function importarRelatorio(caminhoRelatorio = RELATORIO_PADRAO, raiz = process.cwd()): ResultadoImportacao & { destino: string } {
  const origem = path.resolve(raiz, caminhoRelatorio);
  if (!existsSync(origem)) {
    throw new Error(`Relatório não encontrado em ${path.relative(raiz, origem)}. Rode antes: npm run test:api`);
  }

  const catalogo = validarCatalogo(JSON.parse(readFileSync(path.join(raiz, "data", "catalogo.json"), "utf8")));
  const resultado = converterRelatorioPlaywright(JSON.parse(readFileSync(origem, "utf8")), catalogo);
  validarArquivoExecucoes(resultado.arquivo, resultado.nomeArquivo);

  const pasta = path.join(raiz, "data", "execucoes");
  const idNovo = resultado.arquivo.rodadas[0].id;
  for (const nome of readdirSync(pasta).filter((n) => n.endsWith(".json"))) {
    const existente = readFileSync(path.join(pasta, nome), "utf8");
    if (existente.includes(`"id": "${idNovo}"`)) {
      throw new Error(`A rodada ${idNovo} já foi importada (${nome}).`);
    }
  }

  const destino = path.join(pasta, resultado.nomeArquivo);
  writeFileSync(destino, serializarArquivo(resultado.arquivo), "utf8");
  return { ...resultado, destino };
}

export function imprimirResumo(r: ResultadoImportacao & { destino: string }, raiz = process.cwd()) {
  const rodada = r.arquivo.rodadas[0];
  console.log(`\nRodada ${rodada.id} importada → ${path.relative(raiz, r.destino)}`);
  console.log(`  ${r.resumo.total} testes · ${r.resumo.sucessos} sucessos · ${r.resumo.falhas} falhas`);
  for (const aviso of r.avisos) console.log(`  aviso: ${aviso}`);

  // No GitHub Actions, o resumo também aparece na página da execução.
  const resumoActions = process.env.GITHUB_STEP_SUMMARY;
  if (resumoActions) {
    const falhas = rodada.execucoes.filter((e) => e.resultado === "falha");
    const linhas = [
      `## Rodada ${rodada.id}`,
      "",
      `**${r.resumo.total} testes** · ${r.resumo.sucessos} sucessos · ${r.resumo.falhas} falhas · dados fictícios (API de demonstração)`,
      "",
      ...(falhas.length
        ? ["| Caso | Mensagem técnica |", "|---|---|", ...falhas.map((f) => `| \`${f.casoId}\` | ${f.erroTecnico ?? ""} |`)]
        : ["Nenhuma falha nesta rodada."]),
      ...(r.avisos.length ? ["", "**Avisos**", ...r.avisos.map((a) => `- ${a}`)] : []),
      "",
    ];
    appendFileSync(resumoActions, linhas.join("\n"));
  }
}
