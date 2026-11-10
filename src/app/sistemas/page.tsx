import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Cabecalho } from "@/componentes/layout/Cabecalho";
import { Cartao } from "@/componentes/ui/Cartao";
import { EstadoVazio } from "@/componentes/ui/Estados";
import { SeloStatus } from "@/componentes/ui/Selos";
import { carregarBase } from "@/dados/repositorio";
import { TEXTO_REGRA_SEMAFORO } from "@/dominio/regras/prontidao";
import { montarVisaoDiretor } from "@/dominio/visoes/diretor";
import { formatarPercentual, formatarSemana, pluralizar } from "@/lib/formatacao";

export const metadata: Metadata = { title: "Sistemas" };

/** Índice dos sistemas: o mesmo semáforo da visão executiva, com a área responsável. */
export default function Sistemas() {
  const visao = montarVisaoDiretor(carregarBase());

  if (!visao) {
    return (
      <>
        <Cabecalho titulo="Sistemas" comAcoes={false} />
        <EstadoVazio
          titulo="Ainda não há execuções de teste"
          descricao="A lista de sistemas aparece assim que a primeira rodada automática for importada."
        />
      </>
    );
  }

  return (
    <>
      <Cabecalho titulo="Sistemas" subtitulo={formatarSemana(visao.semana)} comAcoes={false} />
      <Cartao titulo="Todos os sistemas" idTitulo="titulo-sistemas" acessorio={TEXTO_REGRA_SEMAFORO}>
        <ul className="divide-y divide-divisor border-t border-divisor">
          {visao.prontidao.map((linha) => (
            <li key={linha.sistema.id}>
              <Link
                href={`/sistemas/${linha.sistema.id}?de=sistemas`}
                className="group -mx-2 flex min-h-[72px] flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-2 py-3 hover:bg-fundo"
              >
                <span className="min-w-[200px] flex-1">
                  <span className="block text-[15px] font-semibold">{linha.sistema.nome}</span>
                  <span className="block text-[13px] text-tinta-suave">{linha.sistema.area}</span>
                </span>
                <span className="numeros w-36 text-[13px] text-tinta-suave">
                  {pluralizar(linha.defeitosAbertos, "defeito em aberto", "defeitos em aberto")}
                </span>
                <span className="numeros w-16 text-right text-[15px] font-semibold">{formatarPercentual(linha.taxa)}</span>
                <SeloStatus status={linha.status} />
                <ChevronRight aria-hidden="true" className="size-4 text-tinta-suave opacity-50 group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      </Cartao>
    </>
  );
}
