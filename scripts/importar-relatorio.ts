/**
 * Importa o relatório JSON do Playwright para data/execucoes/.
 * Uso: npm run dados:importar [-- caminho/do/relatorio.json]
 */
import { importarRelatorio, imprimirResumo } from "./importacao/importar";

try {
  imprimirResumo(importarRelatorio(process.argv[2]));
} catch (erro) {
  console.error(`\nImportação não realizada: ${erro instanceof Error ? erro.message : String(erro)}`);
  process.exit(1);
}
