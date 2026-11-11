import {
  compararPorPrioridade,
  defeitosAbertos,
  derivarDefeitos,
  diasEmAberto,
  tempoMedioCorrecao,
} from "../regras/defeitos";
import { DIA_MS, inicioDaSemana, inicioDoDia, paraDataLocal, SEMANA_MS } from "@/lib/datas";
import { formatarData, formatarDiaMes, nomeDiaSemana } from "@/lib/formatacao";
import {
  abertosNaJanela,
  chamadosEmAberto,
  estaForaDoPrazo,
  resumirAtendimento,
  variacaoRelativa,
} from "../regras/chamados";
import { META_CORRECAO_DIAS, META_NO_PRAZO } from "../regras/parametros";
import { contarChamadosPorDefeito, vincularChamados } from "../regras/vinculo";
import { janelaAnterior, janelaMovel, type Janela, type PeriodoDias } from "../regras/periodo";
import { classificarProntidao, compararPiorPrimeiro } from "../regras/prontidao";
import { calcularTaxa, noIntervalo, variacaoEmPontos } from "../regras/taxa";
import type {
  BaseChamados,
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
  /** Chamados de clientes ligados a este defeito (todo o histórico do defeito). */
  chamados: number;
}

export interface BarraChamados {
  rotulo: string;
  descricao: string;
  abertos: number;
}

/** Chamados de produção do sistema, no mesmo período da visão. */
export interface ChamadosDoSistema {
  abertos: number;
  abertosAnterior: number;
  variacao: number | null;
  /** Na data de referência dos chamados. */
  emAberto: number;
  foraDoPrazo: number;
  noPrazo: { taxa: number | null; resolvidos: number; meta: number };
  /** Por dia (7 e 30 dias) ou por semana (90 dias); a soma é igual a `abertos`. */
  agrupamento: "dia" | "semana";
  barras: BarraChamados[];
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
  /** Nulo quando os chamados não foram informados. */
  chamados: ChamadosDoSistema | null;
}

/** Cada dia (ou semana) que toca a janela, recortado pela própria janela. */
function fatias(janela: Janela, agrupamento: "dia" | "semana"): (Janela & { rotulo: string; descricao: string })[] {
  const resultado = [];
  const passo = agrupamento === "dia" ? DIA_MS : SEMANA_MS;
  let inicio = agrupamento === "dia" ? inicioDoDia(janela.inicio) : inicioDaSemana(janela.inicio);
  for (; inicio < janela.fim; inicio += passo) {
    const fim = inicio + passo;
    const local = paraDataLocal(inicio);
    resultado.push({
      inicio: Math.max(inicio, janela.inicio),
      fim: Math.min(fim, janela.fim),
      rotulo: formatarDiaMes(inicio),
      descricao:
        agrupamento === "dia"
          ? `${nomeDiaSemana(local.diaSemana)}, ${formatarData(inicio)}`
          : `Semana de ${formatarDiaMes(inicio)} a ${formatarDiaMes(fim - 1)}`,
    });
  }
  return resultado;
}

function montarChamados(chamados: BaseChamados, sistemaId: string, janela: Janela, periodo: PeriodoDias): ChamadosDoSistema {
  const doSistema = chamados.chamados.filter((c) => c.sistemaId === sistemaId);
  const atual = abertosNaJanela(doSistema, janela);
  const anterior = abertosNaJanela(doSistema, janelaAnterior(janela)).length;
  const emAberto = chamadosEmAberto(doSistema, chamados.referencia);
  const atendimento = resumirAtendimento(doSistema, janela);
  const agrupamento = periodo === 90 ? "semana" : "dia";
  return {
    abertos: atual.length,
    abertosAnterior: anterior,
    variacao: variacaoRelativa(atual.length, anterior),
    emAberto: emAberto.length,
    foraDoPrazo: emAberto.filter((c) => estaForaDoPrazo(c, chamados.referencia)).length,
    noPrazo: { taxa: atendimento.taxaNoPrazo, resolvidos: atendimento.resolvidos, meta: META_NO_PRAZO },
    agrupamento,
    barras: fatias(janela, agrupamento).map((f) => ({
      rotulo: f.rotulo,
      descricao: f.descricao,
      abertos: abertosNaJanela(atual, f).length,
    })),
  };
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
  chamados?: BaseChamados,
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
  const chamadosPorDefeito = chamados
    ? contarChamadosPorDefeito(
        vincularChamados(
          chamados.chamados.filter((c) => c.sistemaId === sistema.id),
          defeitos,
        ),
      )
    : new Map<string, number>();

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
      chamados: chamadosPorDefeito.get(d.codigo) ?? 0,
    })),
    chamados: chamados ? montarChamados(chamados, sistema.id, janela, periodo) : null,
  };
}
