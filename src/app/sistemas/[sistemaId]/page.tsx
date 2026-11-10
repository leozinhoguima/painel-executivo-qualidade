import { notFound } from "next/navigation";
import { EmConstrucao } from "@/componentes/ui/EmConstrucao";
import { carregarBase } from "@/dados/repositorio";

export function generateStaticParams() {
  return carregarBase().catalogo.sistemas.map((s) => ({ sistemaId: s.id }));
}

export default async function VisaoGerente(props: PageProps<"/sistemas/[sistemaId]">) {
  const { sistemaId } = await props.params;
  const sistema = carregarBase().catalogo.sistemas.find((s) => s.id === sistemaId);
  if (!sistema) notFound();
  return <EmConstrucao titulo={sistema.nome} fase={3} />;
}
