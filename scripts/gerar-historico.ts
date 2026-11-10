/**
 * Gera data/execucoes/historico-ficticio.json a partir do catálogo e do roteiro
 * de incidentes. Uso: npm run dados:historico
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { validarArquivoExecucoes, validarCatalogo } from "@/dados/validacao";
import {
  INCIDENTES,
  INTERVALO_RODADAS_HORAS,
  PRIMEIRA_RODADA,
  PROBABILIDADE_RUIDO,
  SEED,
  ULTIMA_RODADA,
} from "./historico/cenarios";
import { gerarHistorico, serializarArquivo } from "./historico/gerador";

const raiz = process.cwd();
const catalogo = validarCatalogo(JSON.parse(readFileSync(path.join(raiz, "data", "catalogo.json"), "utf8")));

const casosConhecidos = new Set(catalogo.casos.map((c) => c.id));
for (const incidente of INCIDENTES) {
  for (const caso of incidente.casos) {
    if (!casosConhecidos.has(caso)) throw new Error(`Incidente aponta para caso inexistente: ${caso}`);
  }
}

const arquivo = gerarHistorico(catalogo, {
  seed: SEED,
  primeiraRodada: PRIMEIRA_RODADA,
  ultimaRodada: ULTIMA_RODADA,
  intervaloHoras: INTERVALO_RODADAS_HORAS,
  probabilidadeRuido: PROBABILIDADE_RUIDO,
  incidentes: INCIDENTES,
});
validarArquivoExecucoes(arquivo, "historico-ficticio.json");

const destino = path.join(raiz, "data", "execucoes", "historico-ficticio.json");
writeFileSync(destino, serializarArquivo(arquivo), "utf8");

const total = arquivo.rodadas.reduce((acc, r) => acc + r.execucoes.length, 0);
console.log(`Histórico gerado: ${arquivo.rodadas.length} rodadas, ${total} execuções → ${path.relative(raiz, destino)}`);
