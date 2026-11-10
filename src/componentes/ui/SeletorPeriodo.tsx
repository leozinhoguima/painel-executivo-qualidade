import Link from "next/link";
import { PERIODOS, type PeriodoDias } from "@/dominio/regras/periodo";

/**
 * Botões agrupados de período (7, 30, 90 dias). São links (?periodo=N):
 * o recorte fica na URL e pode ser compartilhado.
 */
export function SeletorPeriodo({ atual, caminho }: { atual: PeriodoDias; caminho: string }) {
  return (
    <nav aria-label="Período de análise" className="w-fit">
      <ul className="flex overflow-hidden rounded-lg border border-borda bg-cartao">
        {PERIODOS.map((dias) => {
          const ativo = dias === atual;
          return (
            <li key={dias} className="border-borda not-first:border-l">
              <Link
                href={`${caminho}?periodo=${dias}`}
                scroll={false}
                aria-current={ativo ? "true" : undefined}
                className={`numeros flex min-h-11 items-center px-4 text-[14px] whitespace-nowrap ${
                  ativo ? "bg-marinho font-semibold text-white" : "text-tinta-suave hover:bg-neutro-fundo hover:text-tinta"
                }`}
              >
                {dias} dias
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
