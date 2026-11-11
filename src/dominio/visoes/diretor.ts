import { SEMANA_MS, semanasFechadas, type Semana } from "@/lib/datas";
import {
  abertosNaJanela,
  chamadosEmAberto,
  contarEventos,
  estaForaDoPrazo,
  principaisProblemas,
  resumirAtendimento,
  variacaoRelativa,
} from "../regras/chamados";
import { contarChamadosPorDefeito, vincularChamados } from "../regras/vinculo";
import { janelaMovel } from "../regras/periodo";
import { classificarProntidao, compararPiorPrimeiro } from "../regras/prontidao";
import {
  compararPorPrioridade,
  defeitosAbertos,
  derivarDefeitos,
  diasEmAberto,
  tempoMedioCorrecao,
} from "../regras/defeitos";
import { JANELA_CORRECAO_DIAS, META_CORRECAO_DIAS, META_NO_PRAZO, SEMANAS_TENDENCIA } from "../regras/parametros";
import { descreverImpacto, proporcaoFalhasRecentes } from "../regras/problemas";
import { gerarResumoSemana, type TrechoResumo } from "../regras/resumo";
import { calcularTaxa, noIntervalo, variacaoEmPontos } from "../regras/taxa";
import { tendenciaSemanal } from "../regras/tendencia";
import type {
  BaseChamados,
  BaseQualidade,
  Defeito,
  Instante,
  Rodada,
  Severidade,
  SituacaoDefeito,
  Sistema,
  StatusProntidao,
} from "../tipos";

export interface LinhaProntidao {
  sistema: Sistema;
  taxa: number | null;
  status: StatusProntidao;
  defeitosAbertos: number;
  /** Chamados de clientes abertos na semana; nulo sem dados de chamados. */
  chamadosSemana: number | null;
}

export interface ProblemaPrincipal {
  codigo: string;
  titulo: string;
  sistemaNome: string;
  impacto: string;
  severidade: Severidade;
  situacao: SituacaoDefeito;
  diasAberto: number;
  /** Chamados de clientes ligados ao defeito; nulo sem dados de chamados. */
  chamados: number | null;
}

/** Sustentação na mesma semana fechada da visão executiva. */
export interface SustentacaoSemana {
  abertos: number;
  abertosAnterior: number;
  variacao: number | null;
  fechados: number;
  emAberto: number;
  foraDoPrazo: number;
  noPrazo: { taxa: number | null; meta: number };
  /** Os 3 motivos com mais chamados na semana. */
  motivos: { motivo: string; sistema: Pick<Sistema, "nome" | "artigo">; quantidade: number }[];
}

export interface VisaoDiretor {
  referencia: Instante;
  ultimaRodada: Rodada;
  semana: Semana;
  resumo: TrechoResumo[];
  indicadores: {
    taxaSemana: number | null;
    variacaoPontos: number | null;
    sistemasProntos: number;
    totalSistemas: number;
    emAtencao: number;
    emRisco: number;
    falhasCriticasAbertas: number;
    diasCriticaMaisAntiga: number | null;
    tempoMedioCorrecaoDias: number | null;
    defeitosResolvidosNaJanela: number;
    metaCorrecaoDias: number;
    janelaCorrecaoDias: number;
  };
  prontidao: LinhaProntidao[];
  tendencia: { rotulo: string; taxa: number | null; execucoes: number }[];
  problemas: ProblemaPrincipal[];
  /** Nula quando os chamados não foram informados. */
  sustentacao: SustentacaoSemana | null;
}

function montarSustentacao(chamados: BaseChamados, semana: Semana, nomes: Map<string, Sistema>): SustentacaoSemana {
  const anterior = { inicio: semana.inicio - SEMANA_MS, fim: semana.inicio };
  const atual = contarEventos(chamados.chamados, semana);
  const antes = contarEventos(chamados.chamados, anterior);
  const emAberto = chamadosEmAberto(chamados.chamados, chamados.referencia);
  return {
    abertos: atual.abertos,
    abertosAnterior: antes.abertos,
    variacao: variacaoRelativa(atual.abertos, antes.abertos),
    fechados: atual.fechados,
    emAberto: emAberto.length,
    foraDoPrazo: emAberto.filter((c) => estaForaDoPrazo(c, chamados.referencia)).length,
    noPrazo: { taxa: resumirAtendimento(chamados.chamados, semana).taxaNoPrazo, meta: META_NO_PRAZO },
    motivos: principaisProblemas(chamados.chamados, semana, anterior, chamados.referencia, 3).map((p) => ({
      motivo: p.motivo,
      sistema: nomes.get(p.sistemaId) ?? { nome: p.sistemaId, artigo: "o" },
      quantidade: p.quantidade,
    })),
  };
}

/**
 * Monta todos os números da visão executiva a partir dos registros.
 * Os chamados são opcionais: sem eles, a visão mostra só os testes.
 * Retorna nulo quando não há nenhuma rodada de testes.
 */
