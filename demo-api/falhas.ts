/**
 * Falhas configuráveis da API fictícia (demo-api/cenarios.json).
 * O sorteio é determinístico: mesma seed + mesmo caso de teste = mesmo resultado,
 * independentemente da ordem em que os testes rodam em paralelo.
 */

export type Falha =
  | { tipo: "status"; status: number }
  | { tipo: "lentidao"; atrasoMs: number }
  | { tipo: "campo-ausente"; campo: string }
  | { tipo: "valor-incorreto"; campo: string; copiarDe: string }
  | { tipo: "mensagem-generica"; texto: string };

export type Cenario = Falha & { nome: string; rota: string; probabilidade: number; ativa: boolean };

export interface Resposta {
  status: number;
  corpo?: unknown;
  tipoConteudo?: string;
}

const erro = (msg: string) => new Error(`demo-api/cenarios.json: ${msg}`);

function texto(o: Record<string, unknown>, chave: string): string {
  const v = o[chave];
  if (typeof v !== "string" || !v) throw erro(`"${chave}" deveria ser texto`);
  return v;
}

function numero(o: Record<string, unknown>, chave: string): number {
  const v = o[chave];
  if (typeof v !== "number" || !Number.isFinite(v)) throw erro(`"${chave}" deveria ser número`);
  return v;
}

export function validarCenarios(bruto: unknown): Cenario[] {
  const raiz = bruto as { falhas?: unknown };
  if (!raiz || !Array.isArray(raiz.falhas)) throw erro(`"falhas" deveria ser uma lista`);
  return raiz.falhas.map((item: unknown): Cenario => {
    const o = item as Record<string, unknown>;
    const base = {
      nome: texto(o, "nome"),
      rota: texto(o, "rota"),
      probabilidade: numero(o, "probabilidade"),
      ativa: o.ativa !== false,
    };
    if (base.probabilidade < 0 || base.probabilidade > 1) throw erro(`probabilidade fora de 0..1 em "${base.nome}"`);
    switch (o.tipo) {
      case "status":
        return { ...base, tipo: "status", status: numero(o, "status") };
      case "lentidao":
        return { ...base, tipo: "lentidao", atrasoMs: numero(o, "atrasoMs") };
      case "campo-ausente":
        return { ...base, tipo: "campo-ausente", campo: texto(o, "campo") };
      case "valor-incorreto":
        return { ...base, tipo: "valor-incorreto", campo: texto(o, "campo"), copiarDe: texto(o, "copiarDe") };
      case "mensagem-generica":
        return { ...base, tipo: "mensagem-generica", texto: texto(o, "texto") };
      default:
        throw erro(`tipo desconhecido em "${base.nome}": ${String(o.tipo)}`);
    }
  });
}

/** Hash FNV-1a de 32 bits convertido para [0, 1). */
export function sortear(seed: string, chave: string): number {
  let h = 0x811c9dc5;
  for (const c of `${seed}|${chave}`) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h / 4294967296;
}

/** Falhas ativas sorteadas para esta requisição, na ordem do arquivo. */
export function falhasDaRequisicao(cenarios: readonly Cenario[], rota: string, seed: string, chave: string): Cenario[] {
  return cenarios.filter(
    (c, i) => c.ativa && c.rota === rota && sortear(seed, `${chave}|${i}`) < c.probabilidade,
  );
}

const ehObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Aplica as falhas sorteadas à resposta normal (exceto lentidão, tratada pelo servidor). */
export function aplicarFalhas(resposta: Resposta, falhas: readonly Falha[]): Resposta {
  let r: Resposta = { ...resposta, corpo: ehObjeto(resposta.corpo) ? { ...resposta.corpo } : resposta.corpo };
  for (const f of falhas) {
    const corpo = r.corpo;
    if (f.tipo === "status") {
      r = { status: f.status, corpo: { erro: "Falha simulada no ambiente de demonstração", status: f.status } };
    } else if (f.tipo === "campo-ausente" && r.status < 300 && ehObjeto(corpo)) {
      delete corpo[f.campo];
    } else if (f.tipo === "valor-incorreto" && r.status < 300 && ehObjeto(corpo) && f.copiarDe in corpo) {
      corpo[f.campo] = corpo[f.copiarDe];
    } else if (f.tipo === "mensagem-generica" && r.status >= 400 && ehObjeto(corpo) && "mensagem" in corpo) {
      corpo.mensagem = f.texto;
    }
  }
  return r;
}
