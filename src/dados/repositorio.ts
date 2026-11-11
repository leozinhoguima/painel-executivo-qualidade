import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { BaseChamados, BaseQualidade } from "@/dominio/tipos";
import {
  montarBase,
  validarAcompanhamento,
  validarArquivoExecucoes,
  validarCatalogo,
  validarTraducoes,
} from "./validacao";
import { montarBaseChamados, validarArquivoChamados } from "./validacaoChamados";

/**
 * Acesso aos dados do painel. Lê os arquivos JSON versionados em `data/`
 * (histórico fictício + rodadas importadas da suíte de testes).
 * Somente no servidor: as páginas recebem números já calculados.
 */
export const PASTA_DADOS = path.join(process.cwd(), "data");
export const ARQUIVO_HISTORICO = "historico-ficticio.json";
export const ARQUIVO_CHAMADOS = "chamados/chamados.json";

function lerJson(...partes: string[]): unknown {
  return JSON.parse(readFileSync(path.join(PASTA_DADOS, ...partes), "utf8"));
}

export interface OpcoesCarga {
  /**
   * Restringe os arquivos de execução lidos. Os testes usam só o histórico
   * fictício (fixo), para não depender das rodadas reais importadas.
   */
  apenasArquivos?: string[];
}

let emCache: BaseQualidade | null = null;

export function carregarBase(opcoes: OpcoesCarga = {}): BaseQualidade {
  const padrao = opcoes.apenasArquivos === undefined;
  if (padrao && emCache && process.env.NODE_ENV === "production") return emCache;

  const catalogo = validarCatalogo(lerJson("catalogo.json"));
  const traducoes = validarTraducoes(lerJson("traducoes.json"));
  const acompanhamento = validarAcompanhamento(lerJson("acompanhamento.json"));

  const arquivos = readdirSync(path.join(PASTA_DADOS, "execucoes"))
    .filter((nome) => nome.endsWith(".json"))
    .filter((nome) => opcoes.apenasArquivos?.includes(nome) ?? true)
    .sort()
    .map((nome) => ({
      origem: `execucoes/${nome}`,
      conteudo: validarArquivoExecucoes(lerJson("execucoes", nome), `execucoes/${nome}`),
    }));

  const base = montarBase(catalogo, arquivos, acompanhamento, traducoes);
  if (padrao) emCache = base;
  return base;
}

/** Base só com o histórico fictício de demonstração (usada nos testes de coerência). */
export function carregarBaseDemonstracao(): BaseQualidade {
  return carregarBase({ apenasArquivos: [ARQUIVO_HISTORICO] });
}

let chamadosEmCache: BaseChamados | null = null;

/**
 * Para telas em que os chamados complementam os testes: se o arquivo não puder
 * ser lido, a tela segue só com os testes em vez de mostrar erro.
 */
export function carregarChamadosOuNada(): BaseChamados | undefined {
  try {
    return carregarChamados();
  } catch {
    return undefined;
  }
}

/** Chamados da central de atendimento (fictícia), exportados para `data/chamados/`. */
export function carregarChamados(): BaseChamados {
  if (chamadosEmCache && process.env.NODE_ENV === "production") return chamadosEmCache;
  const catalogo = validarCatalogo(lerJson("catalogo.json"));
  const arquivo = validarArquivoChamados(lerJson(...ARQUIVO_CHAMADOS.split("/")), catalogo, `data/${ARQUIVO_CHAMADOS}`);
  chamadosEmCache = montarBaseChamados(catalogo, arquivo);
  return chamadosEmCache;
}
