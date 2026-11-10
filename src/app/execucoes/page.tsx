import type { Metadata } from "next";
import { EmConstrucao } from "@/componentes/ui/EmConstrucao";

export const metadata: Metadata = { title: "Execuções de teste" };

export default function Execucoes() {
  return <EmConstrucao titulo="Execuções de teste" fase={4} />;
}
