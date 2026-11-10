import type { TrechoResumo } from "@/dominio/regras/resumo";

/** Bloco de destaque com o resumo da semana gerado a partir dos dados. */
export function ResumoSemana({ trechos }: { trechos: TrechoResumo[] }) {
  return (
    <section aria-labelledby="titulo-resumo" className="rounded-cartao bg-marinho px-6 py-6 text-white sm:px-7">
      <h2 id="titulo-resumo" className="text-[12px] font-semibold tracking-[0.08em] text-marinho-texto uppercase">
        Resumo da semana
      </h2>
      <p className="mt-3 max-w-[920px] text-[18px] leading-relaxed sm:text-[20px]">
        {trechos.map((t, i) =>
          t.destaque ? (
            <strong key={i} className="font-semibold">
              {t.texto}
            </strong>
          ) : (
            <span key={i}>{t.texto}</span>
          ),
        )}
      </p>
    </section>
  );
}
