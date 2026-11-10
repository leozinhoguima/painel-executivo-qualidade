import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatarInteiro } from "@/lib/formatacao";

interface PaginacaoProps {
  pagina: number;
  totalPaginas: number;
  /** Gera o endereço de uma página, preservando os filtros. */
  endereco: (pagina: number) => string;
}

const BOTAO =
  "inline-flex min-h-11 items-center gap-1 rounded-lg border border-borda bg-cartao px-4 text-[14px] font-medium";

export function Paginacao({ pagina, totalPaginas, endereco }: PaginacaoProps) {
  if (totalPaginas <= 1) return null;
  const anterior = pagina > 1;
  const proxima = pagina < totalPaginas;

  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-4">
      {anterior ? (
        <Link href={endereco(pagina - 1)} className={`${BOTAO} hover:bg-neutro-fundo`} scroll={false}>
          <ChevronLeft aria-hidden="true" className="size-4" />
          Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className={`${BOTAO} text-tinta-suave opacity-50`}>
          <ChevronLeft aria-hidden="true" className="size-4" />
          Anterior
        </span>
      )}
      <span className="numeros text-[14px] text-tinta-suave" aria-current="page">
        Página {formatarInteiro(pagina)} de {formatarInteiro(totalPaginas)}
      </span>
      {proxima ? (
        <Link href={endereco(pagina + 1)} className={`${BOTAO} hover:bg-neutro-fundo`} scroll={false}>
          Próxima
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span aria-disabled="true" className={`${BOTAO} text-tinta-suave opacity-50`}>
          Próxima
          <ChevronRight aria-hidden="true" className="size-4" />
        </span>
      )}
    </nav>
  );
}
