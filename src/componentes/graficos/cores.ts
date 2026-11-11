import type { CategoriaChamado, Prioridade } from "@/dominio/tipos";

/**
 * Cores dos gráficos de sustentação. Paleta categórica validada (ordem fixa,
 * separação para daltonismo); a cor segue a entidade, nunca a posição.
 * Verde-água, amarelo e rosa ficam abaixo de 3:1 sobre o branco: por isso
 * todo gráfico traz legenda com os números e uma tabela para leitores de tela.
 */
export const COR_SERIE = {
  abertos: "#2a78d6",
  fechados: "#eb6834",
  reabertos: "#1baf7a",
} as const;

/** Mesma ordem de CATEGORIAS (regras/chamados.ts). */
export const COR_CATEGORIA: Record<CategoriaChamado, string> = {
  indisponibilidade: "#2a78d6",
  "erro-transacao": "#eb6834",
  lentidao: "#1baf7a",
  acesso: "#eda100",
  duvida: "#e87ba4",
};

/** Escala ordinal de um só tom: quanto mais grave, mais escuro. */
export const COR_PRIORIDADE: Record<Prioridade, string> = {
  critica: "#104281",
  alta: "#256abf",
  media: "#5598e7",
  baixa: "#86b6ef",
};

/** Destaque (um valor em azul) contra referência em cinza. */
export const COR_DESTAQUE = "#2a78d6";
export const COR_REFERENCIA = "#b4bdca";

export const COR_EIXO = "#475569";
export const COR_GRADE = "#edf1f6";
export const COR_LINHA_EIXO = "#e2e8f0";
