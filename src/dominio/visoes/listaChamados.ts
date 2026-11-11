import {
  CATEGORIAS,
  chamadosEmAberto,
  estaEmAberto,
  estaForaDoPrazo,
  limiteDoPrazo,
  primeiroFechamento,
} from "../regras/chamados";
import { derivarDefeitos } from "../regras/defeitos";
import { ORDEM_SEVERIDADE } from "../regras/parametros";
import { janelaMovel, lerPeriodo, type Janela, type PeriodoDias } from "../regras/periodo";
import { vincularChamados } from "../regras/vinculo";
import type {
  BaseChamados,
  BaseQualidade,
  CanalChamado,
  CategoriaChamado,
  Chamado,
  Funcionalidade,
  Instante,
  Prioridade,
  Sistema,
} from "../tipos";

export const CHAMADOS_POR_PAGINA = 50;
export const PERIODO_PADRAO_CHAMADOS: PeriodoDias = 30;

export const SITUACOES_FILTRO = ["todas", "em-aberto", "fora-do-prazo", "reabertos", "fechados"] as const;
export type FiltroSituacao = (typeof SITUACOES_FILTRO)[number];

export interface FiltrosChamados {
  periodo: PeriodoDias;
  sistemaId: string | null;
  funcionalidadeId: string | null;
  categoria: CategoriaChamado | null;
  prioridade: Prioridade | null;
  situacao: FiltroSituacao;
  /** Motivo exato (vem dos "Principais problemas"). */
  motivo: string | null;
  /** Código de defeito: mostra os chamados ligados a ele, em todo o histórico. */
  defeito: string | null;
  pagina: number;
}

type Parametros = Record<string, string | string[] | undefined>;
const primeiro = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const PRIORIDADES = (Object.keys(ORDEM_SEVERIDADE) as Prioridade[]).sort(
  (a, b) => ORDEM_SEVERIDADE[a] - ORDEM_SEVERIDADE[b],
);

/**
 * Lê os filtros da URL. Valores desconhecidos viram o padrão (nunca erro).
 * Uma funcionalidade de outro sistema é descartada.
 */
export function lerFiltrosChamados(
  parametros: Parametros,
  catalogo: { sistemas: Sistema[]; funcionalidades: Funcionalidade[] },
): FiltrosChamados {
  const sistemaBruto = primeiro(parametros.sistema);
  const sistemaId = catalogo.sistemas.some((s) => s.id === sistemaBruto) ? (sistemaBruto as string) : null;
  const funcionalidade = catalogo.funcionalidades.find((f) => f.id === primeiro(parametros.funcionalidade));
  const funcionalidadeId =
    funcionalidade && (sistemaId === null || funcionalidade.sistemaId === sistemaId) ? funcionalidade.id : null;

  const categoriaBruta = primeiro(parametros.tipo);
  const prioridadeBruta = primeiro(parametros.prioridade);
  const situacaoBruta = primeiro(parametros.situacao);
  const motivo = primeiro(parametros.motivo)?.trim() || null;
  const defeito = primeiro(parametros.defeito)?.trim().toUpperCase() || null;
  const paginaNumero = Number(primeiro(parametros.pagina));

  return {
    periodo: primeiro(parametros.periodo) === undefined ? PERIODO_PADRAO_CHAMADOS : lerPeriodo(parametros.periodo),
    sistemaId,
    funcionalidadeId,
    categoria: (CATEGORIAS as readonly string[]).includes(categoriaBruta ?? "")
      ? (categoriaBruta as CategoriaChamado)
      : null,
    prioridade: (PRIORIDADES as readonly string[]).includes(prioridadeBruta ?? "") ? (prioridadeBruta as Prioridade) : null,
    situacao: (SITUACOES_FILTRO as readonly string[]).includes(situacaoBruta ?? "")
      ? (situacaoBruta as FiltroSituacao)
      : "todas",
    motivo: motivo && motivo.length <= 120 ? motivo : null,
    defeito: defeito && /^[A-Z]{2,4}-\d{1,5}$/.test(defeito) ? defeito : null,
    pagina: Number.isInteger(paginaNumero) && paginaNumero >= 1 ? paginaNumero : 1,
  };
}

/** Query string dos filtros, omitindo os valores padrão. */
export function consultaDosFiltrosChamados(
  filtros: FiltrosChamados,
  alteracoes: Partial<FiltrosChamados> = {},
): string {
  const f = { ...filtros, ...alteracoes };
  const p = new URLSearchParams();
  if (f.periodo !== PERIODO_PADRAO_CHAMADOS) p.set("periodo", String(f.periodo));
  if (f.sistemaId) p.set("sistema", f.sistemaId);
  if (f.funcionalidadeId) p.set("funcionalidade", f.funcionalidadeId);
  if (f.categoria) p.set("tipo", f.categoria);
  if (f.prioridade) p.set("prioridade", f.prioridade);
  if (f.situacao !== "todas") p.set("situacao", f.situacao);
  if (f.motivo) p.set("motivo", f.motivo);
  if (f.defeito) p.set("defeito", f.defeito);
  if (f.pagina > 1) p.set("pagina", String(f.pagina));
  const texto = p.toString();
  return texto ? `?${texto}` : "";
}

export type SituacaoChamado = "em-aberto" | "fechado";

