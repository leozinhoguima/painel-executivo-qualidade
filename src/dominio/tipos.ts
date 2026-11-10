/**
 * Modelo de dados do painel.
 *
 * Os tipos "Armazenado" descrevem o formato dos arquivos em `data/` — o mesmo
 * para o histórico fictício e para os relatórios importados da suíte de testes.
 * Os demais tipos são o modelo de domínio usado pelas regras de cálculo.
 */

export type Criticidade = "critica" | "alta" | "media" | "baixa";
/** A severidade de um defeito usa a mesma escala da criticidade da funcionalidade. */
export type Severidade = Criticidade;
export type Resultado = "sucesso" | "falha";
export type StatusProntidao = "pronto" | "atencao" | "risco" | "sem-dados";
export type SituacaoAcompanhamento = "em-analise" | "em-correcao" | "aguardando-decisao";
export type SituacaoDefeito = "aberto" | SituacaoAcompanhamento | "resolvido";
export type OrigemRodada = "historico-ficticio" | "suite-automatizada";
/** Artigo definido usado para concordância no texto gerado ("a Abertura de Conta", "os Cartões"). */
export type Artigo = "o" | "a" | "os" | "as";

// ---------------------------------------------------------------------------
// Catálogo (data/catalogo.json)
// ---------------------------------------------------------------------------

export interface Sistema {
  id: string;
  nome: string;
  artigo: Artigo;
  /** Área de negócio responsável. */
  area: string;
  /** Prefixo dos códigos de defeito (ex.: "PX" → PX-101). */
  prefixoDefeito: string;
}

export interface Funcionalidade {
  id: string;
  sistemaId: string;
  /** Nome em linguagem de negócio. */
  nome: string;
  criticidade: Criticidade;
  /** Consequência para o cliente/negócio quando a funcionalidade falha. */
  impactoNegocio: string;
}

export interface CasoDeTeste {
  id: string;
  funcionalidadeId: string;
  /** Método e rota exercitados (ex.: "POST /pix/transferencias"). */
  requisicao: string;
  descricaoTecnica: string;
}

export interface Catalogo {
  sistemas: Sistema[];
  funcionalidades: Funcionalidade[];
  casos: CasoDeTeste[];
}

// ---------------------------------------------------------------------------
// Execuções armazenadas (data/execucoes/*.json)
// ---------------------------------------------------------------------------

export interface ExecucaoArmazenada {
  casoId: string;
  resultado: Resultado;
  duracaoMs: number;
  /** Mensagem técnica original da falha (somente quando resultado = "falha"). */
  erroTecnico?: string;
}

export interface RodadaArmazenada {
  id: string;
  /** Data e hora ISO 8601 com fuso (ex.: "2026-11-09T06:00:00-03:00"). */
  dataHora: string;
  origem: OrigemRodada;
  execucoes: ExecucaoArmazenada[];
}

export interface ArquivoExecucoes {
  versao: 1;
  aviso?: string;
  rodadas: RodadaArmazenada[];
}

// ---------------------------------------------------------------------------
// Acompanhamento e tradução (data/acompanhamento.json, data/traducoes.json)
// ---------------------------------------------------------------------------

export interface Acompanhamento {
  codigoDefeito: string;
  situacao: SituacaoAcompanhamento;
  responsavel?: string;
  /** Sobrescreve a severidade herdada da criticidade da funcionalidade. */
  severidade?: Severidade;
  observacao?: string;
}

export interface RegraTraducaoArmazenada {
  /** Expressão regular aplicada à mensagem técnica. */
  padrao: string;
  /** Descrição do problema em linguagem de negócio. */
  descricao: string;
}

export interface RegraTraducao {
  padrao: RegExp;
  descricao: string;
}

// ---------------------------------------------------------------------------
// Modelo de domínio
// ---------------------------------------------------------------------------

/** Instante em milissegundos desde a época (UTC). */
export type Instante = number;

export interface Rodada {
  id: string;
  instante: Instante;
  origem: OrigemRodada;
  totalTestes: number;
}

export interface Execucao {
  id: string;
  rodadaId: string;
  casoId: string;
  funcionalidadeId: string;
  sistemaId: string;
  instante: Instante;
  resultado: Resultado;
  duracaoMs: number;
  erroTecnico?: string;
}

export interface Defeito {
  codigo: string;
  sistemaId: string;
  funcionalidadeId: string;
  casosAfetados: string[];
  severidade: Severidade;
  situacao: SituacaoDefeito;
  /** Primeira falha do problema. */
  abertoEm: Instante;
  /** Primeiro sucesso após a última falha; nulo enquanto aberto. */
  resolvidoEm: Instante | null;
  descricaoNegocio: string;
  erroTecnico: string;
  ocorrencias: number;
  responsavel?: string;
  observacao?: string;
}

/** Conjunto completo de dados já validados, pronto para as regras de cálculo. */
export interface BaseQualidade {
  catalogo: Catalogo;
  rodadas: Rodada[];
  /** Ordenadas por instante crescente. */
  execucoes: Execucao[];
  acompanhamento: Acompanhamento[];
  traducoes: RegraTraducao[];
}
