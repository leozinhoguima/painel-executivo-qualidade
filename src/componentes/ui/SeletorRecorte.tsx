import Link from "next/link";
import { RECORTES, type Recorte } from "@/dominio/regras/periodoSustentacao";

const ROTULO: Record<Recorte, string> = { dia: "Dia", semana: "Semana", mes: "Mês" };

/** Botões agrupados Dia | Semana | Mês. São links (?recorte=…): o recorte fica na URL. */
export function SeletorRecorte({ atual, caminho }: { atual: Recorte; caminho: string }) {
  return (
    <nav aria-label="Recorte de tempo" className="w-fit">
      <ul className="flex overflow-hidden rounded-lg border border-borda bg-cartao">
        {RECORTES.map((recorte) => {
          const ativo = recorte === atual;
          return (
            <li key={recorte} className="border-borda not-first:border-l">
              <Link
                href={`${caminho}?recorte=${recorte}`}
                scroll={false}
                aria-current={ativo ? "true" : undefined}
                className={`flex min-h-11 items-center px-5 text-[14px] whitespace-nowrap ${
                  ativo ? "bg-marinho font-semibold text-white" : "text-tinta-suave hover:bg-neutro-fundo hover:text-tinta"
                }`}
              >
                {ROTULO[recorte]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
