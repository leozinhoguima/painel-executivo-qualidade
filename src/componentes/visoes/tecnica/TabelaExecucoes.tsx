import { Check, CircleX } from "lucide-react";
import type { LinhaExecucao } from "@/dominio/visoes/tecnica";
import { formatarDataHora, formatarDuracao } from "@/lib/formatacao";

function SeloResultado({ resultado }: { resultado: LinhaExecucao["resultado"] }) {
  return resultado === "sucesso" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-ok-fundo px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap text-ok">
      <Check aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
      Sucesso
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-risco-fundo px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap text-risco">
      <CircleX aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
      Falha
    </span>
  );
}

/** Lista técnica de execuções; falhas mostram a mensagem original e a tradução de negócio. */
export function TabelaExecucoes({ linhas }: { linhas: LinhaExecucao[] }) {
  return (
    <div className="relative -mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6" tabIndex={0} aria-labelledby="titulo-execucoes">
      <table className="w-full min-w-[920px] text-left text-[14px]">
        <caption className="sr-only">Execuções de teste, da mais recente para a mais antiga</caption>
        <thead>
          <tr className="border-b border-divisor text-[13px] text-tinta-suave">
            <th scope="col" className="py-2.5 pr-4 font-medium">Data e hora · origem</th>
            <th scope="col" className="py-2.5 pr-4 font-medium">Sistema · funcionalidade</th>
            <th scope="col" className="py-2.5 pr-4 font-medium">Caso de teste</th>
            <th scope="col" className="py-2.5 pr-4 font-medium">Resultado</th>
            <th scope="col" className="py-2.5 pr-4 text-right font-medium">Duração</th>
            <th scope="col" className="py-2.5 font-medium">Mensagem de erro técnica</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divisor align-top">
          {linhas.map((l) => (
            <tr key={l.id} className={l.resultado === "falha" ? "bg-risco-fundo/30" : undefined}>
              <td className="numeros py-3 pr-4 whitespace-nowrap">
                <span className="block">{formatarDataHora(l.instante)}</span>
                <span className={`block text-[12px] ${l.origem === "suite-automatizada" ? "font-medium text-marca" : "text-tinta-suave"}`}>
                  {l.origem === "suite-automatizada" ? "Suíte automatizada" : "Histórico fictício"}
                </span>
              </td>
              <td className="py-3 pr-4">
                <span className="block font-medium">{l.sistemaNome}</span>
                <span className="block text-[12px] text-tinta-suave">{l.funcionalidadeNome}</span>
              </td>
              <td className="max-w-[260px] py-3 pr-4">
                <span className="block">{l.descricaoTecnica}</span>
                <code className="block text-[12px] text-tinta-suave">{l.casoId}</code>
              </td>
              <td className="py-3 pr-4">
                <SeloResultado resultado={l.resultado} />
              </td>
              <td className="numeros py-3 pr-4 text-right whitespace-nowrap">{formatarDuracao(l.duracaoMs)}</td>
              <td className="max-w-[340px] py-3">
                {l.resultado === "falha" ? (
                  <>
                    <code className="block font-mono text-[12px] leading-relaxed break-words text-tinta">
                      {l.erroTecnico ?? "(sem mensagem)"}
                    </code>
                    {l.descricaoNegocio && (
                      <span className="mt-1 block text-[12px] text-tinta-suave">
                        <span className="sr-only">Tradução para o negócio: </span>
                        <span aria-hidden="true">→ </span>
                        {l.descricaoNegocio}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-tinta-suave">
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">Sem erro</span>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
