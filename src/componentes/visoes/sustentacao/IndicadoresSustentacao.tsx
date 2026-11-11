import { Check, Clock, TriangleAlert } from "lucide-react";
import { CartaoIndicador } from "@/componentes/ui/CartaoIndicador";
import type { VisaoSustentacao } from "@/dominio/visoes/sustentacao";
import {
  formatarInteiro,
  formatarPercentual,
  formatarPercentualCurto,
  formatarTempoAtendimento,
  pluralizar,
} from "@/lib/formatacao";
import { contextoContagem } from "./apoio";

export function IndicadoresSustentacao({ visao }: { visao: VisaoSustentacao }) {
  const i = visao.indicadores;
  const comparacao = visao.rotuloComparacao;
  const tempo = i.tempoMedio.ms === null ? null : formatarTempoAtendimento(i.tempoMedio.ms);
  const variacaoTempo =
    i.tempoMedio.ms !== null && i.tempoMedio.anteriorMs
      ? (i.tempoMedio.ms - i.tempoMedio.anteriorMs) / i.tempoMedio.anteriorMs
      : null;
  const reabertura = i.reabertos.taxa;
  const prazo = i.noPrazo.taxa;
  const prazoArredondado = prazo === null ? null : Math.round(prazo * 1000) / 1000;

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <CartaoIndicador
        rotulo="Chamados abertos"
        valor={formatarInteiro(i.abertos.valor)}
        contexto={contextoContagem(i.abertos.variacao, comparacao, false)}
      />
      <CartaoIndicador
        rotulo="Chamados fechados"
        valor={formatarInteiro(i.fechados.valor)}
        contexto={contextoContagem(i.fechados.variacao, comparacao, true)}
      />
      <CartaoIndicador
        rotulo="Chamados reabertos"
        valor={formatarInteiro(i.reabertos.valor)}
        contexto={
          reabertura === null
            ? { texto: "Nenhum fechamento no período", tom: "neutro", Icone: Clock }
            : reabertura <= i.reabertos.meta
              ? {
                  texto: `${formatarPercentual(reabertura)} dos fechamentos · meta até ${formatarPercentualCurto(i.reabertos.meta)}`,
                  tom: "positivo",
                  Icone: Check,
                }
              : {
                  texto: `${formatarPercentual(reabertura)} dos fechamentos · acima da meta de ${formatarPercentualCurto(i.reabertos.meta)}`,
                  tom: "alerta",
                  Icone: TriangleAlert,
                }
        }
      />
      <CartaoIndicador
        rotulo="Em aberto agora"
        valor={formatarInteiro(i.emAberto.valor)}
        valorEmRisco={i.emAberto.criticos > 0}
        contexto={
          i.emAberto.foraDoPrazo > 0
            ? {
                texto: `${pluralizar(i.emAberto.foraDoPrazo, "fora do prazo", "fora do prazo")} · ${pluralizar(i.emAberto.criticos, "crítico", "críticos")}`,
                tom: "alerta",
                Icone: TriangleAlert,
              }
            : { texto: "Todos dentro do prazo", tom: "positivo", Icone: Check }
        }
      />
      <CartaoIndicador
        rotulo="Resolvidos no prazo"
        valor={formatarPercentual(prazo)}
        contexto={
          prazoArredondado === null
            ? { texto: "Nenhum chamado resolvido no período", tom: "neutro", Icone: Clock }
            : prazoArredondado >= i.noPrazo.meta
              ? { texto: `Dentro da meta de ${formatarPercentualCurto(i.noPrazo.meta)}`, tom: "positivo", Icone: Check }
              : { texto: `Abaixo da meta de ${formatarPercentualCurto(i.noPrazo.meta)}`, tom: "alerta", Icone: TriangleAlert }
        }
      />
      <CartaoIndicador
        rotulo="Tempo médio de solução"
        valor={tempo?.valor ?? "—"}
        complemento={tempo?.unidade}
        contexto={
          tempo === null
            ? { texto: "Nenhum chamado resolvido no período", tom: "neutro", Icone: Clock }
            : contextoContagem(variacaoTempo, comparacao, false)
        }
      />
    </dl>
  );
}
