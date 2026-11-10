import { test as base, type APIRequestContext, type APIResponse } from "@playwright/test";
import catalogo from "../../data/catalogo.json";

/**
 * Apoio da suíte de API.
 *
 * Cada teste corresponde a um caso do catálogo (data/catalogo.json): o título é a
 * descrição técnica e a anotação "caso" leva o id — é por ela que o importador
 * liga o resultado ao caso de teste.
 *
 * As mensagens de falha seguem um formato padronizado (ex.: "POST /pix retornou
 * 500 (esperado 201)") que a camada de tradução converte em linguagem de negócio.
 */

interface Caso {
  id: string;
  requisicao: string;
  descricaoTecnica: string;
}

const CASOS = new Map<string, Caso>(catalogo.casos.map((c) => [c.id, c]));

/** Tempo máximo padrão de resposta de qualquer requisição (SLA da demonstração). */
const LIMITE_PADRAO_MS = 3000;

export class FalhaDeTeste extends Error {}

/** Interrompe o teste com uma mensagem técnica padronizada. */
export function falhar(mensagem: string): never {
  throw new FalhaDeTeste(mensagem);
}

interface OpcoesChamada {
  dados?: unknown;
  esperado: number;
  /** Tempo máximo de resposta deste caso (padrão: 3000 ms). */
  limiteMs?: number;
}

export interface Api {
  caso: Caso;
  chamar: (metodo: string, caminho: string, opcoes: OpcoesChamada) => Promise<APIResponse>;
  /** Faz a chamada, confere status e tempo e devolve o corpo JSON. */
  json: <T = Record<string, unknown>>(metodo: string, caminho: string, opcoes: OpcoesChamada) => Promise<T>;
  /** Confirma uma condição de negócio; se falhar, usa a mensagem informada + a requisição. */
  conferir: (condicao: boolean, mensagem: string) => void;
}

function criarApi(request: APIRequestContext, caso: Caso): Api {
  const chamar: Api["chamar"] = async (metodo, caminho, { dados, esperado, limiteMs = LIMITE_PADRAO_MS }) => {
    const inicio = Date.now();
    let resposta: APIResponse;
    try {
      resposta = await request.fetch(caminho, {
        method: metodo,
        data: dados,
        headers: { "x-caso-teste": caso.id },
        timeout: limiteMs + 2000,
      });
    } catch {
      return falhar(`Tempo limite de ${limiteMs} ms excedido em ${caso.requisicao}`);
    }
    if (Date.now() - inicio > limiteMs) falhar(`Tempo limite de ${limiteMs} ms excedido em ${caso.requisicao}`);
    if (resposta.status() !== esperado) {
      falhar(`${caso.requisicao} retornou ${resposta.status()} (esperado ${esperado})`);
    }
    return resposta;
  };

  return {
    caso,
    chamar,
    json: async <T,>(metodo: string, caminho: string, opcoes: OpcoesChamada) =>
      (await (await chamar(metodo, caminho, opcoes)).json()) as T,
    conferir: (condicao, mensagem) => {
      if (!condicao) falhar(`${mensagem} em ${caso.requisicao}`);
    },
  };
}

/**
 * Título e anotação de um caso do catálogo, para usar com `test(...caso("id"), ...)`.
 * O teste é declarado no próprio arquivo do sistema, e o relatório aponta o local certo.
 */
export function caso(id: string): [string, { annotation: { type: "caso"; description: string } }] {
  const c = CASOS.get(id);
  if (!c) throw new Error(`Caso de teste inexistente no catálogo: ${id}`);
  return [c.descricaoTecnica, { annotation: { type: "caso", description: c.id } }];
}

/** `test` com a fixture `api`, já ligada ao caso indicado pela anotação. */
export const test = base.extend<{ api: Api }>({
  // "fornecer" é o parâmetro que o Playwright chama de "use" (renomeado para não confundir o lint de React).
  api: async ({ request }, fornecer, testInfo) => {
    const id = testInfo.annotations.find((a) => a.type === "caso")?.description;
    const c = id ? CASOS.get(id) : undefined;
    if (!c) throw new Error(`Teste sem anotação "caso" válida: ${testInfo.title}`);
    await fornecer(criarApi(request, c));
  },
});
