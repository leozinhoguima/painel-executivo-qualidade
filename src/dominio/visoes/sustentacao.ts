import { inicioDoDia, paraDataLocal, semanasFechadas, ultimaSemanaFechada } from "@/lib/datas";
import {
  formatarData,
  formatarDiaMes,
  formatarSemana,
  maiusculaInicial,
  nomeDiaSemana,
  nomeMes,
} from "@/lib/formatacao";
import {
  abertosNaJanela,
  CATEGORIAS,
  chamadosEmAberto,
  contarEventos,
  distribuir,
  estaForaDoPrazo,
  mediaPorDiaDaSemana,
  principaisProblemas,
  resumirAtendimento,
  taxaReabertura,
  variacaoRelativa,
  type Fatia,
  type Problema,
} from "../regras/chamados";
import {
  DIAS_GRAFICO_DIARIO,
  DIAS_GRAFICO_FILA,
  LIMITE_PROBLEMAS_SUSTENTACAO,
  MESES_COMPARATIVO,
  META_NO_PRAZO,
  META_REABERTURA,
  ORDEM_SEVERIDADE,
  SEMANAS_MEDIA_DIA_SEMANA,
} from "../regras/parametros";
import type { Janela } from "../regras/periodo";
import { diasAte, diasNoMes, mesesFechados, periodoSustentacao, type PeriodoSustentacao, type Recorte } from "../regras/periodoSustentacao";
import type { BaseChamados, CategoriaChamado, Instante, Prioridade, Sistema } from "../tipos";

export interface IndicadorContagem {
  valor: number;
  anterior: number;
  /** Variação relativa vs. período anterior; nula se o anterior for zero. */
  variacao: number | null;
}

export interface PontoDiario {
  /** "08/11" */
  rotulo: string;
  /** "domingo, 08/11/2026" */
  descricao: string;
  abertos: number;
  fechados: number;
  reabertos: number;
}

export interface PontoFila {
  rotulo: string;
  descricao: string;
  emAberto: number;
  foraDoPrazo: number;
}

export interface PontoMensal {
  /** "out" */
  rotulo: string;
  /** "outubro de 2026" */
  descricao: string;
  abertos: number;
  fechados: number;
  reabertos: number;
}

export interface PontoDiaSemana {
  /** "seg" */
  rotulo: string;
  /** "segunda-feira" */
  descricao: string;
  /** Média das últimas semanas fechadas. */
  media: number;
  /** Última semana fechada. */
  ultimaSemana: number;
}

export interface LinhaSistema {
  sistema: Sistema;
  quantidade: number;
  fracao: number | null;
}

export interface LinhaProblema extends Problema {
  sistemaNome: string;
}

export interface VisaoSustentacao {
  referencia: Instante;
  periodo: PeriodoSustentacao;
  /** "Semana 45 · 02 a 08 de novembro de 2026" */
  rotuloPeriodo: string;
  /** "vs. semana anterior" */
  rotuloComparacao: string;
  indicadores: {
    abertos: IndicadorContagem;
    fechados: IndicadorContagem;
    reabertos: IndicadorContagem & { taxa: number | null; meta: number };
    emAberto: { valor: number; foraDoPrazo: number; criticos: number };
    noPrazo: { taxa: number | null; taxaAnterior: number | null; resolvidos: number; meta: number };
    tempoMedio: { ms: number | null; anteriorMs: number | null };
  };
  /** Últimos 30 dias completos. */
  diario: PontoDiario[];
  /** Fila ao fim de cada um dos últimos 90 dias. */
  fila: PontoFila[];
  /** Últimos 6 meses fechados. */
  mensal: PontoMensal[];
  diasDaSemana: PontoDiaSemana[];
  semanasNaMedia: number;
  /** Distribuições dos chamados abertos no período. */
  porCategoria: Fatia<CategoriaChamado>[];
  porPrioridade: Fatia<Prioridade>[];
  porSistema: LinhaSistema[];
  problemas: LinhaProblema[];
}

const PRIORIDADES = (Object.keys(ORDEM_SEVERIDADE) as Prioridade[]).sort(
  (a, b) => ORDEM_SEVERIDADE[a] - ORDEM_SEVERIDADE[b],
);

function contagem(valor: number, anterior: number): IndicadorContagem {
  return { valor, anterior, variacao: variacaoRelativa(valor, anterior) };
}

function rotulos(periodo: PeriodoSustentacao): { periodo: string; comparacao: string } {
  const { atual, anterior } = periodo;
  if (periodo.recorte === "dia") {
    const dia = paraDataLocal(atual.inicio);
    const nome = nomeDiaSemana(dia.diaSemana);
    const masculino = dia.diaSemana >= 5;
    return {
      periodo: `${maiusculaInicial(nome)}, ${formatarData(atual.inicio)}`,
      comparacao: `vs. ${masculino ? "o" : "a"} ${nome} anterior (${formatarDiaMes(anterior.inicio)})`,
    };
  }
  if (periodo.recorte === "semana") {
    return { periodo: formatarSemana(ultimaSemanaFechada(atual.fim)), comparacao: "vs. semana anterior" };
  }
  const inicio = paraDataLocal(atual.inicio);
  const ultimo = paraDataLocal(atual.fim - 1);
  const mes = `${maiusculaInicial(nomeMes(inicio.mes))} de ${inicio.ano}`;
  const mesAnterior = paraDataLocal(anterior.inicio);
  if (ultimo.dia === diasNoMes(ultimo.ano, ultimo.mes)) {
    return { periodo: mes, comparacao: `vs. ${nomeMes(mesAnterior.mes)}` };
  }
  const dias = ultimo.dia === 1 ? "1 dia" : `${ultimo.dia} dias`;
  return {
    periodo: `${mes} até ${formatarDiaMes(atual.fim - 1)} (${dias})`,
    comparacao: `vs. 01 a ${formatarDiaMes(anterior.fim - 1)}`,
  };
}

