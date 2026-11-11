import type {
  Acompanhamento,
  ArquivoExecucoes,
  BaseQualidade,
  CasoDeTeste,
  Catalogo,
  Criticidade,
  Execucao,
  ExecucaoArmazenada,
  Funcionalidade,
  RegraTraducao,
  Rodada,
  RodadaArmazenada,
  Sistema,
} from "@/dominio/tipos";

/** Erro de dados com indicação do arquivo e do campo problemático. */
export class ErroDadosInvalidos extends Error {
  constructor(origem: string, detalhe: string) {
    super(`Dados inválidos em ${origem}: ${detalhe}`);
    this.name = "ErroDadosInvalidos";
  }
}

type Objeto = Record<string, unknown>;

export const CRITICIDADES: readonly Criticidade[] = ["critica", "alta", "media", "baixa"];
const ARTIGOS = ["o", "a", "os", "as"] as const;
const SITUACOES = ["em-analise", "em-correcao", "aguardando-decisao"] as const;
const ORIGENS = ["historico-ficticio", "suite-automatizada"] as const;

export function objeto(valor: unknown, origem: string, campo: string): Objeto {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) {
    throw new ErroDadosInvalidos(origem, `"${campo}" deveria ser um objeto`);
  }
  return valor as Objeto;
}

export function lista(valor: unknown, origem: string, campo: string): unknown[] {
  if (!Array.isArray(valor)) throw new ErroDadosInvalidos(origem, `"${campo}" deveria ser uma lista`);
  return valor;
}

export function texto(o: Objeto, chave: string, origem: string): string {
  const v = o[chave];
  if (typeof v !== "string" || v.trim() === "") {
    throw new ErroDadosInvalidos(origem, `"${chave}" deveria ser um texto não vazio`);
  }
  return v;
}

export function textoOpcional(o: Objeto, chave: string, origem: string): string | undefined {
  return o[chave] === undefined ? undefined : texto(o, chave, origem);
}

export function umDe<T extends string>(o: Objeto, chave: string, opcoes: readonly T[], origem: string): T {
  const v = o[chave];
  if (typeof v !== "string" || !(opcoes as readonly string[]).includes(v)) {
    throw new ErroDadosInvalidos(origem, `"${chave}" deveria ser um de: ${opcoes.join(", ")}`);
  }
  return v as T;
}

// ---------------------------------------------------------------------------

export function validarCatalogo(bruto: unknown): Catalogo {
  const origem = "catalogo.json";
  const raiz = objeto(bruto, origem, "raiz");

  const sistemas: Sistema[] = lista(raiz.sistemas, origem, "sistemas").map((item, i) => {
    const o = objeto(item, origem, `sistemas[${i}]`);
    return {
      id: texto(o, "id", origem),
      nome: texto(o, "nome", origem),
      artigo: umDe(o, "artigo", ARTIGOS, origem),
      area: texto(o, "area", origem),
      prefixoDefeito: texto(o, "prefixoDefeito", origem),
    };
  });
  const idsSistemas = new Set(sistemas.map((s) => s.id));

  const funcionalidades: Funcionalidade[] = lista(raiz.funcionalidades, origem, "funcionalidades").map(
    (item, i) => {
      const o = objeto(item, origem, `funcionalidades[${i}]`);
      const f: Funcionalidade = {
        id: texto(o, "id", origem),
        sistemaId: texto(o, "sistemaId", origem),
        nome: texto(o, "nome", origem),
        criticidade: umDe(o, "criticidade", CRITICIDADES, origem),
        impactoNegocio: texto(o, "impactoNegocio", origem),
      };
      if (!idsSistemas.has(f.sistemaId)) {
        throw new ErroDadosInvalidos(origem, `funcionalidade "${f.id}" aponta para sistema inexistente "${f.sistemaId}"`);
      }
      return f;
    },
  );
  const idsFuncionalidades = new Set(funcionalidades.map((f) => f.id));

  const casos: CasoDeTeste[] = lista(raiz.casos, origem, "casos").map((item, i) => {
    const o = objeto(item, origem, `casos[${i}]`);
    const c: CasoDeTeste = {
      id: texto(o, "id", origem),
      funcionalidadeId: texto(o, "funcionalidadeId", origem),
      requisicao: texto(o, "requisicao", origem),
      descricaoTecnica: texto(o, "descricaoTecnica", origem),
    };
    if (!idsFuncionalidades.has(c.funcionalidadeId)) {
      throw new ErroDadosInvalidos(origem, `caso "${c.id}" aponta para funcionalidade inexistente "${c.funcionalidadeId}"`);
    }
    return c;
  });

  for (const [nome, ids] of [
    ["sistemas", sistemas.map((s) => s.id)],
    ["funcionalidades", funcionalidades.map((f) => f.id)],
    ["casos", casos.map((c) => c.id)],
  ] as const) {
    if (new Set(ids).size !== ids.length) throw new ErroDadosInvalidos(origem, `há ids repetidos em "${nome}"`);
  }

  return { sistemas, funcionalidades, casos };
}

