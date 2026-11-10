import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cabecalho } from "@/componentes/layout/Cabecalho";
import { EstadoVazio } from "@/componentes/ui/Estados";
import { SeletorPeriodo } from "@/componentes/ui/SeletorPeriodo";
import { SeloStatus } from "@/componentes/ui/Selos";
import { IndicadoresGerente } from "@/componentes/visoes/gerente/IndicadoresGerente";
import { SucessoPorFuncionalidade } from "@/componentes/visoes/gerente/SucessoPorFuncionalidade";
import { TabelaDefeitos } from "@/componentes/visoes/gerente/TabelaDefeitos";
import { carregarBase } from "@/dados/repositorio";
import { lerPeriodo } from "@/dominio/regras/periodo";
import { montarVisaoGerente } from "@/dominio/visoes/gerente";
import { formatarJanela } from "@/lib/formatacao";

export async function generateMetadata(props: PageProps<"/sistemas/[sistemaId]">): Promise<Metadata> {
  const { sistemaId } = await props.params;
  const sistema = carregarBase().catalogo.sistemas.find((s) => s.id === sistemaId);
  return { title: sistema?.nome ?? "Sistema não encontrado" };
}

export default async function VisaoGerente(props: PageProps<"/sistemas/[sistemaId]">) {
  const { sistemaId } = await props.params;
  const periodo = lerPeriodo((await props.searchParams).periodo);
  const base = carregarBase();

  const sistema = base.catalogo.sistemas.find((s) => s.id === sistemaId);
  if (!sistema) notFound();

  const visao = montarVisaoGerente(base, sistemaId, periodo);
  const voltar = { href: "/", rotulo: "Visão executiva" };

  if (!visao) {
    return (
      <>
        <Cabecalho titulo={sistema.nome} voltar={voltar} comAcoes={false} subtitulo={`Responsável: ${sistema.area}`} />
        <EstadoVazio
          titulo="Ainda não há execuções de teste"
          descricao="Os indicadores deste sistema aparecem assim que a primeira rodada automática for importada."
        />
      </>
    );
  }

  return (
    <>
      <Cabecalho
        titulo={sistema.nome}
        voltar={voltar}
        aoLadoDoTitulo={
          <>
            <span className="sr-only">Status no período: </span>
            <SeloStatus status={visao.status} compacto />
          </>
        }
        subtitulo={`Responsável: ${sistema.area} · Últimos ${periodo} dias (${formatarJanela(visao.janela)})`}
        controles={<SeletorPeriodo atual={periodo} caminho={`/sistemas/${sistema.id}`} />}
      />
      <IndicadoresGerente visao={visao} />
      <SucessoPorFuncionalidade linhas={visao.funcionalidades} />
      <TabelaDefeitos defeitos={visao.defeitos} />
    </>
  );
}
