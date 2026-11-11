import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { TomContexto } from "@/componentes/ui/CartaoIndicador";
import { descreverVariacaoRelativa } from "@/lib/formatacao";

/**
 * Linha de contexto de uma contagem: seta e texto da variação, com a cor
 * conforme o que é bom para o negócio (mais fechados é bom; mais abertos, não).
 */
export function contextoContagem(variacao: number | null, comparacao: string, subirEhBom: boolean) {
  const v = descreverVariacaoRelativa(variacao, comparacao);
  if (!v) return { texto: "Sem base para comparar", tom: "neutro" as TomContexto, Icone: Minus };
  if (v.sentido === 0) return { texto: v.texto, tom: "neutro" as TomContexto, Icone: Minus };
  const bom = v.sentido > 0 === subirEhBom;
  return {
    texto: v.texto,
    tom: (bom ? "positivo" : "negativo") as TomContexto,
    Icone: v.sentido > 0 ? ArrowUp : ArrowDown,
  };
}

/** Tabela equivalente ao gráfico, só para leitores de tela. */
export function TabelaAcessivel({
  legenda,
  colunas,
  linhas,
}: {
  legenda: string;
  colunas: string[];
  linhas: (string | number)[][];
}) {
  // A tabela fica dentro de um div: uma <table> ignora o tamanho de 1px do sr-only e esticaria a página.
  return (
    <div className="sr-only">
      <table>
        <caption>{legenda}</caption>
        <thead>
          <tr>
            {colunas.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map(([primeira, ...resto], i) => (
            <tr key={i}>
              <th scope="row">{primeira}</th>
              {resto.map((v, j) => (
                <td key={j}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Linha discreta abaixo do título do cartão, dizendo qual janela o gráfico mostra. */
export function JanelaDoGrafico({ children }: { children: React.ReactNode }) {
  return <p className="-mt-2 mb-4 text-[13px] text-tinta-suave">{children}</p>;
}
