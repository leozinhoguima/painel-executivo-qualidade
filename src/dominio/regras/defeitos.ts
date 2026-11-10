import { DIA_MS, diasEntre } from "@/lib/datas";
import type {
  Acompanhamento,
  BaseQualidade,
  Defeito,
  Execucao,
  Funcionalidade,
  Instante,
} from "../tipos";
import {
  FALHAS_PARA_ABRIR,
  JANELA_DEFEITO_MS,
  NUMERO_INICIAL_DEFEITO,
  ORDEM_SEVERIDADE,
  SUCESSOS_PARA_RESOLVER,
} from "./parametros";
import { traduzirErro } from "./traducao";

interface Agrupamento {
  chave: string;
  funcionalidade: Funcionalidade;
  descricaoNegocio: string;
  erroTecnico: string;
  casos: Set<string>;
  primeiraFalha: Instante;
  ultimaFalha: Instante;
  /** Instante da falha que confirmou o defeito (a 2ª). Define a ordem dos códigos. */
  confirmadoEm: Instante | null;
  falhas: number;
  sucessosAposUltimaFalha: number;
  primeiroSucessoAposUltimaFalha: Instante | null;
}

function estaResolvido(g: Agrupamento, referencia: Instante): boolean {
  return (
    referencia - g.ultimaFalha >= JANELA_DEFEITO_MS &&
    g.sucessosAposUltimaFalha >= SUCESSOS_PARA_RESOLVER
  );
}

/**
 * Deriva os defeitos a partir das execuções, considerando apenas o que havia
 * acontecido até o instante de referência.
 *
 * Um defeito é um problema de negócio (funcionalidade + descrição traduzida),
 * não um teste isolado: se três testes da validação de documentos falham pelo
 * mesmo motivo, é um único defeito.
 */
export function derivarDefeitos(
  base: Pick<BaseQualidade, "catalogo" | "execucoes" | "traducoes" | "acompanhamento">,
  referencia: Instante,
): Defeito[] {
  const funcionalidades = new Map(base.catalogo.funcionalidades.map((f) => [f.id, f]));
  const ativos = new Map<string, Agrupamento>();
  const porFuncionalidade = new Map<string, Agrupamento[]>();
  const concluidos: Agrupamento[] = [];

  for (const exec of base.execucoes) {
    if (exec.instante > referencia) break;
    const funcionalidade = funcionalidades.get(exec.funcionalidadeId);
    if (!funcionalidade) continue;

    if (exec.resultado === "falha") {
      registrarFalha(exec, funcionalidade);
    } else {
      for (const g of porFuncionalidade.get(exec.funcionalidadeId) ?? []) {
        if (g.casos.has(exec.casoId) && exec.instante > g.ultimaFalha) {
          g.sucessosAposUltimaFalha++;
          g.primeiroSucessoAposUltimaFalha ??= exec.instante;
        }
      }
    }
  }

  function registrarFalha(exec: Execucao, funcionalidade: Funcionalidade) {
    const descricaoNegocio = traduzirErro(exec.erroTecnico, funcionalidade, base.traducoes);
    const chave = `${funcionalidade.id}|${descricaoNegocio}`;
    const atual = ativos.get(chave);

    const continuaMesmoProblema =
      atual &&
      (exec.instante - atual.ultimaFalha < JANELA_DEFEITO_MS ||
        atual.sucessosAposUltimaFalha < SUCESSOS_PARA_RESOLVER);

    if (atual && continuaMesmoProblema) {
      atual.falhas++;
      atual.casos.add(exec.casoId);
      atual.ultimaFalha = exec.instante;
      atual.sucessosAposUltimaFalha = 0;
      atual.primeiroSucessoAposUltimaFalha = null;
      if (atual.confirmadoEm === null && atual.falhas >= FALHAS_PARA_ABRIR) {
        atual.confirmadoEm = exec.instante;
      }
      return;
    }

    if (atual) {
      concluidos.push(atual);
      const lista = porFuncionalidade.get(funcionalidade.id) ?? [];
      porFuncionalidade.set(funcionalidade.id, lista.filter((g) => g !== atual));
    }

    const novo: Agrupamento = {
      chave,
      funcionalidade,
      descricaoNegocio,
      erroTecnico: exec.erroTecnico ?? "",
      casos: new Set([exec.casoId]),
      primeiraFalha: exec.instante,
      ultimaFalha: exec.instante,
      confirmadoEm: FALHAS_PARA_ABRIR <= 1 ? exec.instante : null,
      falhas: 1,
      sucessosAposUltimaFalha: 0,
      primeiroSucessoAposUltimaFalha: null,
    };
    ativos.set(chave, novo);
    porFuncionalidade.set(funcionalidade.id, [...(porFuncionalidade.get(funcionalidade.id) ?? []), novo]);
  }

  const confirmados = [...concluidos, ...ativos.values()].filter(
    (g): g is Agrupamento & { confirmadoEm: Instante } => g.confirmadoEm !== null,
  );

  return numerarEMontar(confirmados, base, referencia);
}

