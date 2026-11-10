import type { Metadata } from "next";
import { EmConstrucao } from "@/componentes/ui/EmConstrucao";

export const metadata: Metadata = { title: "Sistemas" };

export default function Sistemas() {
  return <EmConstrucao titulo="Sistemas" fase={3} />;
}
