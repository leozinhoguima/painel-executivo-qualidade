import { paraIsoLocal } from "@/lib/datas";
import type { ArquivoExecucoes, Catalogo, ExecucaoArmazenada } from "@/dominio/tipos";

/**
 * Converte o relatório JSON do Playwright (reporter "json") no formato de
 * execuções do painel — o mesmo do histórico fictício.
 *
 * Cada teste é ligado ao caso do catálogo pela anotação { type: "caso", description: <id> }.
 * Somente os campos usados aqui são lidos, e cada um é conferido: o formato vem
 * de uma ferramenta externa e não deve ser presumido.
 */

export class ErroImportacao extends Error {
  constructor(mensagem: string) {
    super(`Relatório do Playwright inválido: ${mensagem}`);
    this.name = "ErroImportacao";
  }
}

export interface ResultadoImportacao {
  arquivo: ArquivoExecucoes;
  /** Nome sugerido em data/execucoes/ (ex.: "2026-11-10-164324.json"). */
  nomeArquivo: string;
  resumo: { total: number; sucessos: number; falhas: number };
  /** Situações que não impedem a importação, mas merecem atenção. */
  avisos: string[];
}

type Objeto = Record<string, unknown>;
const ehObjeto = (v: unknown): v is Objeto => typeof v === "object" && v !== null && !Array.isArray(v);
const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const ANSI = /\u001b\[[0-9;]*m/g;

/** Primeira linha da mensagem, sem códigos de cor e sem o prefixo "Error: ". */
export function limparMensagem(mensagem: string): string {
  const primeira = mensagem.replace(ANSI, "").split("\n").find((l) => l.trim() !== "") ?? "";
  return primeira.replace(/^\s*(?:[A-Za-z]*Error|FalhaDeTeste):\s*/, "").trim();
}

interface TesteEncontrado {
  titulo: string;
  teste: Objeto;
}

function coletarTestes(suites: unknown[], saida: TesteEncontrado[] = []): TesteEncontrado[] {
  for (const suite of suites) {
    if (!ehObjeto(suite)) continue;
    for (const spec of lista(suite.specs)) {
      if (!ehObjeto(spec)) continue;
      for (const teste of lista(spec.tests)) {
        if (ehObjeto(teste)) saida.push({ titulo: String(spec.title ?? ""), teste });
      }
    }
    coletarTestes(lista(suite.suites), saida);
  }
  return saida;
}

function casoDoTeste(teste: Objeto): string | null {
  const anotacao = lista(teste.annotations).find((a) => ehObjeto(a) && a.type === "caso");
  return ehObjeto(anotacao) && typeof anotacao.description === "string" ? anotacao.description : null;
}

export function converterRelatorioPlaywright(bruto: unknown, catalogo: Catalogo): ResultadoImportacao {
  if (!ehObjeto(bruto) || !Array.isArray(bruto.suites) || !ehObjeto(bruto.stats)) {
    throw new ErroImportacao('esperado um objeto com "suites" e "stats" (reporter "json")');
  }
  const inicio = Date.parse(String(bruto.stats.startTime));
  if (Number.isNaN(inicio)) throw new ErroImportacao('"stats.startTime" ausente ou inválido');

  const casos = new Map(catalogo.casos.map((c) => [c.id, c]));
  const avisos: string[] = [];
  const vistos = new Set<string>();
  const execucoes: ExecucaoArmazenada[] = [];

  for (const { titulo, teste } of coletarTestes(bruto.suites)) {
    const casoId = casoDoTeste(teste);
    if (!casoId) {
      avisos.push(`Teste sem anotação "caso" ignorado: "${titulo}"`);
      continue;
    }
    const caso = casos.get(casoId);
    if (!caso) {
      avisos.push(`Caso "${casoId}" não existe no catálogo; teste ignorado`);
      continue;
    }
    if (vistos.has(casoId)) {
      avisos.push(`Caso "${casoId}" apareceu mais de uma vez; mantida a primeira ocorrência`);
      continue;
    }

    const resultados = lista(teste.results).filter(ehObjeto);
    const ultimo = resultados.at(-1);
    const status = ultimo ? String(ultimo.status) : "skipped";
    if (status === "skipped") {
      avisos.push(`Caso "${casoId}" não foi executado (ignorado na rodada)`);
      continue;
    }
    vistos.add(casoId);

    const duracaoMs = Math.max(0, Math.round(Number(ultimo?.duration ?? 0)));
    if (status === "passed") {
      execucoes.push({ casoId, resultado: "sucesso", duracaoMs });
      continue;
    }

    let erroTecnico: string;
    if (status === "timedOut") {
      erroTecnico = `Tempo limite de ${Number(teste.timeout ?? 0)} ms excedido em ${caso.requisicao}`;
    } else {
      const erro = ehObjeto(ultimo?.error) ? ultimo.error : undefined;
      erroTecnico = limparMensagem(String(erro?.message ?? "")) || `Falha sem mensagem em ${caso.requisicao}`;
    }
    execucoes.push({ casoId, resultado: "falha", duracaoMs, erroTecnico });
  }

  const ausentes = catalogo.casos.filter((c) => !vistos.has(c.id)).length;
  if (ausentes > 0) avisos.push(`${ausentes} caso(s) do catálogo sem resultado nesta rodada`);
  if (execucoes.length === 0) throw new ErroImportacao("nenhum teste ligado a um caso do catálogo");

  execucoes.sort((a, b) => a.casoId.localeCompare(b.casoId));
  const dataHora = paraIsoLocal(inicio);
  const carimbo = dataHora.slice(0, 19).replace(/[-:]/g, "").replace("T", "-");
  const falhas = execucoes.filter((e) => e.resultado === "falha").length;

  return {
    arquivo: {
      versao: 1,
      aviso: "Rodada da suíte automatizada (Playwright) contra a API FICTÍCIA de demonstração.",
      rodadas: [{ id: `suite-${carimbo}`, dataHora, origem: "suite-automatizada", execucoes }],
    },
    nomeArquivo: `${dataHora.slice(0, 10)}-${carimbo.slice(9)}.json`,
    resumo: { total: execucoes.length, sucessos: execucoes.length - falhas, falhas },
    avisos,
  };
}
