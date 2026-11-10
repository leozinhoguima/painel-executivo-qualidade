import { GraficoTendencia, type PontoGrafico } from "@/componentes/graficos/GraficoTendencia";
import { Cartao } from "@/componentes/ui/Cartao";
import { formatarInteiro, formatarPercentual, formatarPercentualCurto } from "@/lib/formatacao";

interface CartaoTendenciaProps {
  pontos: PontoGrafico[];
  meta: number;
}

/** Tendência semanal com descrição textual e tabela equivalente para leitores de tela. */
export function CartaoTendencia({ pontos, meta }: CartaoTendenciaProps) {
  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];
  const descricao =
    primeiro && ultimo
      ? `Taxa de sucesso semanal de todos os sistemas: ${formatarPercentual(primeiro.taxa)} na semana ${primeiro.rotulo.slice(1)} e ${formatarPercentual(ultimo.taxa)} na semana ${ultimo.rotulo.slice(1)}. Meta de ${formatarPercentualCurto(meta)}.`
      : "Sem dados de tendência.";

  return (
    <Cartao titulo="Tendência de sucesso" idTitulo="titulo-tendencia" className="h-full">
      <p className="-mt-2 text-[13px] text-tinta-suave">
        Últimas {pontos.length} semanas · todos os sistemas
      </p>

      <figure className="mt-4">
        <div className="numeros mb-1 flex justify-between text-[13px]" aria-hidden="true">
          <span className="text-tinta-suave">{formatarPercentual(primeiro?.taxa ?? null)}</span>
          <span className="font-semibold">{formatarPercentual(ultimo?.taxa ?? null)}</span>
        </div>
        <GraficoTendencia pontos={pontos} meta={meta} />
        <figcaption className="mt-3 flex items-center gap-2 text-[12px] text-ok">
          <svg aria-hidden="true" width="18" height="2" className="shrink-0">
            <line x1="0" y1="1" x2="18" y2="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          Linha tracejada: meta de {formatarPercentualCurto(meta)}
          <span className="sr-only">. {descricao}</span>
        </figcaption>
      </figure>

      <table className="sr-only">
        <caption>Taxa de sucesso por semana</caption>
        <thead>
          <tr>
            <th scope="col">Semana</th>
            <th scope="col">Taxa de sucesso</th>
            <th scope="col">Testes executados</th>
          </tr>
        </thead>
        <tbody>
          {pontos.map((p) => (
            <tr key={p.rotulo}>
              <th scope="row">{p.rotulo}</th>
              <td>{formatarPercentual(p.taxa)}</td>
              <td>{formatarInteiro(p.execucoes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Cartao>
  );
}
