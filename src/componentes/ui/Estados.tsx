import { CircleAlert, Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EstadoProps {
  titulo: string;
  descricao: string;
  acao?: ReactNode;
}

function Estado({ titulo, descricao, acao, Icone, papel }: EstadoProps & { Icone: LucideIcon; papel?: "alert" }) {
  return (
    <div
      role={papel}
      className="flex flex-col items-center gap-3 rounded-cartao border border-borda bg-cartao px-6 py-14 text-center"
    >
      <Icone aria-hidden="true" className="size-8 text-tinta-suave" />
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <p className="max-w-md text-[15px] text-tinta-suave">{descricao}</p>
      {acao}
    </div>
  );
}

/** Ausência de dados: explica o que falta e o que fazer. */
export function EstadoVazio(props: EstadoProps) {
  return <Estado {...props} Icone={Inbox} />;
}

/** Erro ao carregar: linguagem simples, sem detalhes técnicos. */
export function EstadoErro(props: EstadoProps) {
  return <Estado {...props} Icone={CircleAlert} papel="alert" />;
}

/** Bloco cinza animado usado nos estados de carregamento. */
export function Esqueleto({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-cartao bg-borda/70 ${className}`} />;
}
