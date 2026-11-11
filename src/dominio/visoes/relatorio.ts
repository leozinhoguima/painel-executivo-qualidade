import {
  descreverVariacao,
  descreverVariacaoRelativa,
  formatarDataHora,
  formatarDecimal,
  formatarInteiro,
  formatarIntervaloSemana,
  formatarPercentual,
  formatarPercentualCurto,
  formatarTempoAberto,
  pluralizar,
} from "@/lib/formatacao";
import { noIntervalo } from "../regras/taxa";
import { META_SUCESSO } from "../regras/parametros";
import { DETALHE_REGRA_SEMAFORO, TEXTO_REGRA_SEMAFORO } from "../regras/prontidao";
import { resumoComoTexto } from "../regras/resumo";
import { ROTULO_SEVERIDADE, ROTULO_SITUACAO, ROTULO_STATUS } from "../rotulos";
import type { BaseChamados, BaseQualidade } from "../tipos";
import { montarVisaoDiretor, type VisaoDiretor } from "./diretor";

export interface Relatorio extends VisaoDiretor {
  /** Execuções e rodadas da semana do relatório. */
  execucoesSemana: number;
  rodadasSemana: number;
  /** Texto pronto para colar em e-mail ou mensagem. */
  texto: string;
}

/**
 * Relatório semanal: os mesmos números da visão executiva (mesma função),
 * acrescidos do volume da semana e de uma versão em texto corrido.
 */
export function montarRelatorio(base: BaseQualidade, chamados?: BaseChamados): Relatorio | null {
  const visao = montarVisaoDiretor(base, chamados);
  if (!visao) return null;

  const execs = noIntervalo(base.execucoes, visao.semana.inicio, visao.semana.fim);
  const relatorio = {
    ...visao,
    execucoesSemana: execs.length,
    rodadasSemana: new Set(execs.map((e) => e.rodadaId)).size,
  };
  return { ...relatorio, texto: gerarTextoRelatorio(relatorio) };
}

/** Versão em texto simples, sem formatação, para e-mail ou mensagem. */
export function gerarTextoRelatorio(r: Omit<Relatorio, "texto">): string {
  const i = r.indicadores;
  const variacao = descreverVariacao(i.variacaoPontos, "vs. semana anterior");
  const linhasStatus = [
    i.emAtencao > 0 ? `${i.emAtencao} em atenção` : null,
    i.emRisco > 0 ? `${i.emRisco} em risco` : null,
  ].filter(Boolean);

  const chamadosDaLinha = (n: number | null) => (n === null ? "" : ` · ${pluralizar(n, "chamado", "chamados")}`);

  const correcao =
    i.tempoMedioCorrecaoDias === null
      ? `nenhuma correção nos últimos ${i.janelaCorrecaoDias} dias`
      : `${formatarDecimal(i.tempoMedioCorrecaoDias)} dias (meta: até ${i.metaCorrecaoDias} dias; últimos ${i.janelaCorrecaoDias} dias)`;

  const linhas = [
    `Relatório semanal de qualidade · Semana ${r.semana.numero} (${formatarIntervaloSemana(r.semana)})`,
    "Banco Aurora · ambiente de demonstração com dados fictícios",
    "",
    resumoComoTexto(r.resumo),
    "",
    "Indicadores",
    `• Testes com sucesso: ${formatarPercentual(i.taxaSemana)}${variacao ? ` (${variacao.texto})` : ""}`,
    `• Sistemas prontos: ${i.sistemasProntos} de ${i.totalSistemas}${linhasStatus.length ? ` (${linhasStatus.join(", ")})` : ""}`,
    `• Falhas críticas em aberto: ${i.falhasCriticasAbertas}`,
    `• Tempo médio de correção: ${correcao}`,
    "",
    "Prontidão por sistema",
    ...r.prontidao.map(
      (l) => `• ${l.sistema.nome}: ${formatarPercentual(l.taxa)} · ${ROTULO_STATUS[l.status]}${chamadosDaLinha(l.chamadosSemana)}`,
    ),
    "",
  ];

  if (r.problemas.length > 0) {
    linhas.push("Principais problemas");
    r.problemas.forEach((p, n) => {
      const detalhes = [
        p.sistemaNome,
        `severidade ${ROTULO_SEVERIDADE[p.severidade].toLowerCase()}`,
        formatarTempoAberto(p.diasAberto).toLowerCase(),
      ];
      if (p.situacao === "aguardando-decisao") detalhes.push(ROTULO_SITUACAO[p.situacao].toLowerCase());
      if (p.chamados) detalhes.push(`${pluralizar(p.chamados, "chamado", "chamados")} de clientes`);
      linhas.push(`${n + 1}. ${p.titulo} (${detalhes.join(" · ")})`);
    });
    linhas.push("");
  } else {
    linhas.push("Nenhum problema em aberto.", "");
  }

  const s = r.sustentacao;
  if (s) {
    const variacaoChamados = descreverVariacaoRelativa(s.variacao, "vs. semana anterior");
    linhas.push(
      "Sustentação (chamados de clientes)",
      `• Abertos: ${formatarInteiro(s.abertos)}${variacaoChamados ? ` (${variacaoChamados.texto})` : ""}`,
      `• Fechados: ${formatarInteiro(s.fechados)}`,
      `• Em aberto agora: ${formatarInteiro(s.emAberto)} (${formatarInteiro(s.foraDoPrazo)} fora do prazo)`,
      `• Resolvidos no prazo: ${formatarPercentual(s.noPrazo.taxa)} (meta: ${formatarPercentualCurto(s.noPrazo.meta)})`,
      ...s.motivos.map((m, n) => `${n + 1}. ${m.motivo} (${m.sistema.nome} · ${pluralizar(m.quantidade, "chamado", "chamados")})`),
      "",
    );
  }

  linhas.push(
    `Regra: ${TEXTO_REGRA_SEMAFORO}. ${DETALHE_REGRA_SEMAFORO} Meta de sucesso: ${formatarPercentualCurto(META_SUCESSO)}.`,
    `Base: ${pluralizar(r.execucoesSemana, "execução", "execuções")} em ${pluralizar(r.rodadasSemana, "rodada automática", "rodadas automáticas")}; última em ${formatarDataHora(r.ultimaRodada.instante)}.`,
  );

  return linhas.join("\n");
}
