import { Cartao } from "@/componentes/ui/Cartao";
import { TextoStatus } from "@/componentes/ui/Selos";
import type { StatusProntidao } from "@/dominio/tipos";
import type { LinhaFuncionalidade } from "@/dominio/visoes/gerente";
import { formatarPercentual } from "@/lib/formatacao";

const COR_BARRA: Record<StatusProntidao, string> = {
  pronto: "bg-ok",
  atencao: "bg-alerta",
  risco: "bg-risco",
  "sem-dados": "bg-borda",
};

/**
 * Uma linha por funcionalidade: nome, barra na cor do status, percentual e status.
 * No celular: nome, percentual e status na primeira linha; barra embaixo.
 */
export function SucessoPorFuncionalidade({ linhas }: { linhas: LinhaFuncionalidade[] }) {
  return (
    <Cartao
      titulo="Sucesso por funcionalidade"
      idTitulo="titulo-funcionalidades"
      acessorio="Ordenado do pior para o melhor · o status também considera os defeitos em aberto"
    >
      <ul className="divide-y divide-divisor border-t border-divisor">
        {linhas.map((l) => (
          <li
            key={l.funcionalidade.id}
            className="grid gap-2 py-3 md:grid-cols-[minmax(180px,240px)_1fr_64px_104px] md:items-center md:gap-x-6"
          >
            <div className="flex items-center justify-between gap-3 md:contents">
              <span className="text-[15px] font-medium md:order-1">{l.funcionalidade.nome}</span>
              <span className="flex shrink-0 items-center gap-3 md:contents">
                <span className="numeros text-[15px] font-semibold md:order-3 md:text-right">
                  {formatarPercentual(l.taxa)}
                </span>
                <span className="md:order-4">
                  <TextoStatus status={l.status} />
                </span>
              </span>
            </div>
            <span aria-hidden="true" className="block h-2 overflow-hidden rounded-full bg-divisor md:order-2">
              <span
                className={`block h-full rounded-full ${COR_BARRA[l.status]}`}
                style={{ width: `${l.taxa === null ? 0 : Math.max(1, l.taxa * 100)}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </Cartao>
  );
}