export interface LinhaChamado {
  codigo: string;
  abertura: Instante;
  canal: CanalChamado;
  sistemaId: string;
  sistemaNome: string;
  funcionalidadeNome: string | null;
  categoria: CategoriaChamado;
  motivo: string;
  prioridade: Prioridade;
  situacao: SituacaoChamado;
  reaberto: boolean;
  foraDoPrazo: boolean;
  /** Da abertura ao primeiro fechamento; nulo se ainda não foi fechado. */
  tempoSolucaoMs: number | null;
  /** Em aberto: tempo desde a abertura até a referência. */
  tempoEmAbertoMs: number | null;
  /** Primeiro fechamento dentro do prazo (nulo se ainda não fechou). */
  resolvidoNoPrazo: boolean | null;
  defeito: string | null;
}

export interface VisaoListaChamados {
  filtros: FiltrosChamados;
  referencia: Instante;
  /** Nula quando o filtro de defeito ignora o período. */
  janela: Janela | null;
  total: number;
  emAberto: number;
  foraDoPrazo: number;
  totalPaginas: number;
  primeiraPosicao: number;
  ultimaPosicao: number;
  linhas: LinhaChamado[];
  opcoes: { sistemas: Sistema[]; funcionalidades: Funcionalidade[] };
}

function passaSituacao(c: Chamado, situacao: FiltroSituacao, referencia: Instante): boolean {
  switch (situacao) {
    case "em-aberto":
      return estaEmAberto(c, referencia);
    case "fora-do-prazo":
      return estaForaDoPrazo(c, referencia);
    case "reabertos":
      return c.eventos.some((e) => e.tipo === "reabertura" && e.instante <= referencia);
    case "fechados":
      return !estaEmAberto(c, referencia);
    default:
      return true;
  }
}

/**
 * Lista técnica de chamados, do mais recente para o mais antigo. O período
 * filtra pela abertura; a situação é a da data de referência. Com um defeito
 * escolhido, o período é ignorado: aparecem todos os chamados ligados a ele.
 */
export function montarListaChamados(
  chamados: BaseChamados,
  qualidade: BaseQualidade,
  filtros: FiltrosChamados,
): VisaoListaChamados | null {
  if (chamados.chamados.length === 0) return null;
  const { referencia } = chamados;
  const vinculos = vincularChamados(chamados.chamados, derivarDefeitos(qualidade, referencia));
  const janela = filtros.defeito ? null : janelaMovel(referencia, filtros.periodo);

  const filtrados = chamados.chamados.filter(
    (c) =>
      (janela === null || (c.abertura >= janela.inicio && c.abertura < janela.fim)) &&
      (filtros.sistemaId === null || c.sistemaId === filtros.sistemaId) &&
      (filtros.funcionalidadeId === null || c.funcionalidadeId === filtros.funcionalidadeId) &&
      (filtros.categoria === null || c.categoria === filtros.categoria) &&
      (filtros.prioridade === null || c.prioridade === filtros.prioridade) &&
      (filtros.motivo === null || c.motivo === filtros.motivo) &&
      (filtros.defeito === null || vinculos.get(c.codigo) === filtros.defeito) &&
      c.abertura <= referencia &&
      passaSituacao(c, filtros.situacao, referencia),
  );

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / CHAMADOS_POR_PAGINA));
  const pagina = Math.min(filtros.pagina, totalPaginas);
  const inicio = (pagina - 1) * CHAMADOS_POR_PAGINA;
  const sistemas = new Map(qualidade.catalogo.sistemas.map((s) => [s.id, s]));
  const funcionalidades = new Map(qualidade.catalogo.funcionalidades.map((f) => [f.id, f]));
  const abertos = chamadosEmAberto(filtrados, referencia);

  const ordenados = [...filtrados].sort((a, b) => b.abertura - a.abertura || b.codigo.localeCompare(a.codigo));
  const linhas: LinhaChamado[] = ordenados.slice(inicio, inicio + CHAMADOS_POR_PAGINA).map((c) => {
    const emAberto = estaEmAberto(c, referencia);
    const fechamento = primeiroFechamento(c);
    const fechou = fechamento !== null && fechamento <= referencia;
    return {
      codigo: c.codigo,
      abertura: c.abertura,
      canal: c.canal,
      sistemaId: c.sistemaId,
      sistemaNome: sistemas.get(c.sistemaId)?.nome ?? c.sistemaId,
      funcionalidadeNome: c.funcionalidadeId ? (funcionalidades.get(c.funcionalidadeId)?.nome ?? null) : null,
      categoria: c.categoria,
      motivo: c.motivo,
      prioridade: c.prioridade,
      situacao: emAberto ? "em-aberto" : "fechado",
      reaberto: c.eventos.some((e) => e.tipo === "reabertura" && e.instante <= referencia),
      foraDoPrazo: estaForaDoPrazo(c, referencia),
      tempoSolucaoMs: fechou ? fechamento - c.abertura : null,
      tempoEmAbertoMs: emAberto ? referencia - c.abertura : null,
      resolvidoNoPrazo: fechou ? fechamento <= limiteDoPrazo(c) : null,
      defeito: vinculos.get(c.codigo) ?? null,
    };
  });

  return {
    filtros: { ...filtros, pagina },
    referencia,
    janela,
    total: filtrados.length,
    emAberto: abertos.length,
    foraDoPrazo: abertos.filter((c) => estaForaDoPrazo(c, referencia)).length,
    totalPaginas,
    primeiraPosicao: filtrados.length === 0 ? 0 : inicio + 1,
    ultimaPosicao: Math.min(inicio + CHAMADOS_POR_PAGINA, filtrados.length),
    linhas,
    opcoes: { sistemas: qualidade.catalogo.sistemas, funcionalidades: qualidade.catalogo.funcionalidades },
  };
}
