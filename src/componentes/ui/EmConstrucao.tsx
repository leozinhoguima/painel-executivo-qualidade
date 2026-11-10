import Link from "next/link";
import { Cabecalho } from "@/componentes/layout/Cabecalho";
import { EstadoVazio } from "./Estados";

/** Marcador temporário das telas das próximas fases. */
export function EmConstrucao({ titulo, fase }: { titulo: string; fase: number }) {
  return (
    <>
      <Cabecalho titulo={titulo} comAcoes={false} />
      <EstadoVazio
        titulo="Tela em construção"
        descricao={`Esta visão será entregue na Fase ${fase} do projeto.`}
        acao={
          <Link href="/" className="mt-2 inline-flex min-h-11 items-center text-[14px] font-medium text-marca underline">
            Voltar à visão executiva
          </Link>
        }
      />
    </>
  );
}
