import { X } from "lucide-react";
import Link from "next/link";
import { CATEGORIAS } from "@/dominio/regras/chamados";
import { PERIODOS } from "@/dominio/regras/periodo";
import { ROTULO_CATEGORIA, ROTULO_PRIORIDADE } from "@/dominio/rotulos";
import type { Funcionalidade, Prioridade, Sistema } from "@/dominio/tipos";
import {
  consultaDosFiltrosChamados,
  type FiltroSituacao,
  type FiltrosChamados as Filtros,
} from "@/dominio/visoes/listaChamados";

const CAMPO =
  "min-h-11 w-full rounded-lg border border-borda bg-cartao px-3 text-[14px] text-tinta focus-visible:outline-2 focus-visible:outline-marca";
const ROTULO_CAMPO = "flex flex-col gap-1.5 text-[13px] font-medium text-tinta-suave";

const ROTULO_SITUACAO: Record<FiltroSituacao, string> = {
  todas: "Todas as situações",
  "em-aberto": "Em aberto agora",
  "fora-do-prazo": "Em aberto fora do prazo",
  reabertos: "Reabertos",
  fechados: "Fechados",
};
const PRIORIDADES: Prioridade[] = ["critica", "alta", "media", "baixa"];

interface Props {
  filtros: Filtros;
  sistemas: Sistema[];
  funcionalidades: Funcionalidade[];
}

/**
 * Formulário GET: os filtros vão para a URL e funcionam sem JavaScript.
 * Motivo e defeito chegam por links (problemas e tabela de defeitos) e
 * aparecem como etiquetas que podem ser removidas.
 */
export function FiltrosChamados({ filtros, sistemas, funcionalidades }: Props) {
  const sistemasVisiveis = filtros.sistemaId ? sistemas.filter((s) => s.id === filtros.sistemaId) : sistemas;
  const etiquetas = [
    filtros.motivo && {
      texto: `Problema: ${filtros.motivo}`,
      remover: consultaDosFiltrosChamados(filtros, { motivo: null, pagina: 1 }),
    },
    filtros.defeito && {
      texto: `Ligados ao defeito ${filtros.defeito} (todo o histórico)`,
      remover: consultaDosFiltrosChamados(filtros, { defeito: null, pagina: 1 }),
    },
  ].filter((e): e is { texto: string; remover: string } => Boolean(e));

  return (
    <form
      method="get"
      action="/sustentacao/chamados"
      aria-label="Filtros dos chamados"
      className="flex flex-col gap-4 rounded-cartao border border-borda bg-cartao p-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className={ROTULO_CAMPO}>
          Período (abertura)
          <select name="periodo" defaultValue={String(filtros.periodo)} className={CAMPO} disabled={Boolean(filtros.defeito)}>
            {PERIODOS.map((dias) => (
              <option key={dias} value={dias}>
                Últimos {dias} dias
              </option>
            ))}
          </select>
        </label>

        <label className={ROTULO_CAMPO}>
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

        <label className={ROTULO_CAMPO}>
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

        <label className={ROTULO_CAMPO}>
          Tipo de problema
          <select name="tipo" defaultValue={filtros.categoria ?? ""} className={CAMPO}>
            <option value="">Todos os tipos</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {ROTULO_CATEGORIA[c]}
              </option>
            ))}
          </select>
        </label>

        <label className={ROTULO_CAMPO}>
          Prioridade
          <select name="prioridade" defaultValue={filtros.prioridade ?? ""} className={CAMPO}>
            <option value="">Todas as prioridades</option>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {ROTULO_PRIORIDADE[p]}
              </option>
            ))}
          </select>
        </label>

        <label className={ROTULO_CAMPO}>
          Situação
          <select name="situacao" defaultValue={filtros.situacao} className={CAMPO}>
            {(Object.keys(ROTULO_SITUACAO) as FiltroSituacao[]).map((s) => (
              <option key={s} value={s}>
                {ROTULO_SITUACAO[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtros.motivo && <input type="hidden" name="motivo" value={filtros.motivo} />}
      {filtros.defeito && <input type="hidden" name="defeito" value={filtros.defeito} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-2">
          {etiquetas.map((e) => (
            <li key={e.texto}>
              <Link
                href={`/sustentacao/chamados${e.remover}`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-marca-clara px-3 text-[13px] font-medium text-marca hover:underline"
              >
                {e.texto}
                <X aria-hidden="true" className="size-3.5" />
                <span className="sr-only">(remover filtro)</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="min-h-11 flex-1 rounded-lg bg-marinho px-5 text-[14px] font-medium whitespace-nowrap text-white hover:bg-marinho-ativo sm:flex-none"
          >
            Aplicar filtros
          </button>
          <Link
            href="/sustentacao/chamados"
            className="inline-flex min-h-11 items-center px-2 text-[14px] font-medium whitespace-nowrap text-marca hover:underline"
          >
            Limpar
          </Link>
        </div>
      </div>
    </form>
  );
}
