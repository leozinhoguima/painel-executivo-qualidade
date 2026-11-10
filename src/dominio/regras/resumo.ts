import {
  formatarPercentual,
  formatarPercentualCurto,
  formatarPontos,
  maiusculaInicial,
  minusculaInicial,
  pluralizar,
} from "@/lib/formatacao";
import type { Artigo, Sistema, StatusProntidao } from "../tipos";
import { LIMITE_RISCO, META_SUCESSO } from "./parametros";
import { direcaoDaVariacao } from "./tendencia";

export interface TrechoResumo {
  texto: string;
  /** Trechos em destaque (nomes de sistemas) aparecem em negrito na tela. */
  destaque?: boolean;
}

export interface SistemaNoResumo {
  sistema: Pick<Sistema, "nome" | "artigo">;
  status: StatusProntidao;
  taxa: number | null;
  problemaPrincipal: { descricao: string; diasAberto: number } | null;
}

export interface EntradaResumo {
  /** Já ordenados do pior para o melhor. */
  sistemas: SistemaNoResumo[];
  taxaSemana: number | null;
  variacaoPontos: number | null;
  aguardandoDecisao: number;
}

const ehPlural = (artigo: Artigo) => artigo.endsWith("s");
const DE: Record<Artigo, string> = { o: "do", a: "da", os: "dos", as: "das" };

function tempoEmAberto(dias: number): string {
  return dias <= 0 ? "em aberto desde hoje" : `em aberto há ${pluralizar(dias, "dia", "dias")}`;
}

/**
 * Gera o resumo da semana em linguagem de negócio a partir dos indicadores.
 * Exemplo: "3 de 5 sistemas estão prontos para publicação. A **Abertura de Conta**
 * está em risco por falha na validação de documentos do cliente, em aberto há 5 dias."
 */
export function gerarResumoSemana(entrada: EntradaResumo): TrechoResumo[] {
  const trechos: TrechoResumo[] = [];
  const t = (texto: string, destaque = false) => trechos.push(destaque ? { texto, destaque } : { texto });

  const total = entrada.sistemas.length;
  const prontos = entrada.sistemas.filter((s) => s.status === "pronto").length;
  if (total === 0) {
    t("Ainda não há sistemas com testes registrados.");
    return trechos;
  }
  if (prontos === total) t(`Todos os ${total} sistemas estão prontos para publicação.`);
  else if (prontos === 0) t(`Nenhum dos ${total} sistemas está pronto para publicação.`);
  else if (prontos === 1) t(`1 de ${total} sistemas está pronto para publicação.`);
  else t(`${prontos} de ${total} sistemas estão prontos para publicação.`);

  for (const s of entrada.sistemas) {
    const { nome, artigo } = s.sistema;
    const plural = ehPlural(artigo);

    if (s.status === "risco") {
      t(` ${maiusculaInicial(artigo)} `);
      t(nome, true);
      if (s.problemaPrincipal) {
        t(
          ` ${plural ? "estão" : "está"} em risco por ${minusculaInicial(s.problemaPrincipal.descricao)}, ${tempoEmAberto(s.problemaPrincipal.diasAberto)}.`,
        );
      } else {
        t(
          ` ${plural ? "estão" : "está"} em risco: ${formatarPercentual(s.taxa)} de sucesso na semana, abaixo do mínimo de ${formatarPercentualCurto(LIMITE_RISCO)}.`,
        );
      }
    } else if (s.status === "atencao") {
      t(` ${maiusculaInicial(artigo)} `);
      t(nome, true);
      if (s.problemaPrincipal) {
        t(` ${plural ? "pedem" : "pede"} atenção: ${minusculaInicial(s.problemaPrincipal.descricao)}.`);
      } else {
        t(
          ` ${plural ? "pedem" : "pede"} atenção: ${formatarPercentual(s.taxa)} de sucesso, abaixo da meta de ${formatarPercentualCurto(META_SUCESSO)}.`,
        );
      }
    } else if (s.status === "sem-dados") {
      t(` Não houve testes ${DE[artigo]} `);
      t(nome, true);
      t(" na semana.");
    }
  }

  if (entrada.taxaSemana !== null) {
    const taxa = formatarPercentual(entrada.taxaSemana);
    const direcao = direcaoDaVariacao(entrada.variacaoPontos);
    if (entrada.variacaoPontos === null) {
      t(` A taxa geral de sucesso foi de ${taxa}.`);
    } else if (direcao === "estavel") {
      t(` A taxa geral de sucesso ficou estável em ${taxa}.`);
    } else {
      const pontos = Math.abs(entrada.variacaoPontos);
      const texto = formatarPontos(pontos).replace("+", "");
      const unidade = Math.round(pontos * 10) / 10 === 1 ? "ponto" : "pontos";
      t(` A taxa geral de sucesso ${direcao} ${texto} ${unidade}, para ${taxa}.`);
    }
  }

  if (entrada.aguardandoDecisao > 0) {
    t(
      entrada.aguardandoDecisao === 1
        ? " 1 problema aguarda decisão da gestão."
        : ` ${entrada.aguardandoDecisao} problemas aguardam decisão da gestão.`,
    );
  }

  return trechos;
}

/** Versão em texto corrido, para copiar e colar em e-mail ou mensagem. */
export function resumoComoTexto(trechos: readonly TrechoResumo[]): string {
  return trechos.map((t) => t.texto).join("").trim();
}
