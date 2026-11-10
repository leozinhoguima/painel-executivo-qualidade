import { Download } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SeloDemonstracao } from "@/componentes/ui/Selos";

/** Usuária fictícia da demonstração. */
const USUARIO = { nome: "Marina Costa", area: "Diretoria de Tecnologia", iniciais: "MC" };

interface CabecalhoProps {
  titulo: string;
  subtitulo?: ReactNode;
  /** Exibe o botão de relatório e a usuária (visão executiva). */
  comAcoes?: boolean;
}

export function Cabecalho({ titulo, subtitulo, comAcoes = true }: CabecalhoProps) {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-col gap-2">
        <SeloDemonstracao />
        <h1 className="text-[26px] leading-tight font-semibold tracking-tight sm:text-[28px]">{titulo}</h1>
        {subtitulo && <p className="numeros text-[14px] text-tinta-suave">{subtitulo}</p>}
      </div>

      {comAcoes && (
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/relatorio"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-borda bg-cartao px-4 text-[14px] font-medium text-tinta hover:bg-neutro-fundo"
          >
            <Download aria-hidden="true" className="size-4" />
            Baixar relatório (PDF)
          </Link>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-full bg-marca-clara text-[14px] font-semibold text-marca"
            >
              {USUARIO.iniciais}
            </span>
            <div className="leading-tight">
              <p className="text-[14px] font-semibold">{USUARIO.nome}</p>
              <p className="text-[12px] text-tinta-suave">{USUARIO.area}</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
