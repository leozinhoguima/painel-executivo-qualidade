import Link from "next/link";
import { Cartao } from "@/componentes/ui/Cartao";
import { ROTULO_SITUACAO, SeloSeveridade } from "@/componentes/ui/Selos";
import type { LinhaDefeito } from "@/dominio/visoes/gerente";
import { pluralizar } from "@/lib/formatacao";

/**
 * Defeitos em aberto do sistema na data da última execução.
 * A funcionalidade leva às falhas dela na visão técnica (mesmo período).
 */
export function TabelaDefeitos({
  defeitos,
  sistemaId,
  periodo,
}: {
  defeitos: LinhaDefeito[];
  sistemaId: string;
  periodo: number;
}) {
  return (
    <Cartao titulo="Defeitos em aberto" idTitulo="titulo-defeitos">
      {defeitos.length === 0 ? (
        <p className="border-t border-divisor pt-4 text-[15px] text-tinta-suave">
          Nenhum defeito em aberto neste sistema.
        </p>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6" tabIndex={0} aria-labelledby="titulo-defeitos">
          <table className="w-full min-w-[680px] text-left text-[14px]">
            <caption className="sr-only">Defeitos em aberto, do mais grave para o menos grave</caption>
            <thead>
              <tr className="border-b border-divisor text-[13px] text-tinta-suave">
                <th scope="col" className="py-2.5 pr-4 font-medium">Código</th>
                <th scope="col" className="py-2.5 pr-4 font-medium">Problema</th>
                <th scope="col" className="py-2.5 pr-4 font-medium">Severidade</th>
                <th scope="col" className="py-2.5 pr-4 font-medium">Situação</th>
                <th scope="col" className="py-2.5 text-right font-medium">Aberto há</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divisor">
              {defeitos.map((d) => (
                <tr key={d.codigo}>
                  <td className="numeros py-3 pr-4 whitespace-nowrap text-tinta-suave">{d.codigo}</td>
                  <td className="py-3 pr-4">
                    <span className="block font-medium">{d.titulo}</span>
                    <Link
                      href={`/execucoes?periodo=${periodo}&sistema=${sistemaId}&funcionalidade=${d.funcionalidadeId}&resultado=falha`}
                      className="text-[12px] text-marca hover:underline"
                    >
                      {d.funcionalidadeNome}
                      <span className="sr-only">: ver falhas na visão técnica</span>
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <SeloSeveridade severidade={d.severidade} />
                  </td>
                  <td className="py-3 pr-4">
                    <span className={d.situacao === "aguardando-decisao" ? "font-semibold" : undefined}>
                      {ROTULO_SITUACAO[d.situacao]}
                    </span>
                    {d.responsavel && <span className="block text-[12px] text-tinta-suave">{d.responsavel}</span>}
                  </td>
                  <td className="numeros py-3 text-right whitespace-nowrap">
                    {d.diasAberto <= 0 ? "Menos de 1 dia" : pluralizar(d.diasAberto, "dia", "dias")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Cartao>
  );
}
