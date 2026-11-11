/**
 * Fluxo completo da automação, em um comando:
 *   1. sobe a API fictícia e roda a suíte Playwright (relatório JSON);
 *   2. importa o relatório para data/execucoes/;
 *   3. exporta os chamados da central fictícia até a nova rodada (data/chamados/);
 *   4. o painel passa a exibir a nova rodada (recarregue a página).
 *
 * Testes que falham são o objeto de medição, não um erro do processo:
 * o fluxo só para se o Playwright não conseguir gerar o relatório.
 *
 * Uso: npm run qualidade
 */
import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { atualizarChamados } from "./chamados/atualizar";
import { importarRelatorio, imprimirResumo, RELATORIO_PADRAO } from "./importacao/importar";

rmSync(RELATORIO_PADRAO, { force: true });

console.log("1/3 Executando a suíte de testes contra a API fictícia...\n");
// Comando fixo (sem argumentos externos): seguro para executar via shell, necessário no Windows.
const execucao = spawnSync("npx playwright test", { stdio: "inherit", shell: true });

// Código 1 = há testes falhando (esperado na demonstração). Outros códigos = problema na execução.
if (!existsSync(RELATORIO_PADRAO) || (execucao.status !== 0 && execucao.status !== 1)) {
  console.error(`\nA suíte não gerou o relatório (código ${execucao.status}). Nada foi importado.`);
  process.exit(1);
}

console.log("\n2/3 Importando o relatório para o painel...");
try {
  imprimirResumo(importarRelatorio());
} catch (erro) {
  console.error(`\nImportação não realizada: ${erro instanceof Error ? erro.message : String(erro)}`);
  process.exit(1);
}

console.log("\n3/3 Atualizando os chamados da central fictícia...");
try {
  const chamados = atualizarChamados();
  console.log(`${chamados.total} chamados até ${chamados.geradoAte}.`);
  console.log("\nPronto. Recarregue o painel para ver a nova rodada.");
} catch (erro) {
  console.error(`\nChamados não atualizados: ${erro instanceof Error ? erro.message : String(erro)}`);
  process.exit(1);
}
