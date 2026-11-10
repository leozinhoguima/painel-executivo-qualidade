import { ArrowDown, ArrowUp, Check, Clock, Minus, TriangleAlert } from "lucide-react";
import { CartaoIndicador } from "@/componentes/ui/CartaoIndicador";
import type { VisaoGerente } from "@/dominio/visoes/gerente";
import { formatarDecimal, formatarInteiro, formatarPercentual, formatarPontos, pluralizar } from "@/lib/formatacao";

export function IndicadoresGerente({ visao }: { visao: VisaoGerente }) {
  const i = visao.indicadores;
  const comparacao = `vs. ${visao.periodo} dias anteriores`;

  const v = i.variacaoPontos;
  const contextoVariacao =
    v === null
      ? { texto: "Sem período anterior para comparar", tom: "neutro" as const, Icone: Minus }
      : Math.round(v * 10) === 0
        ? { texto: `Estável ${comparacao}`, tom: "neutro" as const, Icone: Minus }
        : {
            texto: `${formatarPontos(v)} ${Math.abs(Math.round(v * 10) / 10) === 1 ? "ponto" : "pontos"} ${comparacao}`,
            tom: v > 0 ? ("positivo" as const) : ("negativo" as const),
            Icone: v > 0 ? ArrowUp : ArrowDown,
          };

  const s = i.porSeveridade;
  const detalheDefeitos = [
    pluralizar(s.critica, "crítico", "críticos"),
    pluralizar(s.alta, "alto", "altos"),
    pluralizar(s.media, "médio", "médios"),
    pluralizar(s.baixa, "baixo", "baixos"),
  ].join(" · ");

  const media = i.tempoMedioCorrecaoDias;

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <CartaoIndicador rotulo="Testes com sucesso" valor={formatarPercentual(i.taxa)} contexto={contextoVariacao} />
      <CartaoIndicador
        rotulo="Testes executados"
        valor={formatarInteiro(i.execucoes)}
        contexto={{ texto: pluralizar(i.rodadas, "execução automática", "execuções automáticas"), tom: "neutro" }}
      />
      <CartaoIndicador
        rotulo="Defeitos em aberto"
        valor={formatarInteiro(i.defeitosAbertos)}
        valorEmRisco={s.critica > 0}
        contexto={{ texto: detalheDefeitos, tom: s.critica > 0 ? "negativo" : "neutro" }}
      />
      <CartaoIndicador
        rotulo="Tempo médio de correção"
        valor={media === null ? "—" : formatarDecimal(media)}
        complemento={media === null ? undefined : "dias"}
        contexto={
          media === null
            ? { texto: "Nenhuma correção no período", tom: "neutro", Icone: Clock }
            : media <= i.metaCorrecaoDias
              ? { texto: `Dentro da meta de ${i.metaCorrecaoDias} dias`, tom: "positivo", Icone: Check }
              : { texto: `Acima da meta de ${i.metaCorrecaoDias} dias`, tom: "alerta", Icone: TriangleAlert }
        }
      />
    </dl>
  );
}
