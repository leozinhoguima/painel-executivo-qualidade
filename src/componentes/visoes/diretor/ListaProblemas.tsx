import { Cartao } from "@/componentes/ui/Cartao";
import { SeloSeveridade } from "@/componentes/ui/Selos";
import { ROTULO_SITUACAO } from "@/dominio/rotulos";
import type { ProblemaPrincipal } from "@/dominio/visoes/diretor";
import { formatarTempoAberto, pluralizar } from "@/lib/formatacao";

/** Os principais problemas em aberto, em linguagem de negócio. */
export function ListaProblemas({ problemas }: { problemas: ProblemaPrincipal[] }) {
  return (
    <Cartao titulo="Principais problemas" idTitulo="titulo-problemas">
      {problemas.length === 0 ? (
        <p className="border-t border-divisor pt-4 text-[15px] text-tinta-suave">
          Nenhum problema em aberto. Todos os defeitos identificados pelos testes foram corrigidos.
        </p>
      ) : (
        <ol className="divide-y divide-divisor border-t border-divisor">
          {problemas.map((p, i) => (
            <li key={p.codigo} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex flex-1 items-start gap-4">
                <span
                  aria-hidden="true"
                  className="numeros mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-neutro-fundo text-[13px] font-semibold"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-medium">{p.titulo}</p>
                  <p className="text-[13px] text-tinta-suave">
                    {p.sistemaNome} · {p.impacto}
                    {p.chamados ? (
                      <span className="numeros"> · {pluralizar(p.chamados, "chamado de cliente", "chamados de clientes")}</span>
                    ) : null}
                    {p.situacao === "aguardando-decisao" && (
                      <span className="font-semibold text-tinta"> · {ROTULO_SITUACAO[p.situacao]}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 pl-11 sm:pl-0">
                <SeloSeveridade severidade={p.severidade} />
                <span className="numeros w-32 text-[13px] text-tinta-suave sm:text-right">
                  {formatarTempoAberto(p.diasAberto)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Cartao>
  );
}
