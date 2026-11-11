import { Check, CircleDot, RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { SeloSeveridade } from "@/componentes/ui/Selos";
import { ROTULO_CANAL, ROTULO_CATEGORIA } from "@/dominio/rotulos";
import type { LinhaChamado } from "@/dominio/visoes/listaChamados";
import { formatarDataHora, formatarTempoAtendimento } from "@/lib/formatacao";

function tempo(ms: number) {
  const t = formatarTempoAtendimento(ms);
  return `${t.valor} ${t.unidade}`;
}

function Situacao({ linha }: { linha: LinhaChamado }) {
  if (linha.situacao === "em-aberto") {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold ${linha.foraDoPrazo ? "text-alerta" : "text-marca"}`}>
        {linha.foraDoPrazo ? (
          <TriangleAlert aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
        ) : (
          <CircleDot aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
        )}
        {linha.foraDoPrazo ? "Em aberto · fora do prazo" : "Em aberto"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-tinta">
      <Check aria-hidden="true" className="size-3.5 text-ok" strokeWidth={2.25} />
      Fechado
    </span>
  );
}

/** Um chamado por linha, do mais recente para o mais antigo. */
export function TabelaChamados({ linhas }: { linhas: LinhaChamado[] }) {
  return (
    <div className="relative -mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6" tabIndex={0} aria-labelledby="titulo-chamados">
      <table className="w-full min-w-[960px] text-left text-[14px]">
        <caption className="sr-only">Chamados, do mais recente para o mais antigo</caption>
        <thead>
          <tr className="border-b border-divisor text-[13px] text-tinta-suave">
            <th scope="col" className="py-2.5 pr-4 font-medium">Chamado</th>
            <th scope="col" className="py-2.5 pr-4 font-medium">Problema</th>
            <th scope="col" className="py-2.5 pr-4 font-medium">Prioridade</th>
            <th scope="col" className="py-2.5 pr-4 font-medium">Situação</th>
            <th scope="col" className="py-2.5 pr-4 text-right font-medium">Tempo de solução</th>
            <th scope="col" className="py-2.5 font-medium">Defeito ligado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divisor">
          {linhas.map((l) => (
            <tr key={l.codigo} className="align-top">
              <td className="py-3 pr-4 whitespace-nowrap">
                <span className="numeros block font-medium">{l.codigo}</span>
                <span className="numeros block text-[12px] text-tinta-suave">{formatarDataHora(l.abertura)}</span>
                <span className="block text-[12px] text-tinta-suave">{ROTULO_CANAL[l.canal]}</span>
              </td>
              <td className="py-3 pr-4">
                <span className="block font-medium">{l.motivo}</span>
                <span className="block text-[12px] text-tinta-suave">
                  {l.sistemaNome}
                  {l.funcionalidadeNome ? ` · ${l.funcionalidadeNome}` : ""} · {ROTULO_CATEGORIA[l.categoria]}
                </span>
              </td>
              <td className="py-3 pr-4">
                <SeloSeveridade severidade={l.prioridade} />
              </td>
              <td className="py-3 pr-4 whitespace-nowrap">
                <Situacao linha={l} />
                {l.reaberto && (
                  <span className="mt-0.5 flex items-center gap-1 text-[12px] text-tinta-suave">
                    <RotateCcw aria-hidden="true" className="size-3" />
                    Já foi reaberto
                  </span>
                )}
              </td>
              <td className="numeros py-3 pr-4 text-right whitespace-nowrap">
                {l.tempoSolucaoMs !== null ? (
                  <>
                    <span className="block">{tempo(l.tempoSolucaoMs)}</span>
                    <span className={`block text-[12px] ${l.resolvidoNoPrazo ? "text-ok" : "text-alerta"}`}>
                      {l.resolvidoNoPrazo ? "No prazo" : "Fora do prazo"}
                    </span>
                  </>
                ) : (
                  <span className="text-tinta-suave">Aberto há {tempo(l.tempoEmAbertoMs ?? 0)}</span>
                )}
              </td>
              <td className="numeros py-3 whitespace-nowrap">
                {l.defeito ? (
                  <Link href={`/sistemas/${l.sistemaId}`} className="font-medium text-marca hover:underline">
                    {l.defeito}
                    <span className="sr-only">: ver no sistema</span>
                  </Link>
                ) : (
                  <span className="text-tinta-suave">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
