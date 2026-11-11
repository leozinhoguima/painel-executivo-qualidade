import { criarAleatorio } from "@/lib/aleatorio";
import { DIA_MS, HORA_MS, inicioDoDia, instanteLocal, MINUTO_MS, paraDataLocal, paraIsoLocal } from "@/lib/datas";
import { PRAZO_ATENDIMENTO_MS } from "@/dominio/regras/parametros";
import type {
  ArquivoChamados,
  Catalogo,
  ChamadoArmazenado,
  Instante,
  Prioridade,
  TipoEventoChamado,
} from "@/dominio/tipos";
import type { CenarioChamados, Surto } from "./cenarios";

type Aleatorio = () => number;

const comFuso = (local: string) => (/[+-]\d\d:\d\d$|Z$/.test(local) ? local : `${local}:00-03:00`);

/** Sorteio de Poisson (Knuth): quantidade de chamados num dia com média `media`. */
export function sortearPoisson(aleatorio: Aleatorio, media: number): number {
  if (media <= 0) return 0;
  const limite = Math.exp(-media);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= aleatorio();
  } while (p > limite);
  return k - 1;
}

function sortearPeso<K extends string>(aleatorio: Aleatorio, pesos: Partial<Record<K, number>>): K {
  const itens = Object.entries(pesos) as [K, number][];
  const total = itens.reduce((acc, [, p]) => acc + p, 0);
  let alvo = aleatorio() * total;
  for (const [chave, peso] of itens) {
    alvo -= peso;
    if (alvo < 0) return chave;
  }
  return itens[itens.length - 1][0];
}

function sortearItem<T>(aleatorio: Aleatorio, itens: readonly T[]): T {
  return itens[Math.min(itens.length - 1, Math.floor(aleatorio() * itens.length))];
}

/** Instante de abertura dentro de [inicio, fim), respeitando o movimento ao longo do dia. */
function sortearHorario(aleatorio: Aleatorio, pesoHora: number[], inicio: Instante, fim: Instante): Instante {
  const horaInicial = paraDataLocal(inicio).hora;
  const horaFinal = Math.ceil((fim - inicioDoDia(inicio)) / HORA_MS);
  const pesos: Partial<Record<string, number>> = {};
  for (let h = horaInicial; h < Math.min(24, horaFinal); h++) pesos[String(h)] = pesoHora[h];
  const hora = Number(sortearPeso(aleatorio, pesos));
  const instante = inicioDoDia(inicio) + hora * HORA_MS + Math.floor(aleatorio() * 60) * MINUTO_MS;
  return Math.min(Math.max(instante, inicio), fim - MINUTO_MS);
}

const arredondarMinuto = (instante: Instante) => Math.round(instante / MINUTO_MS) * MINUTO_MS;

interface Ciclo {
  abertura: Instante;
  prioridade: Prioridade;
  /** Fechamento já decidido (surto com correção conhecida); senão, sorteado pelo prazo. */
  fechamento?: Instante;
  probabilidadeNoPrazo: number;
  probabilidadeReabertura: number;
}

/**
 * Vida do chamado: abertura, fechamento e, às vezes, uma reabertura seguida de
 * novo fechamento. Decidida inteira no dia da abertura, para que o dia de amanhã
 * nunca altere o de hoje.
 */
function sortearEventos(aleatorio: Aleatorio, ciclo: Ciclo): { tipo: TipoEventoChamado; instante: Instante }[] {
  const prazo = PRAZO_ATENDIMENTO_MS[ciclo.prioridade];
  const noPrazo = aleatorio() < ciclo.probabilidadeNoPrazo;
  const fator = noPrazo ? 0.05 + aleatorio() * 0.9 : 1.05 + aleatorio() * 1.5;
  const fechamento = arredondarMinuto(ciclo.fechamento ?? ciclo.abertura + prazo * fator);
  const eventos: { tipo: TipoEventoChamado; instante: Instante }[] = [
    { tipo: "abertura", instante: ciclo.abertura },
    { tipo: "fechamento", instante: Math.max(fechamento, ciclo.abertura + 15 * MINUTO_MS) },
  ];
  if (aleatorio() < ciclo.probabilidadeReabertura) {
    const reabertura = arredondarMinuto(eventos[1].instante + 2 * HORA_MS + aleatorio() * 3 * DIA_MS);
    const novoFechamento = arredondarMinuto(reabertura + prazo * (0.2 + aleatorio() * 0.8));
    eventos.push({ tipo: "reabertura", instante: reabertura }, { tipo: "fechamento", instante: novoFechamento });
  }
  return eventos;
}

