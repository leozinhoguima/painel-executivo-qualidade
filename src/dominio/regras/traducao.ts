import type { Funcionalidade, RegraTraducao } from "../tipos";

/**
 * Camada de tradução: converte a mensagem técnica de uma falha em uma
 * descrição de negócio.
 *
 * 1. Regras específicas de `data/traducoes.json` (expressão regular → descrição).
 * 2. Regras genéricas por tipo de erro (lentidão, indisponibilidade, recusa).
 * 3. Último recurso: "Resultado incorreto em “<funcionalidade>”".
 */
export function traduzirErro(
  erroTecnico: string | undefined,
  funcionalidade: Pick<Funcionalidade, "nome">,
  regras: readonly RegraTraducao[],
): string {
  const erro = erroTecnico ?? "";
  for (const regra of regras) {
    if (regra.padrao.test(erro)) return regra.descricao;
  }

  const nome = `“${funcionalidade.nome}”`;
  if (/tempo limite|timeout/i.test(erro)) return `Lentidão em ${nome}`;
  if (/retornou 5\d\d/.test(erro)) return `Falha em ${nome}`;
  if (/retornou 4\d\d/.test(erro)) return `${nome} recusada indevidamente`;
  return `Resultado incorreto em ${nome}`;
}