export function montarVisaoDiretor(base: BaseQualidade, chamados?: BaseChamados): VisaoDiretor | null {
  const ultimaRodada = base.rodadas.at(-1);
  if (!ultimaRodada) return null;

  const referencia = ultimaRodada.instante;
  const semanas = semanasFechadas(referencia, SEMANAS_TENDENCIA);
  const semana = semanas[semanas.length - 1];
  const semanaAnterior = semanas[semanas.length - 2];

  const defeitos = derivarDefeitos(base, referencia);
  const abertos = defeitosAbertos(defeitos);
  const execSemana = noIntervalo(base.execucoes, semana.inicio, semana.fim);
  const execAnterior = noIntervalo(base.execucoes, semanaAnterior.inicio, semanaAnterior.fim);
  const funcionalidades = new Map(base.catalogo.funcionalidades.map((f) => [f.id, f]));
  const sistemasPorId = new Map(base.catalogo.sistemas.map((s) => [s.id, s]));

  const chamadosDaSemana = chamados ? abertosNaJanela(chamados.chamados, semana) : null;
  const sustentacao = chamados ? montarSustentacao(chamados, semana, sistemasPorId) : null;
  const chamadosPorDefeito = chamados
    ? contarChamadosPorDefeito(vincularChamados(chamados.chamados, defeitos))
    : null;

  const abertosPorSistema = (sistemaId: string) =>
    abertos.filter((d) => d.sistemaId === sistemaId).sort(compararPorPrioridade);

  const prontidao: LinhaProntidao[] = base.catalogo.sistemas
    .map((sistema) => {
      const taxa = calcularTaxa(execSemana.filter((e) => e.sistemaId === sistema.id)).valor;
      const doSistema = abertosPorSistema(sistema.id);
      return {
        sistema,
        taxa,
        status: classificarProntidao(taxa, doSistema.map((d) => d.severidade)),
        defeitosAbertos: doSistema.length,
        chamadosSemana: chamadosDaSemana ? chamadosDaSemana.filter((c) => c.sistemaId === sistema.id).length : null,
      };
    })
    .sort(compararPiorPrimeiro);

  const taxaSemana = calcularTaxa(execSemana).valor;
  const variacaoPontos = variacaoEmPontos(taxaSemana, calcularTaxa(execAnterior).valor);

  const criticas = abertos.filter((d) => d.severidade === "critica");
  const janelaCorrecao = janelaMovel(referencia, JANELA_CORRECAO_DIAS);
  const correcao = tempoMedioCorrecao(defeitos, janelaCorrecao.inicio, janelaCorrecao.fim);

  const resumo = gerarResumoSemana({
    sistemas: prontidao.map((linha) => {
      const principal: Defeito | undefined = abertosPorSistema(linha.sistema.id)[0];
      return {
        sistema: linha.sistema,
        status: linha.status,
        taxa: linha.taxa,
        problemaPrincipal: principal
          ? { descricao: principal.descricaoNegocio, diasAberto: diasEmAberto(principal, referencia) }
          : null,
      };
    }),
    taxaSemana,
    variacaoPontos,
    aguardandoDecisao: abertos.filter((d) => d.situacao === "aguardando-decisao").length,
    ...(sustentacao
      ? {
          chamados: {
            abertos: sustentacao.abertos,
            variacao: sustentacao.variacao,
            principalMotivo: sustentacao.motivos[0] ?? null,
          },
        }
      : {}),
  });

  const problemas: ProblemaPrincipal[] = [...abertos]
    .sort(compararPorPrioridade)
    .slice(0, 3)
    .map((d) => {
      const funcionalidade = funcionalidades.get(d.funcionalidadeId);
      return {
        codigo: d.codigo,
        titulo: d.descricaoNegocio,
        sistemaNome: sistemasPorId.get(d.sistemaId)?.nome ?? d.sistemaId,
        impacto: funcionalidade
          ? descreverImpacto(funcionalidade, proporcaoFalhasRecentes(d, base.execucoes, referencia))
          : "",
        severidade: d.severidade,
        situacao: d.situacao,
        diasAberto: diasEmAberto(d, referencia),
        chamados: chamadosPorDefeito ? (chamadosPorDefeito.get(d.codigo) ?? 0) : null,
      };
    });

  return {
    referencia,
    ultimaRodada,
    semana,
    resumo,
    indicadores: {
      taxaSemana,
      variacaoPontos,
      sistemasProntos: prontidao.filter((l) => l.status === "pronto").length,
      totalSistemas: prontidao.length,
      emAtencao: prontidao.filter((l) => l.status === "atencao").length,
      emRisco: prontidao.filter((l) => l.status === "risco").length,
      falhasCriticasAbertas: criticas.length,
      diasCriticaMaisAntiga: criticas.length
        ? Math.max(...criticas.map((d) => diasEmAberto(d, referencia)))
        : null,
      tempoMedioCorrecaoDias: correcao.mediaDias,
      defeitosResolvidosNaJanela: correcao.quantidade,
      metaCorrecaoDias: META_CORRECAO_DIAS,
      janelaCorrecaoDias: JANELA_CORRECAO_DIAS,
    },
    prontidao,
    tendencia: tendenciaSemanal(base.execucoes, semanas).map((p) => ({
      rotulo: p.rotulo,
      taxa: p.taxa.valor,
      execucoes: p.taxa.total,
    })),
    problemas,
    sustentacao,
  };
}
