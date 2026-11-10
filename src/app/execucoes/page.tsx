import type { Metadata } from "next";
import { Cabecalho } from "@/componentes/layout/Cabecalho";
import { Cartao } from "@/componentes/ui/Cartao";
import { EstadoVazio } from "@/componentes/ui/Estados";
import { Paginacao } from "@/componentes/ui/Paginacao";
import { FiltrosExecucoes } from "@/componentes/visoes/tecnica/FiltrosExecucoes";
import { TabelaExecucoes } from "@/componentes/visoes/tecnica/TabelaExecucoes";
import { carregarBase } from "@/dados/repositorio";
import { consultaDosFiltros, lerFiltrosExecucoes, montarVisaoTecnica } from "@/dominio/visoes/tecnica";
import { formatarInteiro, formatarJanela, formatarPercentual, pluralizar } from "@/lib/formatacao";

export const metadata: Metadata = { title: "Execuções de teste" };

export default async function Execucoes(props: PageProps<"/execucoes">) {
  const base = carregarBase();
  const filtros = lerFiltrosExecucoes(await props.searchParams, base);
  const visao = montarVisaoTecnica(base, filtros);

  if (!visao) {
    return (
      <>
        <Cabecalho titulo="Execuções de teste" comAcoes={false} />
        <EstadoVazio
          titulo="Ainda não há execuções de teste"
          descricao="A lista aparece assim que a primeira rodada automática for importada."
        />
      </>
    );
  }

  // Com o filtro de resultado ativo, a taxa seria sempre 0% ou 100%: mostra só a contagem.
  const resumo =
    visao.total === 0
      ? "Nenhuma execução encontrada"
      : visao.filtros.resultado !== "todos"
        ? pluralizar(visao.total, "execução", "execuções")
        : `${pluralizar(visao.total, "execução", "execuções")} · ${pluralizar(visao.falhas, "falha", "falhas")} · ${formatarPercentual(visao.taxa)} de sucesso`;

  return (
    <>
      <Cabecalho
        titulo="Execuções de teste"
        subtitulo={`Visão técnica · Últimos ${visao.filtros.periodo} dias (${formatarJanela(visao.janela)})`}
        comAcoes={false}
      />

      <FiltrosExecucoes
        filtros={visao.filtros}
        sistemas={visao.opcoes.sistemas}
        funcionalidades={visao.opcoes.funcionalidades}
      />

      <Cartao
        titulo="Execuções"
        idTitulo="titulo-execucoes"
        acessorio={
          <span className="numeros" aria-live="polite">
            {resumo}
          </span>
        }
      >
        {visao.total === 0 ? (
          <p className="border-t border-divisor pt-4 text-[15px] text-tinta-suave">
            Nenhuma execução corresponde aos filtros escolhidos. Amplie o período ou remova algum filtro.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <TabelaExecucoes linhas={visao.linhas} />
            <p className="numeros text-[13px] text-tinta-suave">
              Mostrando {formatarInteiro(visao.primeiraPosicao)}–{formatarInteiro(visao.ultimaPosicao)} de{" "}
              {formatarInteiro(visao.total)}, da mais recente para a mais antiga.
            </p>
            <Paginacao
              pagina={visao.filtros.pagina}
              totalPaginas={visao.totalPaginas}
              endereco={(pagina) => `/execucoes${consultaDosFiltros(visao.filtros, { pagina })}`}
            />
          </div>
        )}
      </Cartao>
    </>
  );
}
