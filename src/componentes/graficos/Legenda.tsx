export interface ItemLegenda {
  rotulo: string;
  cor: string;
}

/** Legenda em HTML acima do gráfico: amostra de cor + nome, sempre em texto. */
export function Legenda({ itens }: { itens: ItemLegenda[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-tinta-suave" aria-hidden="true">
      {itens.map((item) => (
        <li key={item.rotulo} className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: item.cor }} />
          {item.rotulo}
        </li>
      ))}
    </ul>
  );
}
