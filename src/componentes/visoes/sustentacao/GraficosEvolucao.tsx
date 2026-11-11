import { COR_DESTAQUE, COR_REFERENCIA, COR_SERIE } from "@/componentes/graficos/cores";
import { GraficoBarras } from "@/componentes/graficos/GraficoBarras";
import { GraficoFila } from "@/componentes/graficos/GraficoFila";
import { Legenda } from "@/componentes/graficos/Legenda";
import { Cartao } from "@/componentes/ui/Cartao";
import type { VisaoSustentacao } from "@/dominio/visoes/sustentacao";
import { formatarDecimal, formatarInteiro, maiusculaInicial } from "@/lib/formatacao";
import { JanelaDoGrafico, TabelaAcessivel } from "./apoio";

const SERIES_FLUXO = [
  { chave: "abertos", rotulo: "Abertos", cor: COR_SERIE.abertos },
  { chave: "fechados", rotulo: "Fechados", cor: COR_SERIE.fechados },
];
const SERIES_MENSAL = [...SERIES_FLUXO, { chave: "reabertos", rotulo: "Reabertos", cor: COR_SERIE.reabertos }];

/** Abertos × fechados por dia: barras de fechados abaixo das de abertos = fila crescendo. */
export function CartaoAbertosFechados({ visao }: { visao: VisaoSustentacao }) {
  const pontos = visao.diario;
  const abertos = pontos.reduce((a, p) => a + p.abertos, 0);
  const fechados = pontos.reduce((a, p) => a + p.fechados, 0);
  const saldo = abertos - fechados;
  return (
    <Cartao titulo="Abertos × fechados por dia" idTitulo="titulo-diario" acessorio={<Legenda itens={SERIES_FLUXO} />}>
      <JanelaDoGrafico>
        Últimos {pontos.length} dias · {formatarInteiro(abertos)} abertos e {formatarInteiro(fechados)} fechados
        {saldo > 0
          ? ` · a fila cresceu ${formatarInteiro(saldo)}`
          : saldo < 0
            ? ` · a fila diminuiu ${formatarInteiro(-saldo)}`
            : " · fila estável"}
      </JanelaDoGrafico>
      <GraficoBarras pontos={pontos} series={SERIES_FLUXO} intervaloRotulos={4} altura="h-[260px]" />
      <TabelaAcessivel
        legenda="Chamados abertos e fechados por dia"
        colunas={["Dia", "Abertos", "Fechados"]}
        linhas={pontos.map((p) => [p.descricao, p.abertos, p.fechados])}
      />
    </Cartao>
  );
}

export function CartaoComparativoMensal({ visao }: { visao: VisaoSustentacao }) {
  const pontos = visao.mensal;
  return (
    <Cartao titulo="Comparativo mês a mês" idTitulo="titulo-mensal" className="h-full">
      <JanelaDoGrafico>Últimos {pontos.length} meses fechados</JanelaDoGrafico>
      <div className="mb-3">
        <Legenda itens={SERIES_MENSAL} />
      </div>
      <GraficoBarras pontos={pontos} series={SERIES_MENSAL} />
      <TabelaAcessivel
        legenda="Chamados por mês"
        colunas={["Mês", "Abertos", "Fechados", "Reabertos"]}
        linhas={pontos.map((p) => [p.descricao, p.abertos, p.fechados, p.reabertos])}
      />
    </Cartao>
  );
}

/** A última semana em destaque contra a média das semanas anteriores, em cinza. */
export function CartaoDiasDaSemana({ visao }: { visao: VisaoSustentacao }) {
  const pontos = visao.diasDaSemana;
  const series = [
    { chave: "media", rotulo: `Média de ${visao.semanasNaMedia} semanas`, cor: COR_REFERENCIA },
    { chave: "ultimaSemana", rotulo: "Última semana", cor: COR_DESTAQUE },
  ];
  const pico = pontos.reduce((maior, p) => (p.media > maior.media ? p : maior), pontos[0]);
  return (
    <Cartao titulo="Comparativo entre dias da semana" idTitulo="titulo-dias-semana" className="h-full">
      <JanelaDoGrafico>
        Chamados abertos por dia · {maiusculaInicial(pico.descricao)} é o dia mais movimentado (média de{" "}
        {formatarDecimal(pico.media)})
      </JanelaDoGrafico>
      <div className="mb-3">
        <Legenda itens={series} />
      </div>
      <GraficoBarras pontos={pontos} series={series} decimal />
      <TabelaAcessivel
        legenda="Chamados abertos por dia da semana"
        colunas={["Dia", series[0].rotulo, "Última semana"]}
        linhas={pontos.map((p) => [p.descricao, formatarDecimal(p.media), p.ultimaSemana])}
      />
    </Cartao>
  );
}

export function CartaoFila({ visao }: { visao: VisaoSustentacao }) {
  const pontos = visao.fila;
  const ultimo = pontos.at(-1);
  const maior = pontos.reduce((m, p) => (p.emAberto > m.emAberto ? p : m), pontos[0]);
  return (
    <Cartao titulo="Evolução da fila em aberto" idTitulo="titulo-fila" className="h-full">
      <JanelaDoGrafico>
        Últimos {pontos.length} dias · pico de {formatarInteiro(maior.emAberto)} em {maior.rotulo}
        {ultimo ? ` · ${formatarInteiro(ultimo.emAberto)} ao fim de ${ultimo.rotulo}` : ""}
      </JanelaDoGrafico>
      <GraficoFila pontos={pontos} />
      <TabelaAcessivel
        legenda="Chamados em aberto ao fim de cada dia"
        colunas={["Dia", "Em aberto", "Fora do prazo"]}
        linhas={pontos.map((p) => [p.descricao, p.emAberto, p.foraDoPrazo])}
      />
    </Cartao>
  );
}
