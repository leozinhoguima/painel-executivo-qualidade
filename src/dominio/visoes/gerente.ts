import {
  compararPorPrioridade,
  defeitosAbertos,
  derivarDefeitos,
  diasEmAberto,
  tempoMedioCorrecao,
} from "../regras/defeitos";
import { META_CORRECAO_DIAS } from "../regras/parametros";
import { janelaAnterior, janelaMovel, type Janela, type PeriodoDias } from "../regras/periodo";
import { classificarProntidao, compararPiorPrimeiro } from "../regras/prontidao";
import { calcularTaxa, noIntervalo, variacaoEmPontos } from "../regras/taxa";
import type {
  BaseQualidade,
  Funcionalidade,
  Instante,
  Severidade,
  SituacaoDefeito,
  Sistema,
  StatusProntidao,
} from "../tipos";

export interface LinhaFuncionalidade {
  funcionalidade: Funcionalidade;
  taxa: number | null;
  execucoes: number;
  status: StatusProntidao;
}

export interface LinhaDefeito {
  codigo: string;
  titulo: string;
  funcionalidadeId: string;
  funcionalidadeNome: string;
  severidade: Severidade;
  situacao: SituacaoDefeito;
  diasAberto: number;
  responsavel?: string;
}

export interface VisaoGerente {
  sistema: Sistema;
  periodo: PeriodoDias;
  janela: Janela;
  referencia: Instante;
  status: StatusProntidao;
  indicadores: {
    taxa: number | null;
    variacaoPontos: number | null;
    execucoes: number;
    rodadas: number;
    defeitosAbertos: number;
    porSeveridade: Record<Severidade, number>;
    tempoMedioCorrecaoDias: number | null;
    correcoesNoPeriodo: number;
    metaCorrecaoDias: number;
  };
  /** Da pior para a melhor. */
  funcionalidades: LinhaFuncionalidade[];
  /** Defeitos em aberto na data de referência, do mais grave para o menos grave. */
  defeitos: LinhaDefeito[];
}

/**
 * Monta a visão de um sistema para o período escolhido (janela móvel até a
 * última execução). Os defeitos em aberto são sempre os da data de referência,
 * independentemente do período: um problema aberto continua aberto.
 * Retorna nulo se o sistema não existir ou se ainda não houver execuções.
 */
export function montarVisaoGerente(
  base: BaseQualidade,
  sistemaId: string,
  periodo: PeriodoDias,
): VisaoGerente | null {
  const sistema = base.catalogo.sistemas.find((s) => s.id === sistemaId);
  const ultimaRodada = base.rodadas.at(-1);
  if (!sistema || !ultimaRodada) return null;

  const referencia = ultimaRodada.instante;
  const janela = janelaMovel(referencia, periodo);
  const anterior = janelaAnterior(janela);

  const doSistema = base.execucoes.filter((e) => e.sistemaId === sistema.id);
  const noPeriodo = noIntervalo(doSistema, janela.inicio, janela.fim);
  const taxa = calcularTaxa(noPeriodo);
  const taxaAnterior = calcularTaxa(noIntervalo(doSistema, anterior.inicio, anterior.fim));

  const defeitos = derivarDefeitos(base, referencia).filter((d) => d.sistemaId === sistema.id);
  const abertos = defeitosAbertos(defeitos).sort(compararPorPrioridade);
  const correcao = tempoMedioCorrecao(defeitos, janela.inicio, janela.fim);

  const porSeveridade: Record<Severidade, number> = { critica: 0, alta: 0, media: 0, baixa: 0 };
  for (const d of abertos) porSeveridade[d.severidade]++;

  const funcionalidadesDoSistema = base.catalogo.funcionalidades.filter((f) => f.sistemaId === sistema.id);
  const nomes = new Map(funcionalidadesDoSistema.map((f) => [f.id, f.nome]));

  const funcionalidades: LinhaFuncionalidade[] = funcionalidadesDoSistema
    .map((funcionalidade) => {
      const t = calcularTaxa(noPeriodo.filter((e) => e.funcionalidadeId === funcionalidade.id));
      const severidades = abertos.filter((d) => d.funcionalidadeId === funcionalidade.id).map((d) => d.severidade);
      return {
        funcionalidade,
        taxa: t.valor,
        execucoes: t.total,
        status: classificarProntidao(t.valor, severidades),
      };
    })
    .sort(compararPiorPrimeiro);

  return {
    sistema,
    periodo,
    janela,
    referencia,
    status: classificarProntidao(taxa.valor, abertos.map((d) => d.severidade)),
    indicadores: {
      taxa: taxa.valor,
      variacaoPontos: variacaoEmPontos(taxa.valor, taxaAnterior.valor),
      execucoes: taxa.total,
      rodadas: new Set(noPeriodo.map((e) => e.rodadaId)).size,
      defeitosAbertos: abertos.length,
      porSeveridade,
      tempoMedioCorrecaoDias: correcao.mediaDias,
      correcoesNoPeriodo: correcao.quantidade,
      metaCorrecaoDias: META_CORRECAO_DIAS,
    },
    funcionalidades,
    defeitos: abertos.map((d) => ({
      codigo: d.codigo,
      titulo: d.descricaoNegocio,
      funcionalidadeId: d.funcionalidadeId,
      funcionalidadeNome: nomes.get(d.funcionalidadeId) ?? d.funcionalidadeId,
      severidade: d.severidade,
      situacao: d.situacao,
      diasAberto: diasEmAberto(d, referencia),
      responsavel: d.responsavel,
    })),
  };
}
