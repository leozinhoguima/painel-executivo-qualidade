import { Check, Clock, TriangleAlert } from "lucide-react";
import { CartaoIndicador } from "@/componentes/ui/CartaoIndicador";
import { contextoVariacao } from "@/componentes/ui/contextoVariacao";
import type { VisaoGerente } from "@/dominio/visoes/gerente";
import { formatarDecimal, formatarInteiro, formatarPercentual, pluralizar } from "@/lib/formatacao";

export function IndicadoresGerente({ visao }: { visao: VisaoGerente }) {
  const i = visao.indicadores;
  const variacao = contextoVariacao(
    i.variacaoPontos,
    `vs. ${visao.periodo} dias anteriores`,
    "Sem período anterior para comparar",
  );

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
      <CartaoIndicador rotulo="Testes com sucesso" valor={formatarPercentual(i.taxa)} contexto={variacao} />
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
