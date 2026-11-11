import { SeloSeveridade, SeloStatus, SeloDemonstracao } from "@/componentes/ui/Selos";
import { META_SUCESSO } from "@/dominio/regras/parametros";
import { DETALHE_REGRA_SEMAFORO, TEXTO_REGRA_SEMAFORO } from "@/dominio/regras/prontidao";
import { ROTULO_SITUACAO } from "@/dominio/rotulos";
import type { Relatorio } from "@/dominio/visoes/relatorio";
import {
  descreverVariacao,
  descreverVariacaoRelativa,
  formatarDataHora,
  formatarDecimal,
  formatarInteiro,
  formatarPercentual,
  formatarPercentualCurto,
  formatarSemana,
  formatarTempoAberto,
  pluralizar,
} from "@/lib/formatacao";

function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe: string }) {
  return (
    <div className="rounded-lg border border-borda px-4 py-3 print:px-3 print:py-2">
      <dt className="text-[12px] text-tinta-suave">{rotulo}</dt>
      <dd>
        <p className="numeros text-[24px] leading-tight font-semibold">{valor}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-tinta-suave">{detalhe}</p>
      </dd>
    </div>
  );
}

function SustentacaoNaFolha({ s }: { s: NonNullable<Relatorio["sustentacao"]> }) {
  const variacao = descreverVariacaoRelativa(s.variacao, "vs. anterior");
  // Rótulos curtos: a seção precisa caber na mesma folha A4.
  const numeros = [
    { rotulo: "Abertos", valor: formatarInteiro(s.abertos), detalhe: variacao?.texto ?? "sem base" },
    { rotulo: "Fechados", valor: formatarInteiro(s.fechados), detalhe: "na semana" },
    {
      rotulo: "Em aberto",
      valor: formatarInteiro(s.emAberto),
      detalhe: `${formatarInteiro(s.foraDoPrazo)} fora do prazo`,
    },
    {
      rotulo: "No prazo",
      valor: formatarPercentual(s.noPrazo.taxa),
      detalhe: `meta ${formatarPercentualCurto(s.noPrazo.meta)}`,
    },
  ];
  return (
    <section aria-labelledby="rel-sustentacao">
      <h3 id="rel-sustentacao" className={TITULO_SECAO}>
        Sustentação · chamados de clientes
      </h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4 print:grid-cols-4">
        {numeros.map((n) => (
          <div key={n.rotulo}>
            <dt className="text-[11px] text-tinta-suave">{n.rotulo}</dt>
            <dd className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="numeros text-[18px] leading-tight font-semibold">{n.valor}</span>
              <span className="numeros text-[11px] leading-snug text-tinta-suave">{n.detalhe}</span>
            </dd>
          </div>
        ))}
      </dl>
      {s.motivos.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] text-tinta-suave">Principais motivos</p>
          <ol className="mt-0.5 grid grid-cols-1 gap-x-4 gap-y-0.5 text-[12px] leading-snug sm:grid-cols-3 print:grid-cols-3">
            {s.motivos.map((m, n) => (
              <li key={`${m.sistema.nome}-${m.motivo}`} className="flex gap-1.5">
                <span className="numeros shrink-0 font-semibold">{n + 1}.</span>
                <span className="min-w-0">
                  {m.motivo}{" "}
                  <span className="numeros text-tinta-suave">
                    · {m.sistema.nome} · {formatarInteiro(m.quantidade)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

const TITULO_SECAO = "mb-2 print:mb-1 text-[13px] font-semibold tracking-[0.06em] text-tinta-suave uppercase";

/**
 * Relatório de uma folha (A4). O mesmo layout serve para a tela e para a impressão,
 * com tons claros que imprimem bem em qualquer impressora.
 */
export function FolhaRelatorio({ relatorio: r }: { relatorio: Relatorio }) {
  const i = r.indicadores;
  const variacao = descreverVariacao(i.variacaoPontos, "vs. semana anterior");
  const maxTendencia = Math.max(META_SUCESSO, ...r.tendencia.map((p) => p.taxa ?? 0));
  const minTendencia = Math.min(META_SUCESSO, ...r.tendencia.map((p) => p.taxa ?? 1)) - 0.03;
  const temChamados = r.sustentacao !== null;

  return (
    <article
      aria-labelledby="titulo-relatorio"
      className="flex flex-col gap-5 rounded-cartao border border-borda bg-cartao p-6 sm:p-8 print:gap-2 print:rounded-none print:border-0 print:p-0"
    >
      <header className="flex flex-col gap-3 border-b border-borda pb-4 sm:flex-row sm:items-start sm:justify-between print:flex-row print:pb-3">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.06em] text-marca uppercase">Banco Aurora · Qualidade</p>
          <h2 id="titulo-relatorio" className="mt-1 text-[22px] leading-tight font-semibold">
            Relatório semanal de qualidade
          </h2>
          <p className="numeros mt-1 text-[14px] text-tinta-suave">{formatarSemana(r.semana)}</p>
        </div>
        <div className="flex flex-col gap-1.5 sm:items-end print:items-end">
          <SeloDemonstracao />
          <p className="numeros text-[12px] text-tinta-suave">
            Última execução: {formatarDataHora(r.ultimaRodada.instante)}
          </p>
        </div>
      </header>

      <section
        aria-labelledby="rel-resumo"
        className="rounded-lg border-l-4 border-marca bg-marca-clara px-5 py-4 print:py-3"
      >
        <h3 id="rel-resumo" className="text-[12px] font-semibold tracking-[0.06em] text-marca uppercase">
          Resumo da semana
        </h3>
        <p className="mt-1.5 text-[16px] leading-relaxed print:text-[14px] print:leading-snug">
          {r.resumo.map((t, n) => (t.destaque ? <strong key={n}>{t.texto}</strong> : <span key={n}>{t.texto}</span>))}
        </p>
      </section>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4 print:grid-cols-4">
        <Indicador
          rotulo="Testes com sucesso"
          valor={formatarPercentual(i.taxaSemana)}
          detalhe={variacao?.texto ?? "Sem semana anterior para comparar"}
        />
        <Indicador
          rotulo="Sistemas prontos"
          valor={`${i.sistemasProntos} de ${i.totalSistemas}`}
          detalhe={
            [i.emAtencao && `${i.emAtencao} em atenção`, i.emRisco && `${i.emRisco} em risco`]
              .filter(Boolean)
              .join(" · ") || "Todos prontos"
          }
        />
        <Indicador
          rotulo="Falhas críticas em aberto"
          valor={formatarInteiro(i.falhasCriticasAbertas)}
          detalhe={
            i.diasCriticaMaisAntiga === null
              ? "Nenhuma falha crítica"
              : `Mais antiga: ${formatarTempoAberto(i.diasCriticaMaisAntiga).toLowerCase()}`
          }
        />
        <Indicador
          rotulo="Tempo médio de correção"
          valor={i.tempoMedioCorrecaoDias === null ? "—" : `${formatarDecimal(i.tempoMedioCorrecaoDias)} dias`}
          detalhe={`Meta: até ${i.metaCorrecaoDias} dias · últimos ${i.janelaCorrecaoDias} dias`}
        />
      </dl>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] print:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="rel-prontidao">
          <h3 id="rel-prontidao" className={TITULO_SECAO}>
            Prontidão por sistema
          </h3>
          <div className="relative overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-borda text-[12px] text-tinta-suave">
                  <th scope="col" className="py-1.5 pr-2 font-medium">
                    Sistema
                  </th>
                  <th scope="col" className="py-1.5 pr-2 text-right font-medium">
                    Sucesso
                  </th>
                  <th scope="col" className="py-1.5 pr-2 text-right font-medium">
                    Defeitos
                  </th>
                  {temChamados && (
                    <th scope="col" className="py-1.5 pr-2 text-right font-medium">
                      Chamados
                    </th>
                  )}
                  <th scope="col" className="py-1.5 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divisor">
                {r.prontidao.map((l) => (
                  <tr key={l.sistema.id}>
                    <td className="py-1.5 pr-2">
                      <span className="block font-medium">{l.sistema.nome}</span>
                      <span className="block text-[11px] text-tinta-suave print:hidden">{l.sistema.area}</span>
                    </td>
                    <td className="numeros py-1.5 pr-2 text-right font-semibold">{formatarPercentual(l.taxa)}</td>
                    <td className="numeros py-1.5 pr-2 text-right">{formatarInteiro(l.defeitosAbertos)}</td>
                    {temChamados && (
                      <td className="numeros py-1.5 pr-2 text-right">{formatarInteiro(l.chamadosSemana ?? 0)}</td>
                    )}
                    <td className="py-1.5">
                      <SeloStatus status={l.status} compacto />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="rel-tendencia">
          <h3 id="rel-tendencia" className={TITULO_SECAO}>
            Tendência de sucesso
          </h3>
          <ul className="flex flex-col gap-1.5">
            {r.tendencia.map((p) => {
              const largura = p.taxa === null ? 0 : ((p.taxa - minTendencia) / (maxTendencia - minTendencia)) * 100;
              return (
                <li key={p.rotulo} className="grid grid-cols-[36px_1fr_52px] items-center gap-2 text-[12px]">
                  <span className="text-tinta-suave">{p.rotulo}</span>
                  <span aria-hidden="true" className="relative block h-2.5 rounded-sm bg-divisor">
                    <span
                      className="absolute inset-y-0 left-0 rounded-sm bg-marca"
                      style={{ width: `${Math.max(2, largura)}%` }}
                    />
                    <span
                      className="absolute -inset-y-0.5 w-0 border-l-2 border-dashed border-ok"
                      style={{ left: `${((META_SUCESSO - minTendencia) / (maxTendencia - minTendencia)) * 100}%` }}
                    />
                  </span>
                  <span className="numeros text-right font-semibold">{formatarPercentual(p.taxa)}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11px] text-ok">Linha tracejada: meta de {formatarPercentualCurto(META_SUCESSO)}</p>
        </section>
      </div>

      <section aria-labelledby="rel-problemas">
        <h3 id="rel-problemas" className={TITULO_SECAO}>
          Principais problemas
        </h3>
        {r.problemas.length === 0 ? (
          <p className="text-[13px] text-tinta-suave">Nenhum problema em aberto.</p>
        ) : (
          <ol className="divide-y divide-divisor border-t border-divisor">
            {r.problemas.map((p, n) => (
              <li key={p.codigo} className="flex items-start gap-3 py-2 print:py-1.5">
                <span className="numeros w-4 shrink-0 text-[13px] font-semibold">{n + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">{p.titulo}</p>
                  <p className="text-[12px] text-tinta-suave">
                    {p.sistemaNome} · {p.impacto}
                    {p.chamados ? (
                      <span className="numeros"> · {pluralizar(p.chamados, "chamado", "chamados")}</span>
                    ) : null}
                    {p.situacao === "aguardando-decisao" && (
                      <strong className="text-tinta"> · {ROTULO_SITUACAO[p.situacao]}</strong>
                    )}
                  </p>
                </div>
                <SeloSeveridade severidade={p.severidade} />
                <span className="numeros w-28 shrink-0 text-right text-[12px] text-tinta-suave">
                  {formatarTempoAberto(p.diasAberto)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {r.sustentacao && <SustentacaoNaFolha s={r.sustentacao} />}

      <footer className="border-t border-borda pt-3 text-[11px] leading-relaxed text-tinta-suave print:pt-2 print:leading-snug">
        <p>
          <strong className="font-semibold">Como ler:</strong> {TEXTO_REGRA_SEMAFORO}. {DETALHE_REGRA_SEMAFORO} Taxa de
          sucesso = testes com sucesso ÷ testes executados na semana.
        </p>
        <p className="numeros">
          Base: {pluralizar(r.execucoesSemana, "execução", "execuções")} em{" "}
          {pluralizar(r.rodadasSemana, "rodada automática", "rodadas automáticas")}. Banco Aurora, sistemas e números
          fictícios.
        </p>
      </footer>
    </article>
  );
}
