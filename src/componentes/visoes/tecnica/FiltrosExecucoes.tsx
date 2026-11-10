import Link from "next/link";
import { PERIODOS } from "@/dominio/regras/periodo";
import type { Funcionalidade, Sistema } from "@/dominio/tipos";
import type { FiltrosExecucoes as Filtros } from "@/dominio/visoes/tecnica";

interface Props {
  filtros: Filtros;
  sistemas: Sistema[];
  funcionalidades: Funcionalidade[];
}

const CAMPO =
  "min-h-11 w-full rounded-lg border border-borda bg-cartao px-3 text-[14px] text-tinta focus-visible:outline-2 focus-visible:outline-marca";

/**
 * Formulário GET: os filtros vão para a URL (compartilhável) e funcionam sem JavaScript.
 * Com um sistema escolhido, só as funcionalidades dele aparecem.
 */
export function FiltrosExecucoes({ filtros, sistemas, funcionalidades }: Props) {
  const sistemasVisiveis = filtros.sistemaId ? sistemas.filter((s) => s.id === filtros.sistemaId) : sistemas;

  return (
    <form
      method="get"
      action="/execucoes"
      aria-label="Filtros das execuções"
      className="grid grid-cols-1 gap-4 rounded-cartao border border-borda bg-cartao p-5 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
    >
      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-tinta-suave">
        Período
        <select name="periodo" defaultValue={String(filtros.periodo)} className={CAMPO}>
          {PERIODOS.map((dias) => (
            <option key={dias} value={dias}>
              Últimos {dias} dias
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-tinta-suave">
        Sistema
        <select name="sistema" defaultValue={filtros.sistemaId ?? ""} className={CAMPO}>
          <option value="">Todos os sistemas</option>
          {sistemas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-tinta-suave">
        Funcionalidade
        <select name="funcionalidade" defaultValue={filtros.funcionalidadeId ?? ""} className={CAMPO}>
          <option value="">Todas as funcionalidades</option>
          {sistemasVisiveis.map((s) => (
            <optgroup key={s.id} label={s.nome}>
              {funcionalidades
                .filter((f) => f.sistemaId === s.id)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-tinta-suave">
        Resultado
        <select name="resultado" defaultValue={filtros.resultado} className={CAMPO}>
          <option value="todos">Todos os resultados</option>
          <option value="falha">Somente falhas</option>
          <option value="sucesso">Somente sucessos</option>
        </select>
      </label>

      <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-1">
        <button
          type="submit"
          className="min-h-11 flex-1 rounded-lg bg-marinho px-5 text-[14px] font-medium whitespace-nowrap text-white hover:bg-marinho-ativo lg:flex-none"
        >
          Aplicar filtros
        </button>
        <Link
          href="/execucoes"
          className="inline-flex min-h-11 items-center px-2 text-[14px] font-medium whitespace-nowrap text-marca hover:underline"
        >
          Limpar
        </Link>
      </div>
    </form>
  );
}
