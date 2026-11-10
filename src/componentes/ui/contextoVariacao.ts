import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { descreverVariacao } from "@/lib/formatacao";
import type { TomContexto } from "./CartaoIndicador";

/** Linha de contexto de um indicador de taxa: texto, cor e seta conforme a variação. */
export function contextoVariacao(pontos: number | null, comparacao: string, semBase: string) {
  const v = descreverVariacao(pontos, comparacao);
  if (!v) return { texto: semBase, tom: "neutro" as TomContexto, Icone: Minus };
  if (v.sentido === 0) return { texto: v.texto, tom: "neutro" as TomContexto, Icone: Minus };
  return {
    texto: v.texto,
    tom: (v.sentido > 0 ? "positivo" : "negativo") as TomContexto,
    Icone: v.sentido > 0 ? ArrowUp : ArrowDown,
  };
}
