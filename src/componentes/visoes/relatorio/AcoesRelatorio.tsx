"use client";

import { Check, Copy, Printer } from "lucide-react";
import { useEffect, useState } from "react";

type EstadoCopia = "inicial" | "copiado" | "erro";

/** Copia o texto usando a API moderna e, se indisponível, o método antigo de seleção. */
async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // segue para o método alternativo
  }
  const area = document.createElement("textarea");
  area.value = texto;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(area);
  return ok;
}

const BOTAO =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-medium whitespace-nowrap";

export function AcoesRelatorio({ texto }: { texto: string }) {
  const [estado, setEstado] = useState<EstadoCopia>("inicial");

  useEffect(() => {
    if (estado === "inicial") return;
    const t = setTimeout(() => setEstado("inicial"), 4000);
    return () => clearTimeout(t);
  }, [estado]);

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => window.print()} className={`${BOTAO} bg-marinho text-white hover:bg-marinho-ativo`}>
          <Printer aria-hidden="true" className="size-4" />
          Imprimir ou salvar em PDF
        </button>
        <button
          type="button"
          onClick={async () => setEstado((await copiarTexto(texto)) ? "copiado" : "erro")}
          className={`${BOTAO} border border-borda bg-cartao text-tinta hover:bg-neutro-fundo`}
        >
          {estado === "copiado" ? (
            <Check aria-hidden="true" className="size-4 text-ok" />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )}
          Copiar resumo em texto
        </button>
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-[13px] text-tinta-suave">
        {estado === "copiado" && "Resumo copiado. Cole no e-mail ou na mensagem."}
        {estado === "erro" && "Não foi possível copiar automaticamente. Selecione o texto abaixo e copie."}
      </p>
    </div>
  );
}
