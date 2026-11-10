import { criarAleatorio } from "@/lib/aleatorio";
import { HORA_MS } from "@/lib/datas";
import type { ArquivoExecucoes, Catalogo, ExecucaoArmazenada, RodadaArmazenada } from "@/dominio/tipos";
import type { Incidente } from "./cenarios";

export interface ParametrosHistorico {
  seed: number;
  primeiraRodada: string;
  ultimaRodada: string;
  intervaloHoras: number;
  probabilidadeRuido: number;
  incidentes: Incidente[];
}

const comFuso = (local: string) => (/[+-]\d\d:\d\d$|Z$/.test(local) ? local : `${local}:00-03:00`);

/** "2026-11-09T06:00:00-03:00" a partir de um instante (fuso fixo −03:00). */
export function isoLocal(instante: number): string {
  const d = new Date(instante - 3 * HORA_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00-03:00`;
}

/**
 * Gera o histórico fictício de forma determinística: mesma seed e mesmos
 * parâmetros produzem exatamente o mesmo arquivo.
 */
export function gerarHistorico(catalogo: Catalogo, parametros: ParametrosHistorico): ArquivoExecucoes {
  const aleatorio = criarAleatorio(parametros.seed);
  const incidentes = parametros.incidentes.map((i) => ({
    ...i,
    inicioMs: Date.parse(comFuso(i.inicio)),
    fimMs: Date.parse(comFuso(i.fim)),
    casosSet: new Set(i.casos),
  }));

  // Duração típica de cada caso, sorteada uma vez (entre 180 e 1400 ms).
  const duracaoBase = new Map(catalogo.casos.map((c) => [c.id, 180 + Math.round(aleatorio() * 1220)]));

  const rodadas: RodadaArmazenada[] = [];
  const inicio = Date.parse(parametros.primeiraRodada);
  const fim = Date.parse(parametros.ultimaRodada);

  for (let instante = inicio; instante <= fim; instante += parametros.intervaloHoras * HORA_MS) {
    const dataHora = isoLocal(instante);
    const execucoes: ExecucaoArmazenada[] = catalogo.casos.map((caso) => {
      const ativo = incidentes.find(
        (i) => i.casosSet.has(caso.id) && instante >= i.inicioMs && instante <= i.fimMs,
      );
      const sorteio = aleatorio();
      const variacao = 0.7 + aleatorio() * 0.6;
      const base = duracaoBase.get(caso.id) ?? 500;

      if (ativo && sorteio < ativo.probabilidade) {
        return {
          casoId: caso.id,
          resultado: "falha",
          duracaoMs: ativo.duracaoFalhaMs ?? Math.round(base * variacao),
          erroTecnico: ativo.erro.replace("{req}", caso.requisicao),
        };
      }
      if (!ativo && sorteio < parametros.probabilidadeRuido) {
        return {
          casoId: caso.id,
          resultado: "falha",
          duracaoMs: 10000,
          erroTecnico: `Tempo limite de 10000 ms excedido em ${caso.requisicao}`,
        };
      }
      return { casoId: caso.id, resultado: "sucesso", duracaoMs: Math.round(base * variacao) };
    });

    rodadas.push({
      id: `hist-${dataHora.slice(0, 16).replace(/[-:]/g, "").replace("T", "-")}`,
      dataHora,
      origem: "historico-ficticio",
      execucoes,
    });
  }

  return {
    versao: 1,
    aviso: "Histórico FICTÍCIO gerado automaticamente (seed fixa) para demonstração. Não representa nenhum sistema real.",
    rodadas,
  };
}

/**
 * Serializa com uma execução por linha: arquivo compacto, legível e com
 * diferenças pequenas no Git.
 */
export function serializarArquivo(arquivo: ArquivoExecucoes): string {
  const linhasRodadas = arquivo.rodadas.map((r) => {
    const execs = r.execucoes.map((e) => `        ${JSON.stringify(e)}`).join(",\n");
    return [
      "    {",
      `      "id": ${JSON.stringify(r.id)},`,
      `      "dataHora": ${JSON.stringify(r.dataHora)},`,
      `      "origem": ${JSON.stringify(r.origem)},`,
      `      "execucoes": [\n${execs}\n      ]`,
      "    }",
    ].join("\n");
  });
  const cabecalho = [`  "versao": ${arquivo.versao},`];
  if (arquivo.aviso) cabecalho.push(`  "aviso": ${JSON.stringify(arquivo.aviso)},`);
  return `{\n${cabecalho.join("\n")}\n  "rodadas": [\n${linhasRodadas.join(",\n")}\n  ]\n}\n`;
}
