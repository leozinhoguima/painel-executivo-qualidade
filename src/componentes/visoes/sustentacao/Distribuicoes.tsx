import { COR_CATEGORIA, COR_DESTAQUE, COR_PRIORIDADE } from "@/componentes/graficos/cores";
import { GraficoRosca, type FatiaRosca } from "@/componentes/graficos/GraficoRosca";
import { Cartao } from "@/componentes/ui/Cartao";
import { ROTULO_CATEGORIA, ROTULO_PRIORIDADE } from "@/dominio/rotulos";
import type { VisaoSustentacao } from "@/dominio/visoes/sustentacao";
import { formatarInteiro, formatarPercentual } from "@/lib/formatacao";
import { JanelaDoGrafico, TabelaAcessivel } from "./apoio";

function CartaoRosca({
  titulo,
  idTitulo,
  periodo,
  fatias,
}: {
  titulo: string;
  idTitulo: string;
  periodo: string;
  fatias: FatiaRosca[];
}) {
  const total = fatias.reduce((a, f) => a + f.quantidade, 0);
  return (
    <Cartao titulo={titulo} idTitulo={idTitulo} className="h-full">
      <JanelaDoGrafico>Chamados abertos · {periodo}</JanelaDoGrafico>
      {total === 0 ? (
        <p className="py-10 text-center text-[14px] text-tinta-suave">Nenhum chamado aberto no período.</p>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center xl:flex-col 2xl:flex-row">
          <GraficoRosca fatias={fatias} total={total} />
          <ul className="numeros w-full flex-1 divide-y divide-divisor text-[14px]">
            {fatias.map((f) => (
              <li key={f.rotulo} className="flex items-center gap-2 py-1.5">
                <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[3px]" style={{ background: f.cor }} />
                <span className="flex-1 text-tinta">{f.rotulo}</span>
                <span className="font-semibold">{formatarInteiro(f.quantidade)}</span>
                <span className="w-14 text-right text-tinta-suave">{formatarPercentual(f.fracao)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Cartao>
  );
}

export function CartaoCategorias({ visao }: { visao: VisaoSustentacao }) {
  return (
    <CartaoRosca
      titulo="Por tipo de problema"
      idTitulo="titulo-categorias"
      periodo={visao.rotuloPeriodo}
      fatias={visao.porCategoria.map((f) => ({
        rotulo: ROTULO_CATEGORIA[f.chave],
        quantidade: f.quantidade,
        fracao: f.fracao,
        cor: COR_CATEGORIA[f.chave],
      }))}
    />
  );
}

export function CartaoPrioridades({ visao }: { visao: VisaoSustentacao }) {
  return (
    <CartaoRosca
      titulo="Por prioridade"
      idTitulo="titulo-prioridades"
      periodo={visao.rotuloPeriodo}
      fatias={visao.porPrioridade.map((f) => ({
        rotulo: ROTULO_PRIORIDADE[f.chave],
        quantidade: f.quantidade,
        fracao: f.fracao,
        cor: COR_PRIORIDADE[f.chave],
      }))}
    />
  );
}

/** Barras horizontais ordenadas, um só tom: comparam melhor que fatias. */
export function CartaoPorSistema({ visao }: { visao: VisaoSustentacao }) {
  const linhas = visao.porSistema;
  const maior = Math.max(1, ...linhas.map((l) => l.quantidade));
  return (
    <Cartao titulo="Por sistema" idTitulo="titulo-por-sistema" className="h-full">
      <JanelaDoGrafico>Chamados abertos · {visao.rotuloPeriodo}</JanelaDoGrafico>
      <ul className="flex flex-col gap-3" aria-hidden="true">
        {linhas.map((l) => (
          <li key={l.sistema.id} className="grid gap-1.5">
            <span className="numeros flex items-baseline justify-between gap-3 text-[14px]">
              <span className="text-tinta">{l.sistema.nome}</span>
              <span>
                <span className="font-semibold">{formatarInteiro(l.quantidade)}</span>
                <span className="ml-2 text-tinta-suave">{formatarPercentual(l.fracao)}</span>
              </span>
            </span>
            <span className="block h-2.5 overflow-hidden rounded-full bg-divisor">
              <span
                className="block h-full rounded-full"
                style={{ width: `${(l.quantidade / maior) * 100}%`, background: COR_DESTAQUE }}
              />
            </span>
          </li>
        ))}
      </ul>
      <TabelaAcessivel
        legenda="Chamados abertos por sistema"
        colunas={["Sistema", "Chamados", "Participação"]}
        linhas={linhas.map((l) => [l.sistema.nome, l.quantidade, formatarPercentual(l.fracao)])}
      />
    </Cartao>
  );
}
