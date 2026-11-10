"use client";

import { RotateCw } from "lucide-react";
import { useEffect } from "react";
import { EstadoErro } from "@/componentes/ui/Estados";

export default function Erro({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EstadoErro
      titulo="Não foi possível carregar os indicadores"
      descricao="Os dados de testes não puderam ser lidos agora. Tente novamente em instantes; se o problema continuar, a equipe de qualidade deve verificar a última importação."
      acao={
        <button
          type="button"
          onClick={() => retry()}
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg bg-marinho px-4 text-[14px] font-medium text-white hover:bg-marinho-ativo"
        >
          <RotateCw aria-hidden="true" className="size-4" />
          Tentar novamente
        </button>
      }
    />
  );
}
