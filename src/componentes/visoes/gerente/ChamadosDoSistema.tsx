import { ArrowRight, Check, Minus, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { COR_SERIE } from "@/componentes/graficos/cores";
import { GraficoBarras } from "@/componentes/graficos/GraficoBarras";
import { Cartao } from "@/componentes/ui/Cartao";
import { contextoContagem, TabelaAcessivel } from "@/componentes/visoes/sustentacao/apoio";
import type { ChamadosDoSistema as Dados } from "@/dominio/visoes/gerente";
import { formatarInteiro, formatarPercentual, formatarPercentualCurto, pluralizar } from "@/lib/formatacao";

const SERIE = [{ chave: "abertos", rotulo: "Chamados abertos", cor: COR_SERIE.abertos }];

const COR_TOM = { positivo: "text-ok", negativo: "text-risco", alerta: "text-alerta", neutro: "text-tinta-suave" };

function Numero({
  rotulo,
  valor,
  contexto,
}: {
  rotulo: string;
  valor: string;
  contexto: { texto: string; tom: keyof typeof COR_TOM; Icone: typeof Check };
}) {
  const { Icone } = contexto;
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[13px] text-tinta-suave">{rotulo}</dt>
      <dd className="flex flex-col gap-1">
        <span className="numeros text-[26px] leading-none font-semibold">{valor}</span>
        <span className={`flex items-center gap-1.5 text-[13px] ${COR_TOM[contexto.tom]}`}>
          <Icone aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.25} />
          {contexto.texto}
        </span>
      </dd>
    </div>
  );
}

/** O que chegou aos clientes deste sistema, no mesmo período da visão do gerente. */
export function ChamadosDoSistema({
  dados,
  sistemaId,
  periodo,
}: {
  dados: Dados;
  sistemaId: string;
  periodo: number;
}) {
  const prazo = dados.noPrazo.taxa;
  const prazoArredondado = prazo === null ? null : Math.round(prazo * 1000) / 1000;
  return (
    <Cartao
      titulo="Chamados em produção"
      idTitulo="titulo-chamados-sistema"
      acessorio={
        <Link
          href={`/sustentacao/chamados?periodo=${periodo}&sistema=${sistemaId}`}
          className="inline-flex min-h-11 items-center gap-1 font-medium text-marca hover:underline sm:min-h-0"
        >
          Ver chamados do sistema
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      }
    >
      <p className="-mt-2 mb-5 text-[13px] text-tinta-suave">
        O que os clientes relataram nos últimos {periodo} dias
      </p>
      <div className="grid gap-6 lg:grid-cols-[minmax(220px,280px)_1fr]">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-1">
          <Numero
            rotulo="Chamados abertos"
            valor={formatarInteiro(dados.abertos)}
            contexto={contextoContagem(dados.variacao, `vs. ${periodo} dias anteriores`, false)}
          />
          <Numero
            rotulo="Em aberto agora"
            valor={formatarInteiro(dados.emAberto)}
            contexto={
              dados.foraDoPrazo > 0
                ? { texto: pluralizar(dados.foraDoPrazo, "fora do prazo", "fora do prazo"), tom: "alerta", Icone: TriangleAlert }
                : { texto: "Todos dentro do prazo", tom: "positivo", Icone: Check }
            }
          />
          <Numero
            rotulo="Resolvidos no prazo"
            valor={formatarPercentual(prazo)}
            contexto={
              prazoArredondado === null
                ? { texto: "Nenhum resolvido no período", tom: "neutro", Icone: Minus }
                : prazoArredondado >= dados.noPrazo.meta
                  ? { texto: `Dentro da meta de ${formatarPercentualCurto(dados.noPrazo.meta)}`, tom: "positivo", Icone: Check }
                  : { texto: `Abaixo da meta de ${formatarPercentualCurto(dados.noPrazo.meta)}`, tom: "alerta", Icone: TriangleAlert }
            }
          />
        </dl>
        <div>
          <p className="mb-2 text-[13px] text-tinta-suave">
            Chamados abertos por {dados.agrupamento === "dia" ? "dia" : "semana"}
          </p>
          <GraficoBarras
            pontos={dados.barras}
            series={SERIE}
            intervaloRotulos={dados.barras.length > 14 ? 4 : 0}
            altura="h-[220px]"
          />
          <TabelaAcessivel
            legenda={`Chamados abertos por ${dados.agrupamento}`}
            colunas={[dados.agrupamento === "dia" ? "Dia" : "Semana", "Chamados abertos"]}
            linhas={dados.barras.map((b) => [b.descricao, b.abertos])}
          />
        </div>
      </div>
    </Cartao>
  );
}
