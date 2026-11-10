import { Cabecalho } from "@/componentes/layout/Cabecalho";
import { EstadoVazio } from "@/componentes/ui/Estados";
import { CartaoTendencia } from "@/componentes/visoes/diretor/CartaoTendencia";
import { IndicadoresDiretor } from "@/componentes/visoes/diretor/IndicadoresDiretor";
import { ListaProblemas } from "@/componentes/visoes/diretor/ListaProblemas";
import { ListaProntidao } from "@/componentes/visoes/diretor/ListaProntidao";
import { ResumoSemana } from "@/componentes/visoes/diretor/ResumoSemana";
import { carregarBase } from "@/dados/repositorio";
import { META_SUCESSO } from "@/dominio/regras/parametros";
import { montarVisaoDiretor } from "@/dominio/visoes/diretor";
import { formatarSemana } from "@/lib/formatacao";

export default function VisaoExecutiva() {
  const visao = montarVisaoDiretor(carregarBase());

  if (!visao) {
    return (
      <>
        <Cabecalho titulo="Visão executiva de qualidade" />
        <EstadoVazio
          titulo="Ainda não há execuções de teste"
          descricao="Assim que a primeira rodada automática de testes for importada, os indicadores aparecem aqui."
        />
      </>
    );
  }

  return (
    <>
      <Cabecalho titulo="Visão executiva de qualidade" subtitulo={formatarSemana(visao.semana)} />
      <ResumoSemana trechos={visao.resumo} />
      <IndicadoresDiretor indicadores={visao.indicadores} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <ListaProntidao linhas={visao.prontidao} />
        <CartaoTendencia pontos={visao.tendencia} meta={META_SUCESSO} />
      </div>
      <ListaProblemas problemas={visao.problemas} />
    </>
  );
}
