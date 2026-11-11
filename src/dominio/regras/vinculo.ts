import type { Chamado, Defeito } from "../tipos";
import { TOLERANCIA_VINCULO_MS } from "./parametros";

/**
 * Liga cada chamado ao defeito que provavelmente o causou: mesma funcionalidade
 * e abertura do chamado dentro do intervalo do defeito, com a tolerância de
 * `TOLERANCIA_VINCULO_MS` antes da primeira falha e depois da correção.
 * Se mais de um defeito servir, vale o aberto mais recentemente.
 * Chamados sem funcionalidade (dúvidas, senha…) nunca têm defeito.
 *
 * Retorna o código do defeito por código de chamado.
 */
export function vincularChamados(chamados: readonly Chamado[], defeitos: readonly Defeito[]): Map<string, string> {
  const porFuncionalidade = new Map<string, Defeito[]>();
  for (const d of defeitos) {
    const lista = porFuncionalidade.get(d.funcionalidadeId) ?? [];
    lista.push(d);
    porFuncionalidade.set(d.funcionalidadeId, lista);
  }
  for (const lista of porFuncionalidade.values()) lista.sort((a, b) => b.abertoEm - a.abertoEm);

  const vinculos = new Map<string, string>();
  for (const c of chamados) {
    if (!c.funcionalidadeId) continue;
    const defeito = porFuncionalidade.get(c.funcionalidadeId)?.find((d) => {
      const fim = d.resolvidoEm === null ? Infinity : d.resolvidoEm + TOLERANCIA_VINCULO_MS;
      return c.abertura >= d.abertoEm - TOLERANCIA_VINCULO_MS && c.abertura <= fim;
    });
    if (defeito) vinculos.set(c.codigo, defeito.codigo);
  }
  return vinculos;
}

/** Quantos chamados cada defeito gerou. */
export function contarChamadosPorDefeito(vinculos: ReadonlyMap<string, string>): Map<string, number> {
  const contagem = new Map<string, number>();
  for (const defeito of vinculos.values()) contagem.set(defeito, (contagem.get(defeito) ?? 0) + 1);
  return contagem;
}
