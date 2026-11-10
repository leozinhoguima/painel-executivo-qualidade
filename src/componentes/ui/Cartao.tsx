import type { ReactNode } from "react";

interface CartaoProps {
  titulo?: string;
  /** Texto ou elemento alinhado à direita do título (ex.: regra do semáforo). */
  acessorio?: ReactNode;
  children: ReactNode;
  className?: string;
  /** id do título, para `aria-labelledby` da seção. */
  idTitulo?: string;
}

/** Cartão branco com borda sutil e cantos de 12px — base de todos os blocos. */
export function Cartao({ titulo, acessorio, children, className = "", idTitulo }: CartaoProps) {
  return (
    <section
      aria-labelledby={titulo ? idTitulo : undefined}
      className={`rounded-cartao border border-borda bg-cartao p-5 sm:p-6 ${className}`}
    >
      {titulo && (
        <header className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
          <h2 id={idTitulo} className="shrink-0 text-[17px] font-semibold text-tinta">
            {titulo}
          </h2>
          {acessorio && <div className="text-[13px] text-tinta-suave sm:text-right">{acessorio}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
