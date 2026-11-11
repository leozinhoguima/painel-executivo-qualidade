/**
 * Gera data/chamados/chamados.json: a exportação da central de chamados fictícia.
 *
 * Uso: npm run dados:chamados                 → até a última rodada de testes
 *      npm run dados:chamados -- 2026-11-09T06:00:00-03:00   → até a data informada
 *
 * O fluxo `npm run qualidade` (e o robô) chama a mesma função depois de importar
 * cada rodada, para a sustentação andar junto com os testes.
 */
import { atualizarChamados } from "./chamados/atualizar";

const resultado = atualizarChamados(process.argv[2]);
console.log(
  `Chamados gerados até ${resultado.geradoAte}: ${resultado.total} chamados → ${resultado.destino}`,
);
