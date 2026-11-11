import type { Metadata } from "next";
import { Cabecalho } from "@/componentes/layout/Cabecalho";
import { Cartao } from "@/componentes/ui/Cartao";
import { EstadoVazio } from "@/componentes/ui/Estados";
import { Paginacao } from "@/componentes/ui/Paginacao";
import { FiltrosChamados } from "@/componentes/visoes/sustentacao/FiltrosChamados";
import { TabelaChamados } from "@/componentes/visoes/sustentacao/TabelaChamados";
import { carregarBase, carregarChamados } from "@/dados/repositorio";
import {
  consultaDosFiltrosChamados,
  lerFiltrosChamados,
  montarListaChamados,
} from "@/dominio/visoes/listaChamados";
import { formatarDataHora, formatarInteiro, formatarJanela, pluralizar } from "@/lib/formatacao";

export const metadata: Metadata = { title: "Chamados" };

/** Lista técnica de chamados: cada registro, com situação, prazo e defeito ligado. */
export default async function ListaDeChamados(props: PageProps<"/sustentacao/chamados">) {
  const qualidade = carregarBase();
  const chamados = carregarChamados();
  const filtros = lerFiltrosChamados(await props.searchParams, qualidade.catalogo);
  const visao = montarListaChamados(chamados, qualidade, filtros);
  const voltar = { href: "/sustentacao", rotulo: "Sustentação" };

  if (!visao) {
    return (
      <>
        <Cabecalho titulo="Chamados" voltar={voltar} comAcoes={false} />
        <EstadoVazio
          titulo="Ainda não há chamados"
          descricao="A lista aparece assim que a primeira exportação da central de chamados for gravada."
        />
      </>
    );
  }

  const recorte = visao.janela
    ? `Abertos nos últimos ${visao.filtros.periodo} dias (${formatarJanela(visao.janela)})`
    : `Todo o histórico do defeito ${visao.filtros.defeito}`;
  const resumo =
    visao.total === 0
      ? "Nenhum chamado encontrado"
      : `${pluralizar(visao.total, "chamado", "chamados")} · ${formatarInteiro(visao.emAberto)} em aberto · ${formatarInteiro(visao.foraDoPrazo)} fora do prazo`;

  return (
    <>
      <Cabecalho
        titulo="Chamados"
        voltar={voltar}
        comAcoes={false}
        subtitulo={
          <>
            Visão técnica da sustentação · {recorte}
            <span className="block text-[13px]">Situação em {formatarDataHora(visao.referencia)}</span>
          </>
        }
      />

      <FiltrosChamados
        filtros={visao.filtros}
        sistemas={visao.opcoes.sistemas}
        funcionalidades={visao.opcoes.funcionalidades}
      />

      <Cartao
        titulo="Chamados"
        idTitulo="titulo-chamados"
        acessorio={
          <span className="numeros" aria-live="polite">
            {resumo}
          </span>
        }
      >
        {visao.total === 0 ? (
          <p className="border-t border-divisor pt-4 text-[15px] text-tinta-suave">
            Nenhum chamado corresponde aos filtros escolhidos. Amplie o período ou remova algum filtro.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <TabelaChamados linhas={visao.linhas} />
            <p className="numeros text-[13px] text-tinta-suave">
              Mostrando {formatarInteiro(visao.primeiraPosicao)}–{formatarInteiro(visao.ultimaPosicao)} de{" "}
              {formatarInteiro(visao.total)}, do mais recente para o mais antigo.
            </p>
            <Paginacao
              pagina={visao.filtros.pagina}
              totalPaginas={visao.totalPaginas}
              endereco={(pagina) => `/sustentacao/chamados${consultaDosFiltrosChamados(visao.filtros, { pagina })}`}
            />
          </div>
        )}
      </Cartao>
    </>
  );
}
