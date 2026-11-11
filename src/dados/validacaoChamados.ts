import type {
  ArquivoChamados,
  BaseChamados,
  Catalogo,
  Chamado,
  ChamadoArmazenado,
  EventoChamadoArmazenado,
  TipoEventoChamado,
} from "@/dominio/tipos";
import { CANAIS, CATEGORIAS } from "@/dominio/regras/chamados";
import { CRITICIDADES, ErroDadosInvalidos, lista, objeto, texto, textoOpcional, umDe } from "./validacao";

const TIPOS_EVENTO: readonly TipoEventoChamado[] = ["abertura", "fechamento", "reabertura"];

function dataHoraValida(valor: string, origem: string, onde: string): number {
  const instante = Date.parse(valor);
  if (Number.isNaN(instante)) throw new ErroDadosInvalidos(origem, `data e hora inválida em ${onde}: ${valor}`);
  return instante;
}

/**
 * Valida a exportação da central de chamados (fictícia). Garante, para cada
 * chamado, a sequência abertura → fechamento → reabertura → fechamento…,
 * em ordem cronológica e sem eventos depois de `geradoAte`.
 */
export function validarArquivoChamados(bruto: unknown, catalogo: Catalogo, origem = "chamados.json"): ArquivoChamados {
  const raiz = objeto(bruto, origem, "raiz");
  if (raiz.versao !== 1) throw new ErroDadosInvalidos(origem, `"versao" deveria ser 1`);
  const geradoAte = texto(raiz, "geradoAte", origem);
  const limite = dataHoraValida(geradoAte, origem, "geradoAte");

  const sistemas = new Set(catalogo.sistemas.map((s) => s.id));
  const funcionalidades = new Map(catalogo.funcionalidades.map((f) => [f.id, f.sistemaId]));
  const codigos = new Set<string>();

  const chamados: ChamadoArmazenado[] = lista(raiz.chamados, origem, "chamados").map((item, i) => {
    const o = objeto(item, origem, `chamados[${i}]`);
    const codigo = texto(o, "codigo", origem);
    if (codigos.has(codigo)) throw new ErroDadosInvalidos(origem, `chamado repetido "${codigo}"`);
    codigos.add(codigo);

    const sistemaId = texto(o, "sistemaId", origem);
    if (!sistemas.has(sistemaId)) {
      throw new ErroDadosInvalidos(origem, `chamado "${codigo}" aponta para sistema inexistente "${sistemaId}"`);
    }
    const funcionalidadeId = textoOpcional(o, "funcionalidadeId", origem);
    if (funcionalidadeId !== undefined && funcionalidades.get(funcionalidadeId) !== sistemaId) {
      throw new ErroDadosInvalidos(origem, `chamado "${codigo}": funcionalidade "${funcionalidadeId}" não pertence a "${sistemaId}"`);
    }

    let anterior = -Infinity;
    const eventos: EventoChamadoArmazenado[] = lista(o.eventos, origem, `chamados[${i}].eventos`).map((bruta, j) => {
      const e = objeto(bruta, origem, `chamados[${i}].eventos[${j}]`);
      const tipo = umDe(e, "tipo", TIPOS_EVENTO, origem);
      const esperado = j === 0 ? "abertura" : j % 2 === 1 ? "fechamento" : "reabertura";
      if (tipo !== esperado) {
        throw new ErroDadosInvalidos(origem, `chamado "${codigo}": evento ${j + 1} deveria ser "${esperado}", veio "${tipo}"`);
      }
      const dataHora = texto(e, "dataHora", origem);
      const instante = dataHoraValida(dataHora, origem, `chamado "${codigo}"`);
      if (instante < anterior) throw new ErroDadosInvalidos(origem, `chamado "${codigo}": eventos fora de ordem`);
      if (instante > limite) throw new ErroDadosInvalidos(origem, `chamado "${codigo}": evento depois de "geradoAte"`);
      anterior = instante;
      return { tipo, dataHora };
    });
    if (eventos.length === 0) throw new ErroDadosInvalidos(origem, `chamado "${codigo}" sem eventos`);

    const chamado: ChamadoArmazenado = {
      codigo,
      sistemaId,
      categoria: umDe(o, "categoria", CATEGORIAS, origem),
      prioridade: umDe(o, "prioridade", CRITICIDADES, origem),
      canal: umDe(o, "canal", CANAIS, origem),
      motivo: texto(o, "motivo", origem),
      eventos,
    };
    if (funcionalidadeId !== undefined) chamado.funcionalidadeId = funcionalidadeId;
    return chamado;
  });

  const arquivo: ArquivoChamados = { versao: 1, geradoAte, chamados };
  const aviso = textoOpcional(raiz, "aviso", origem);
  if (aviso !== undefined) arquivo.aviso = aviso;
  return arquivo;
}

/** Converte a exportação validada no modelo de domínio, ordenado pela abertura. */
export function montarBaseChamados(catalogo: Catalogo, arquivo: ArquivoChamados): BaseChamados {
  const chamados: Chamado[] = arquivo.chamados.map((c) => {
    const eventos = c.eventos.map((e) => ({ tipo: e.tipo, instante: Date.parse(e.dataHora) }));
    return {
      codigo: c.codigo,
      sistemaId: c.sistemaId,
      ...(c.funcionalidadeId ? { funcionalidadeId: c.funcionalidadeId } : {}),
      categoria: c.categoria,
      prioridade: c.prioridade,
      canal: c.canal,
      motivo: c.motivo,
      abertura: eventos[0].instante,
      eventos,
    };
  });
  chamados.sort((a, b) => a.abertura - b.abertura || a.codigo.localeCompare(b.codigo));
  return { sistemas: catalogo.sistemas, referencia: Date.parse(arquivo.geradoAte), chamados };
}
