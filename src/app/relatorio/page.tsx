import type { Metadata } from "next";
import { EmConstrucao } from "@/componentes/ui/EmConstrucao";

export const metadata: Metadata = { title: "Relatório semanal" };

export default function Relatorio() {
  return <EmConstrucao titulo="Relatório semanal" fase={5} />;
}