interface ChamadoDoDia extends Omit<ChamadoArmazenado, "codigo" | "eventos"> {
  eventos: { tipo: TipoEventoChamado; instante: Instante }[];
}

/** Semente própria de cada dia: o mesmo dia gera sempre os mesmos chamados. */
export function seedDoDia(seed: number, indiceDia: number): number {
  return (seed + Math.imul(indiceDia + 1, 0x9e3779b1)) >>> 0;
}

function gerarDia(
  catalogo: Catalogo,
  cenario: CenarioChamados,
  surtos: (Surto & { inicioMs: Instante; fimMs: Instante })[],
  inicioDia: Instante,
  indiceDia: number,
): ChamadoDoDia[] {
  const aleatorio = criarAleatorio(seedDoDia(cenario.seed, indiceDia));
  const fimDia = inicioDia + DIA_MS;
  const local = paraDataLocal(inicioDia);
  const fatorDia =
    cenario.fatorDiaSemana[local.diaSemana] *
    (cenario.fatorMes[local.mes] ?? 1) *
    (local.dia <= 5 ? cenario.fatorInicioMes : 1);
  const chamados: ChamadoDoDia[] = [];

  // Volume de base, sistema por sistema (ordem do catálogo).
  for (const sistema of catalogo.sistemas) {
    const quantidade = sortearPoisson(aleatorio, (cenario.volumeBase[sistema.id] ?? 0) * fatorDia);
    for (let i = 0; i < quantidade; i++) {
      const perfil = sortearPeso(aleatorio, Object.fromEntries(cenario.categorias.map((c, j) => [String(j), c.peso])));
      const categoria = cenario.categorias[Number(perfil)];
      const prioridade = sortearPeso(aleatorio, categoria.prioridades);
      const abertura = sortearHorario(aleatorio, cenario.pesoHora, inicioDia, fimDia);
      chamados.push({
        sistemaId: sistema.id,
        categoria: categoria.categoria,
        prioridade,
        canal: sortearPeso(aleatorio, cenario.canais),
        motivo: sortearItem(aleatorio, categoria.motivos),
        eventos: sortearEventos(aleatorio, {
          abertura,
          prioridade,
          probabilidadeNoPrazo: cenario.probabilidadeNoPrazo,
          probabilidadeReabertura: cenario.probabilidadeReabertura,
        }),
      });
    }
  }

  // Surtos ativos no dia, proporcionais às horas de problema.
  const funcionalidades = new Map(catalogo.funcionalidades.map((f) => [f.id, f]));
  for (const surto of surtos) {
    const inicio = Math.max(inicioDia, surto.inicioMs);
    const fim = Math.min(fimDia, surto.fimMs);
    if (fim <= inicio) continue;
    const funcionalidade = funcionalidades.get(surto.funcionalidadeId);
    if (!funcionalidade) throw new Error(`Surto aponta para funcionalidade inexistente: ${surto.funcionalidadeId}`);
    const quantidade = sortearPoisson(aleatorio, surto.chamadosPorDia * ((fim - inicio) / DIA_MS));
    for (let i = 0; i < quantidade; i++) {
      const abertura = sortearHorario(aleatorio, cenario.pesoHora, inicio, fim);
      // Problema com correção conhecida: o chamado fecha logo depois da correção.
      // Problema ainda aberto: a equipe orienta o cliente e fecha, quase sempre fora do prazo.
      const corrigido = Number.isFinite(surto.fimMs);
      chamados.push({
        sistemaId: funcionalidade.sistemaId,
        funcionalidadeId: funcionalidade.id,
        categoria: surto.categoria,
        prioridade: surto.prioridade,
        canal: sortearPeso(aleatorio, cenario.canais),
        motivo: surto.motivo,
        eventos: sortearEventos(aleatorio, {
          abertura,
          prioridade: surto.prioridade,
          fechamento: corrigido ? surto.fimMs + aleatorio() * 12 * HORA_MS : undefined,
          probabilidadeNoPrazo: 0.3,
          probabilidadeReabertura: surto.probabilidadeReabertura,
        }),
      });
    }
  }

  return chamados.sort((a, b) => a.eventos[0].instante - b.eventos[0].instante || a.motivo.localeCompare(b.motivo));
}

