import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { BaseQualidade } from "@/dominio/tipos";
import {
  montarBase,
  validarAcompanhamento,
  validarArquivoExecucoes,
  validarCatalogo,
  validarTraducoes,
} from "./validacao";

/**
 * Acesso aos dados do painel. Lê os arquivos JSON versionados em `data/`
 * (histórico fictício + rodadas importadas da suíte de testes).
 * Somente no servidor: as páginas recebem números já calculados.
 */
const PASTA_DADOS = path.join(process.cwd(), "data");

function lerJson(...partes: string[]): unknown {
  return JSON.parse(readFileSync(path.join(PASTA_DADOS, ...partes), "utf8"));
}

let emCache: BaseQualidade | null = null;

export function carregarBase(): BaseQualidade {
  if (emCache && process.env.NODE_ENV === "production") return emCache;

  const catalogo = validarCatalogo(lerJson("catalogo.json"));
  const traducoes = validarTraducoes(lerJson("traducoes.json"));
  const acompanhamento = validarAcompanhamento(lerJson("acompanhamento.json"));

  const arquivos = readdirSync(path.join(PASTA_DADOS, "execucoes"))
    .filter((nome) => nome.endsWith(".json"))
    .sort()
    .map((nome) => ({
      origem: `execucoes/${nome}`,
      conteudo: validarArquivoExecucoes(lerJson("execucoes", nome), `execucoes/${nome}`),
    }));

  emCache = montarBase(catalogo, arquivos, acompanhamento, traducoes);
  return emCache;
}
