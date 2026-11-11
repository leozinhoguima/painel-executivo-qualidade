import type { Metadata } from "next";
import { Cabecalho } from "@/componentes/layout/Cabecalho";
import { EstadoVazio } from "@/componentes/ui/Estados";
import { SeletorRecorte } from "@/componentes/ui/SeletorRecorte";
import { CartaoCategorias, CartaoPorSistema, CartaoPrioridades } from "@/componentes/visoes/sustentacao/Distribuicoes";
import {
  CartaoAbertosFechados,
  CartaoComparativoMensal,
  CartaoDiasDaSemana,
  CartaoFila,
} from "@/componentes/visoes/sustentacao/GraficosEvolucao";
import { IndicadoresSustentacao } from "@/componentes/visoes/sustentacao/IndicadoresSustentacao";
import { ProblemasSustentacao } from "@/componentes/visoes/sustentacao/ProblemasSustentacao";
import { carregarChamados } from "@/dados/repositorio";
import { lerRecorte } from "@/dominio/regras/periodoSustentacao";
import { montarVisaoSustentacao } from "@/dominio/visoes/sustentacao";
import { formatarDataHora } from "@/lib/formatacao";

export const metadata: Metadata = { title: "Sustentação" };

/**
 * Chamados em produção: quantos chegam, quantos fecham, quantos voltam e
 * onde está o problema. O recorte (dia, semana, mês) fica na URL.
 */
export default async function Sustentacao(props: PageProps<"/sustentacao">) {
  const parametros = await props.searchParams;
  const recorte = lerRecorte(parametros.recorte);
  const base = carregarChamados();
  const visao = montarVisaoSustentacao(base, recorte);

  if (!visao) {
    return (
      <>
        <Cabecalho titulo="Sustentação" comAcoes={false} />
        <EstadoVazio
          titulo="Ainda não há chamados"
          descricao="Os indicadores de sustentação aparecem assim que a primeira exportação da central de chamados for gravada."
        />
      </>
    );
  }

  return (
    <>
      <Cabecalho
        titulo="Sustentação"
        comAcoes={false}
        subtitulo={
          <>
            Chamados em produção · {visao.rotuloPeriodo}, {visao.rotuloComparacao}
            <span className="block text-[13px]">Atualizado em {formatarDataHora(visao.referencia)}</span>
          </>
        }
        controles={<SeletorRecorte atual={recorte} caminho="/sustentacao" />}
      />
      <IndicadoresSustentacao visao={visao} />
      <CartaoAbertosFechados visao={visao} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CartaoComparativoMensal visao={visao} />
        <CartaoDiasDaSemana visao={visao} />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <CartaoCategorias visao={visao} />
        <CartaoPrioridades visao={visao} />
        <div className="md:col-span-2 xl:col-span-1">
          <CartaoPorSistema visao={visao} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <CartaoFila visao={visao} />
        <ProblemasSustentacao visao={visao} />
      </div>
    </>
  );
}
