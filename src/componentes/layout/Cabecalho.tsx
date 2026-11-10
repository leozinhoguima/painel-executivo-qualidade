import { ChevronLeft, Download } from "lucide-react";
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
  /** Link de retorno exibido acima do título (ex.: "‹ Visão executiva"). */
  voltar?: { href: string; rotulo: string };
  /** Elemento ao lado do título (ex.: selo de status do sistema). */
  aoLadoDoTitulo?: ReactNode;
  /** Controles à direita (ex.: seletor de período), no lugar das ações padrão. */
  controles?: ReactNode;
}

export function Cabecalho({ titulo, subtitulo, comAcoes = true, voltar, aoLadoDoTitulo, controles }: CabecalhoProps) {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-2">
        {voltar && (
          <Link
            href={voltar.href}
            className="-ml-1 inline-flex min-h-11 w-fit items-center gap-1 px-1 text-[14px] font-medium text-marca hover:underline md:min-h-0"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            {voltar.rotulo}
          </Link>
        )}
        <SeloDemonstracao />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight sm:text-[28px]">{titulo}</h1>
          {aoLadoDoTitulo}
        </div>
        {subtitulo && <p className="numeros text-[14px] text-tinta-suave">{subtitulo}</p>}
      </div>

      {controles}

      {comAcoes && !controles && (
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
