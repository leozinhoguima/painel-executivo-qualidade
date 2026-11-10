import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Cartao } from "@/componentes/ui/Cartao";
import { SeloStatus } from "@/componentes/ui/Selos";
import { DETALHE_REGRA_SEMAFORO, TEXTO_REGRA_SEMAFORO } from "@/dominio/regras/prontidao";
import type { LinhaProntidao } from "@/dominio/visoes/diretor";
import { formatarPercentual } from "@/lib/formatacao";

/** Semáforo por sistema, do pior para o melhor; cada linha leva à visão do gerente. */
export function ListaProntidao({ linhas }: { linhas: LinhaProntidao[] }) {
  return (
    <Cartao
      titulo="Prontidão por sistema"
      idTitulo="titulo-prontidao"
      acessorio={TEXTO_REGRA_SEMAFORO}
      className="h-full"
    >
      <ul className="divide-y divide-divisor border-t border-divisor">
        {linhas.map((linha) => (
          <li key={linha.sistema.id}>
            <Link
              href={`/sistemas/${linha.sistema.id}`}
              className="group -mx-2 flex min-h-[64px] items-center gap-3 rounded-lg px-2 hover:bg-fundo sm:min-h-[76px]"
            >
              <span className="flex-1 text-[15px] font-medium">{linha.sistema.nome}</span>
              <span className="numeros w-16 text-right text-[15px] font-semibold">{formatarPercentual(linha.taxa)}</span>
              <SeloStatus status={linha.status} />
              <ChevronRight aria-hidden="true" className="size-4 text-tinta-suave opacity-50 group-hover:opacity-100" />
              <span className="sr-only">: abrir detalhes do sistema</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[12px] text-tinta-suave">{DETALHE_REGRA_SEMAFORO}</p>
    </Cartao>
  );
}
