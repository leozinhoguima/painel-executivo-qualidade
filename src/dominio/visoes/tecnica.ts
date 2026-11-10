import { janelaMovel, lerPeriodo, type Janela, type PeriodoDias } from "../regras/periodo";
import { calcularTaxa, noIntervalo } from "../regras/taxa";
import { traduzirErro } from "../regras/traducao";
import type { BaseQualidade, Funcionalidade, Instante, OrigemRodada, Resultado, Sistema } from "../tipos";

export const ITENS_POR_PAGINA = 50;
/** Na visão técnica, o recorte padrão é a última semana. */
export const PERIODO_PADRAO_TECNICA: PeriodoDias = 7;

export type FiltroResultado = "todos" | Resultado;

export interface FiltrosExecucoes {
  periodo: PeriodoDias;
  sistemaId: string | null;
  funcionalidadeId: string | null;
  resultado: FiltroResultado;
  pagina: number;
}

type Parametros = Record<string, string | string[] | undefined>;

const primeiro = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Lê os filtros da URL. Valores desconhecidos viram o padrão (nunca erro):
 * período 7 dias, todos os sistemas, todas as funcionalidades, todos os resultados, página 1.
 * Uma funcionalidade de outro sistema é descartada.
 */
export function lerFiltrosExecucoes(parametros: Parametros, base: Pick<BaseQualidade, "catalogo">): FiltrosExecucoes {
  const sistemaBruto = primeiro(parametros.sistema);
  const sistemaId = base.catalogo.sistemas.some((s) => s.id === sistemaBruto) ? (sistemaBruto as string) : null;

  const funcionalidadeBruta = primeiro(parametros.funcionalidade);
  const funcionalidade = base.catalogo.funcionalidades.find((f) => f.id === funcionalidadeBruta);
  const funcionalidadeId =
    funcionalidade && (sistemaId === null || funcionalidade.sistemaId === sistemaId) ? funcionalidade.id : null;

  const resultadoBruto = primeiro(parametros.resultado);
  const resultado: FiltroResultado =
    resultadoBruto === "sucesso" || resultadoBruto === "falha" ? resultadoBruto : "todos";

  const periodo = primeiro(parametros.periodo) === undefined ? PERIODO_PADRAO_TECNICA : lerPeriodo(parametros.periodo);

  const paginaNumero = Number(primeiro(parametros.pagina));
  const pagina = Number.isInteger(paginaNumero) && paginaNumero >= 1 ? paginaNumero : 1;

  return { periodo, sistemaId, funcionalidadeId, resultado, pagina };
}

/** Monta a query string dos filtros, omitindo os valores padrão. */
export function consultaDosFiltros(filtros: FiltrosExecucoes, alteracoes: Partial<FiltrosExecucoes> = {}): string {
  const f = { ...filtros, ...alteracoes };
  const p = new URLSearchParams();
  if (f.periodo !== PERIODO_PADRAO_TECNICA) p.set("periodo", String(f.periodo));
  if (f.sistemaId) p.set("sistema", f.sistemaId);
  if (f.funcionalidadeId) p.set("funcionalidade", f.funcionalidadeId);
  if (f.resultado !== "todos") p.set("resultado", f.resultado);
  if (f.pagina > 1) p.set("pagina", String(f.pagina));
  const texto = p.toString();
  return texto ? `?${texto}` : "";
}

export interface LinhaExecucao {
  id: string;
  instante: Instante;
  /** De onde veio a execução: histórico fictício ou suíte automatizada real. */
  origem: OrigemRodada;
  sistemaNome: string;
  funcionalidadeNome: string;
  casoId: string;
  descricaoTecnica: string;
  resultado: Resultado;
  duracaoMs: number;
  erroTecnico?: string;
  /** Tradução de negócio da falha (mesma camada usada nos defeitos). */
  descricaoNegocio?: string;
}

export interface VisaoTecnica {
  /** Filtros efetivamente aplicados (a página é ajustada ao intervalo válido). */
  filtros: FiltrosExecucoes;
  janela: Janela;
  total: number;
  falhas: number;
  taxa: number | null;
  totalPaginas: number;
  primeiraPosicao: number;
  ultimaPosicao: number;
  /** Da mais recente para a mais antiga. */
  linhas: LinhaExecucao[];
  opcoes: { sistemas: Sistema[]; funcionalidades: Funcionalidade[] };
}

/** Lista de execuções filtrada e paginada. Retorna nula quando não há nenhuma rodada. */
export function montarVisaoTecnica(base: BaseQualidade, filtros: FiltrosExecucoes): VisaoTecnica | null {
  const ultima = base.rodadas.at(-1);
  if (!ultima) return null;

  const janela = janelaMovel(ultima.instante, filtros.periodo);
  const filtradas = noIntervalo(base.execucoes, janela.inicio, janela.fim).filter(
    (e) =>
      (filtros.sistemaId === null || e.sistemaId === filtros.sistemaId) &&
      (filtros.funcionalidadeId === null || e.funcionalidadeId === filtros.funcionalidadeId) &&
      (filtros.resultado === "todos" || e.resultado === filtros.resultado),
  );

  const taxa = calcularTaxa(filtradas);
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  const pagina = Math.min(filtros.pagina, totalPaginas);
  const inicio = (pagina - 1) * ITENS_POR_PAGINA;

  const sistemas = new Map(base.catalogo.sistemas.map((s) => [s.id, s]));
  const funcionalidades = new Map(base.catalogo.funcionalidades.map((f) => [f.id, f]));
  const casos = new Map(base.catalogo.casos.map((c) => [c.id, c]));
  const origens = new Map(base.rodadas.map((r) => [r.id, r.origem]));

  // Mais recentes primeiro; dentro da mesma rodada, na ordem do catálogo.
  const ordenadas = [...filtradas].sort((a, b) => b.instante - a.instante || a.casoId.localeCompare(b.casoId));

  const linhas: LinhaExecucao[] = ordenadas.slice(inicio, inicio + ITENS_POR_PAGINA).map((e) => {
    const funcionalidade = funcionalidades.get(e.funcionalidadeId);
    return {
      id: e.id,
      instante: e.instante,
      origem: origens.get(e.rodadaId) ?? "historico-ficticio",
      sistemaNome: sistemas.get(e.sistemaId)?.nome ?? e.sistemaId,
      funcionalidadeNome: funcionalidade?.nome ?? e.funcionalidadeId,
      casoId: e.casoId,
      descricaoTecnica: casos.get(e.casoId)?.descricaoTecnica ?? "",
      resultado: e.resultado,
      duracaoMs: e.duracaoMs,
      ...(e.resultado === "falha"
        ? {
            erroTecnico: e.erroTecnico,
            descricaoNegocio: funcionalidade ? traduzirErro(e.erroTecnico, funcionalidade, base.traducoes) : undefined,
          }
        : {}),
    };
  });

  return {
    filtros: { ...filtros, pagina },
    janela,
    total: filtradas.length,
    falhas: taxa.total - taxa.sucessos,
    taxa: taxa.valor,
    totalPaginas,
    primeiraPosicao: filtradas.length === 0 ? 0 : inicio + 1,
    ultimaPosicao: Math.min(inicio + ITENS_POR_PAGINA, filtradas.length),
    linhas,
    opcoes: { sistemas: base.catalogo.sistemas, funcionalidades: base.catalogo.funcionalidades },
  };
}