/**
 * Gera a exportação da central de chamados fictícia até `geradoAte`.
 * Cada dia tem a própria semente e decide a vida inteira dos seus chamados;
 * a exportação só mostra o que já aconteceu até `geradoAte`. Assim, gerar de
 * novo um dia depois mantém todo o passado e só acrescenta o que é novo.
 */
export function gerarChamados(catalogo: Catalogo, cenario: CenarioChamados, geradoAte: string): ArquivoChamados {
  const limite = Date.parse(geradoAte);
  if (Number.isNaN(limite)) throw new Error(`Data inválida: ${geradoAte}`);
  const [ano, mes, dia] = cenario.inicio.split("-").map(Number);
  const primeiroDia = instanteLocal(ano, mes, dia);
  const surtos = cenario.surtos.map((s) => ({
    ...s,
    inicioMs: Date.parse(comFuso(s.inicio)),
    fimMs: s.fim === null ? Infinity : Date.parse(comFuso(s.fim)),
  }));

  const chamados: ChamadoArmazenado[] = [];
  for (let indice = 0, inicioDia = primeiroDia; inicioDia <= limite; indice++, inicioDia += DIA_MS) {
    const l = paraDataLocal(inicioDia);
    const prefixo = `CH-${l.ano}${String(l.mes).padStart(2, "0")}${String(l.dia).padStart(2, "0")}`;
    gerarDia(catalogo, cenario, surtos, inicioDia, indice).forEach((c, i) => {
      const eventos = c.eventos.filter((e) => e.instante <= limite);
      if (eventos.length === 0) return;
      chamados.push({
        codigo: `${prefixo}-${String(i + 1).padStart(3, "0")}`,
        sistemaId: c.sistemaId,
        ...(c.funcionalidadeId ? { funcionalidadeId: c.funcionalidadeId } : {}),
        categoria: c.categoria,
        prioridade: c.prioridade,
        canal: c.canal,
        motivo: c.motivo,
        eventos: eventos.map((e) => ({ tipo: e.tipo, dataHora: paraIsoLocal(e.instante) })),
      });
    });
  }

  return {
    versao: 1,
    aviso:
      "Chamados FICTÍCIOS gerados automaticamente (seed fixa) para demonstração. Não representam clientes nem sistemas reais.",
    geradoAte: paraIsoLocal(limite),
    chamados,
  };
}

/** Um chamado por linha: arquivo legível e diferenças pequenas no Git. */
export function serializarChamados(arquivo: ArquivoChamados): string {
  const cabecalho = [`  "versao": ${arquivo.versao},`];
  if (arquivo.aviso) cabecalho.push(`  "aviso": ${JSON.stringify(arquivo.aviso)},`);
  cabecalho.push(`  "geradoAte": ${JSON.stringify(arquivo.geradoAte)},`);
  const linhas = arquivo.chamados.map((c) => `    ${JSON.stringify(c)}`).join(",\n");
  return `{\n${cabecalho.join("\n")}\n  "chamados": [\n${linhas}\n  ]\n}\n`;
}
