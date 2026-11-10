import { ArrowDown, ArrowUp, Check, CircleX, Clock, Minus, TriangleAlert } from "lucide-react";
import { CartaoIndicador } from "@/componentes/ui/CartaoIndicador";
import type { VisaoDiretor } from "@/dominio/visoes/diretor";
import {
  formatarDecimal,
  formatarInteiro,
  formatarPercentual,
  formatarPontos,
  formatarTempoAberto,
} from "@/lib/formatacao";

export function IndicadoresDiretor({ indicadores: i }: { indicadores: VisaoDiretor["indicadores"] }) {
  const variacao = i.variacaoPontos;
  const contextoVariacao =
    variacao === null
      ? { texto: "Sem semana anterior para comparar", tom: "neutro" as const, Icone: Minus }
      : Math.round(variacao * 10) === 0
        ? { texto: "Estável vs. semana anterior", tom: "neutro" as const, Icone: Minus }
        : {
            texto: `${formatarPontos(variacao)} ${Math.abs(Math.round(variacao * 10) / 10) === 1 ? "ponto" : "pontos"} vs. semana anterior`,
            tom: variacao > 0 ? ("positivo" as const) : ("negativo" as const),
            Icone: variacao > 0 ? ArrowUp : ArrowDown,
          };

  const partesProntos = [
    i.emAtencao > 0 ? `${i.emAtencao} em atenção` : null,
    i.emRisco > 0 ? `${i.emRisco} em risco` : null,
  ].filter(Boolean);

  const dentroDaMeta = i.tempoMedioCorrecaoDias !== null && i.tempoMedioCorrecaoDias <= i.metaCorrecaoDias;

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <CartaoIndicador
        rotulo="Testes com sucesso"
        valor={formatarPercentual(i.taxaSemana)}
        contexto={contextoVariacao}
      />
      <CartaoIndicador
        rotulo="Sistemas prontos"
        valor={formatarInteiro(i.sistemasProntos)}
        complemento={`de ${i.totalSistemas}`}
        contexto={
          partesProntos.length
            ? { texto: partesProntos.join(" · "), tom: "neutro" }
            : { texto: "Todos prontos para publicação", tom: "positivo", Icone: Check }
        }
      />
      <CartaoIndicador
        rotulo="Falhas críticas em aberto"
        valor={formatarInteiro(i.falhasCriticasAbertas)}
        valorEmRisco={i.falhasCriticasAbertas > 0}
        contexto={
          i.falhasCriticasAbertas > 0 && i.diasCriticaMaisAntiga !== null
            ? {
                texto:
                  i.falhasCriticasAbertas === 1
                    ? formatarTempoAberto(i.diasCriticaMaisAntiga)
                    : `A mais antiga: ${formatarTempoAberto(i.diasCriticaMaisAntiga).toLowerCase()}`,
                tom: "negativo",
                Icone: CircleX,
              }
            : { texto: "Nenhuma falha crítica", tom: "positivo", Icone: Check }
        }
      />
      <CartaoIndicador
        rotulo="Tempo médio de correção"
        valor={i.tempoMedioCorrecaoDias === null ? "—" : formatarDecimal(i.tempoMedioCorrecaoDias)}
        complemento={i.tempoMedioCorrecaoDias === null ? undefined : "dias"}
        contexto={
          i.tempoMedioCorrecaoDias === null
            ? { texto: `Nenhuma correção nos últimos ${i.janelaCorrecaoDias} dias`, tom: "neutro", Icone: Clock }
            : dentroDaMeta
              ? { texto: `Meta: até ${i.metaCorrecaoDias} dias · últimos ${i.janelaCorrecaoDias} dias`, tom: "positivo", Icone: Check }
              : { texto: `Acima da meta de ${i.metaCorrecaoDias} dias · últimos ${i.janelaCorrecaoDias} dias`, tom: "alerta", Icone: TriangleAlert }
        }
      />
    </dl>
  );
}