function numerarEMontar(
  agrupamentos: (Agrupamento & { confirmadoEm: Instante })[],
  base: Pick<BaseQualidade, "catalogo" | "acompanhamento">,
  referencia: Instante,
): Defeito[] {
  const sistemas = new Map(base.catalogo.sistemas.map((s) => [s.id, s]));
  const acompanhamentos = new Map<string, Acompanhamento>(
    base.acompanhamento.map((a) => [a.codigoDefeito, a]),
  );

  // A ordem de confirmação nunca muda quando o histórico cresce, então os códigos são estáveis.
  const ordenados = [...agrupamentos].sort(
    (a, b) => a.confirmadoEm - b.confirmadoEm || a.chave.localeCompare(b.chave),
  );
  const contadores = new Map<string, number>();

  return ordenados.map((g) => {
    const sistema = sistemas.get(g.funcionalidade.sistemaId);
    const prefixo = sistema?.prefixoDefeito ?? "DF";
    const numero = contadores.get(prefixo) ?? NUMERO_INICIAL_DEFEITO;
    contadores.set(prefixo, numero + 1);
    const codigo = `${prefixo}-${numero}`;

    const acompanhamento = acompanhamentos.get(codigo);
    const resolvido = estaResolvido(g, referencia);

    return {
      codigo,
      sistemaId: g.funcionalidade.sistemaId,
      funcionalidadeId: g.funcionalidade.id,
      casosAfetados: [...g.casos].sort(),
      severidade: acompanhamento?.severidade ?? g.funcionalidade.criticidade,
      situacao: resolvido ? "resolvido" : (acompanhamento?.situacao ?? "aberto"),
      abertoEm: g.primeiraFalha,
      resolvidoEm: resolvido ? g.primeiroSucessoAposUltimaFalha : null,
      descricaoNegocio: g.descricaoNegocio,
      erroTecnico: g.erroTecnico,
      ocorrencias: g.falhas,
      responsavel: acompanhamento?.responsavel,
      observacao: acompanhamento?.observacao,
    } satisfies Defeito;
  });
}

export function defeitosAbertos(defeitos: readonly Defeito[]): Defeito[] {
  return defeitos.filter((d) => d.resolvidoEm === null);
}

export function diasEmAberto(defeito: Pick<Defeito, "abertoEm">, referencia: Instante): number {
  return diasEntre(defeito.abertoEm, referencia);
}

export interface TempoCorrecao {
  /** Média em dias corridos; nula se nenhum defeito foi resolvido no período. */
  mediaDias: number | null;
  quantidade: number;
}

/** Tempo médio de correção dos defeitos resolvidos em [inicio, fim). */
export function tempoMedioCorrecao(
  defeitos: readonly Defeito[],
  inicio: Instante,
  fim: Instante,
): TempoCorrecao {
  const resolvidos = defeitos.filter(
    (d): d is Defeito & { resolvidoEm: Instante } =>
      d.resolvidoEm !== null && d.resolvidoEm >= inicio && d.resolvidoEm < fim,
  );
  if (resolvidos.length === 0) return { mediaDias: null, quantidade: 0 };
  const soma = resolvidos.reduce((acc, d) => acc + (d.resolvidoEm - d.abertoEm) / DIA_MS, 0);
  return { mediaDias: soma / resolvidos.length, quantidade: resolvidos.length };
}

/** Do mais grave para o menos grave; empates: aguardando decisão primeiro, depois o mais antigo. */
export function compararPorPrioridade(a: Defeito, b: Defeito): number {
  return (
    ORDEM_SEVERIDADE[a.severidade] - ORDEM_SEVERIDADE[b.severidade] ||
    Number(b.situacao === "aguardando-decisao") - Number(a.situacao === "aguardando-decisao") ||
    a.abertoEm - b.abertoEm ||
    a.codigo.localeCompare(b.codigo)
  );
}
