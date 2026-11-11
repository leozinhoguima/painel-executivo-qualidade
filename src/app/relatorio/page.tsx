import type { Metadata } from "next";
import { Cabecalho } from "@/componentes/layout/Cabecalho";
import { EstadoVazio } from "@/componentes/ui/Estados";
import { AcoesRelatorio } from "@/componentes/visoes/relatorio/AcoesRelatorio";
import { FolhaRelatorio } from "@/componentes/visoes/relatorio/FolhaRelatorio";
import { carregarBase, carregarChamadosOuNada } from "@/dados/repositorio";
import { montarRelatorio } from "@/dominio/visoes/relatorio";
import { formatarSemana } from "@/lib/formatacao";

export const metadata: Metadata = { title: "Relatório semanal" };

export default function Relatorio() {
  const relatorio = montarRelatorio(carregarBase(), carregarChamadosOuNada());

  if (!relatorio) {
    return (
      <>
        <Cabecalho titulo="Relatório semanal" comAcoes={false} />
        <EstadoVazio
          titulo="Ainda não há execuções de teste"
          descricao="O relatório fica disponível assim que a primeira rodada automática for importada."
        />
      </>
    );
  }

  return (
    <>
      <div className="print:hidden">
        <Cabecalho
          titulo="Relatório semanal"
          subtitulo={`${formatarSemana(relatorio.semana)} · uma página, pronta para imprimir ou salvar em PDF`}
          controles={<AcoesRelatorio texto={relatorio.texto} />}
        />
      </div>

      <FolhaRelatorio relatorio={relatorio} />

      <details className="rounded-cartao border border-borda bg-cartao p-5 print:hidden">
        <summary className="min-h-11 cursor-pointer content-center text-[14px] font-medium text-marca">
          Ver o texto que será copiado
        </summary>
        <pre className="mt-3 overflow-x-auto font-sans text-[13px] leading-relaxed whitespace-pre-wrap text-tinta">
          {relatorio.texto}
        </pre>
      </details>
    </>
  );
}