const pontoDia = (dia: Janela) => {
  const l = paraDataLocal(dia.inicio);
  return { rotulo: formatarDiaMes(dia.inicio), descricao: `${nomeDiaSemana(l.diaSemana)}, ${formatarData(dia.inicio)}` };
};

/**
 * Monta a visão de sustentação para o recorte escolhido. Indicadores,
 * distribuições e problemas seguem o recorte; os gráficos de evolução e de
 * comparação têm janelas próprias, informadas nos títulos.
 * Retorna nulo quando ainda não há chamados.
 */
export function montarVisaoSustentacao(base: BaseChamados, recorte: Recorte): VisaoSustentacao | null {
  const { chamados, referencia } = base;
  if (chamados.length === 0) return null;

  const periodo = periodoSustentacao(referencia, recorte);
  const { atual, anterior } = periodo;
  const atualC = contarEventos(chamados, atual);
  const anteriorC = contarEventos(chamados, anterior);
  const atendimento = resumirAtendimento(chamados, atual);
  const atendimentoAnterior = resumirAtendimento(chamados, anterior);
  const emAberto = chamadosEmAberto(chamados, referencia);
  const textos = rotulos(periodo);

  const fimDiasCompletos = inicioDoDia(referencia);
  const diario = diasAte(fimDiasCompletos, DIAS_GRAFICO_DIARIO).map((dia) => ({
    ...pontoDia(dia),
    ...contarEventos(chamados, dia),
  }));
  const fila = diasAte(fimDiasCompletos, DIAS_GRAFICO_FILA).map((dia) => {
    const abertos = chamadosEmAberto(chamados, dia.fim - 1);
    return {
      ...pontoDia(dia),
      emAberto: abertos.length,
      foraDoPrazo: abertos.filter((c) => estaForaDoPrazo(c, dia.fim - 1)).length,
    };
  });
  const mensal = mesesFechados(referencia, MESES_COMPARATIVO).map((mes) => {
    const l = paraDataLocal(mes.inicio);
    return { rotulo: nomeMes(l.mes, true), descricao: `${nomeMes(l.mes)} de ${l.ano}`, ...contarEventos(chamados, mes) };
  });

  const semanas = semanasFechadas(referencia, SEMANAS_MEDIA_DIA_SEMANA);
  const media = mediaPorDiaDaSemana(chamados, semanas);
  const ultimaSemana = mediaPorDiaDaSemana(chamados, semanas.slice(-1));
  const diasDaSemana = media.map((m, i) => ({
    rotulo: nomeDiaSemana(i, true),
    descricao: nomeDiaSemana(i),
    media: m,
    ultimaSemana: ultimaSemana[i],
  }));

  const doPeriodo = abertosNaJanela(chamados, atual);
  const sistemas = new Map(base.sistemas.map((s) => [s.id, s]));
  const porSistema = distribuir(
    doPeriodo,
    (c) => c.sistemaId,
    base.sistemas.map((s) => s.id),
  ).map((f) => ({ sistema: sistemas.get(f.chave) as Sistema, quantidade: f.quantidade, fracao: f.fracao }));

  return {
    referencia,
    periodo,
    rotuloPeriodo: textos.periodo,
    rotuloComparacao: textos.comparacao,
    indicadores: {
      abertos: contagem(atualC.abertos, anteriorC.abertos),
      fechados: contagem(atualC.fechados, anteriorC.fechados),
      reabertos: { ...contagem(atualC.reabertos, anteriorC.reabertos), taxa: taxaReabertura(atualC), meta: META_REABERTURA },
      emAberto: {
        valor: emAberto.length,
        foraDoPrazo: emAberto.filter((c) => estaForaDoPrazo(c, referencia)).length,
        criticos: emAberto.filter((c) => c.prioridade === "critica").length,
      },
      noPrazo: {
        taxa: atendimento.taxaNoPrazo,
        taxaAnterior: atendimentoAnterior.taxaNoPrazo,
        resolvidos: atendimento.resolvidos,
        meta: META_NO_PRAZO,
      },
      tempoMedio: { ms: atendimento.tempoMedioMs, anteriorMs: atendimentoAnterior.tempoMedioMs },
    },
    diario,
    fila,
    mensal,
    diasDaSemana,
    semanasNaMedia: semanas.length,
    porCategoria: distribuir(doPeriodo, (c) => c.categoria, CATEGORIAS),
    porPrioridade: distribuir(doPeriodo, (c) => c.prioridade, PRIORIDADES).sort(
      (a, b) => ORDEM_SEVERIDADE[a.chave] - ORDEM_SEVERIDADE[b.chave],
    ),
    porSistema,
    problemas: principaisProblemas(chamados, atual, anterior, referencia, LIMITE_PROBLEMAS_SUSTENTACAO).map((p) => ({
      ...p,
      sistemaNome: sistemas.get(p.sistemaId)?.nome ?? p.sistemaId,
    })),
  };
}