export function validarArquivoExecucoes(bruto: unknown, origem: string): ArquivoExecucoes {
  const raiz = objeto(bruto, origem, "raiz");
  if (raiz.versao !== 1) throw new ErroDadosInvalidos(origem, `"versao" deveria ser 1`);

  const rodadas: RodadaArmazenada[] = lista(raiz.rodadas, origem, "rodadas").map((item, i) => {
    const o = objeto(item, origem, `rodadas[${i}]`);
    const dataHora = texto(o, "dataHora", origem);
    if (Number.isNaN(Date.parse(dataHora))) {
      throw new ErroDadosInvalidos(origem, `"dataHora" inválida na rodada ${i}: ${dataHora}`);
    }
    const execucoes: ExecucaoArmazenada[] = lista(o.execucoes, origem, `rodadas[${i}].execucoes`).map(
      (bruta, j) => {
        const e = objeto(bruta, origem, `rodadas[${i}].execucoes[${j}]`);
        const duracaoMs = e.duracaoMs;
        if (typeof duracaoMs !== "number" || !Number.isFinite(duracaoMs) || duracaoMs < 0) {
          throw new ErroDadosInvalidos(origem, `"duracaoMs" inválida em rodadas[${i}].execucoes[${j}]`);
        }
        const exec: ExecucaoArmazenada = {
          casoId: texto(e, "casoId", origem),
          resultado: umDe(e, "resultado", ["sucesso", "falha"] as const, origem),
          duracaoMs,
        };
        const erro = textoOpcional(e, "erroTecnico", origem);
        if (erro !== undefined) exec.erroTecnico = erro;
        return exec;
      },
    );
    return {
      id: texto(o, "id", origem),
      dataHora,
      origem: umDe(o, "origem", ORIGENS, origem),
      execucoes,
    };
  });

  return { versao: 1, rodadas };
}

export function validarAcompanhamento(bruto: unknown): Acompanhamento[] {
  const origem = "acompanhamento.json";
  const raiz = objeto(bruto, origem, "raiz");
  return lista(raiz.itens, origem, "itens").map((item, i) => {
    const o = objeto(item, origem, `itens[${i}]`);
    const a: Acompanhamento = {
      codigoDefeito: texto(o, "codigoDefeito", origem),
      situacao: umDe(o, "situacao", SITUACOES, origem),
    };
    const responsavel = textoOpcional(o, "responsavel", origem);
    const observacao = textoOpcional(o, "observacao", origem);
    if (responsavel) a.responsavel = responsavel;
    if (observacao) a.observacao = observacao;
    if (o.severidade !== undefined) a.severidade = umDe(o, "severidade", CRITICIDADES, origem);
    return a;
  });
}

export function validarTraducoes(bruto: unknown): RegraTraducao[] {
  const origem = "traducoes.json";
  const raiz = objeto(bruto, origem, "raiz");
  return lista(raiz.regras, origem, "regras").map((item, i) => {
    const o = objeto(item, origem, `regras[${i}]`);
    const padrao = texto(o, "padrao", origem);
    try {
      return { padrao: new RegExp(padrao), descricao: texto(o, "descricao", origem) };
    } catch {
      throw new ErroDadosInvalidos(origem, `expressão regular inválida em regras[${i}]: ${padrao}`);
    }
  });
}

/**
 * Junta catálogo e arquivos de execução no modelo de domínio:
 * achata as rodadas, completa sistema/funcionalidade de cada execução e ordena por instante.
 */
export function montarBase(
  catalogo: Catalogo,
  arquivos: readonly { origem: string; conteudo: ArquivoExecucoes }[],
  acompanhamento: Acompanhamento[],
  traducoes: RegraTraducao[],
): BaseQualidade {
  const casos = new Map(catalogo.casos.map((c) => [c.id, c]));
  const funcionalidades = new Map(catalogo.funcionalidades.map((f) => [f.id, f]));
  const rodadas: Rodada[] = [];
  const execucoes: Execucao[] = [];
  const idsRodadas = new Set<string>();

  for (const { origem, conteudo } of arquivos) {
    for (const r of conteudo.rodadas) {
      if (idsRodadas.has(r.id)) throw new ErroDadosInvalidos(origem, `rodada repetida "${r.id}"`);
      idsRodadas.add(r.id);
      const instante = Date.parse(r.dataHora);
      rodadas.push({ id: r.id, instante, origem: r.origem, totalTestes: r.execucoes.length });

      for (const e of r.execucoes) {
        const caso = casos.get(e.casoId);
        if (!caso) throw new ErroDadosInvalidos(origem, `caso de teste desconhecido "${e.casoId}" na rodada "${r.id}"`);
        const funcionalidade = funcionalidades.get(caso.funcionalidadeId);
        if (!funcionalidade) throw new ErroDadosInvalidos(origem, `funcionalidade ausente para "${e.casoId}"`);
        execucoes.push({
          id: `${r.id}:${e.casoId}`,
          rodadaId: r.id,
          casoId: e.casoId,
          funcionalidadeId: funcionalidade.id,
          sistemaId: funcionalidade.sistemaId,
          instante,
          resultado: e.resultado,
          duracaoMs: e.duracaoMs,
          ...(e.erroTecnico ? { erroTecnico: e.erroTecnico } : {}),
        });
      }
    }
  }

  rodadas.sort((a, b) => a.instante - b.instante);
  execucoes.sort((a, b) => a.instante - b.instante || a.casoId.localeCompare(b.casoId));
  return { catalogo, rodadas, execucoes, acompanhamento, traducoes };
}
