import { describe, expect, it } from "vitest";
import { DIA_MS, HORA_MS } from "@/lib/datas";
import type { Chamado, Prioridade, TipoEventoChamado } from "../../tipos";
import {
  chamadosEmAberto,
  contarEventos,
  distribuir,
  estaEmAberto,
  estaForaDoPrazo,
  mediaPorDiaDaSemana,
  principaisProblemas,
  resumirAtendimento,
  taxaReabertura,
  variacaoRelativa,
} from "../chamados";

const t = (local: string) => Date.parse(`${local}:00-03:00`);

let sequencia = 0;
function chamado(
  eventos: [TipoEventoChamado, string][],
  extra: Partial<Pick<Chamado, "sistemaId" | "motivo" | "prioridade" | "categoria">> = {},
): Chamado {
  const lista = eventos.map(([tipo, em]) => ({ tipo, instante: t(em) }));
  return {
    codigo: `CH-${++sequencia}`,
    sistemaId: extra.sistemaId ?? "pix",
    categoria: extra.categoria ?? "duvida",
    prioridade: extra.prioridade ?? ("media" as Prioridade),
    canal: "app",
    motivo: extra.motivo ?? "Dúvida",
    abertura: lista[0].instante,
    eventos: lista,
  };
}

// Semana de 02/11 (segunda) a 09/11 (segunda, exclusivo).
const semana = { inicio: t("2026-11-02T00:00"), fim: t("2026-11-09T00:00") };

describe("contagem de eventos", () => {
  const chamados = [
    chamado([["abertura", "2026-11-03T10:00"], ["fechamento", "2026-11-04T10:00"]]),
    // Aberto antes, fechado e reaberto dentro, fechado de novo depois.
    chamado([
      ["abertura", "2026-10-30T10:00"],
      ["fechamento", "2026-11-02T09:00"],
      ["reabertura", "2026-11-05T09:00"],
      ["fechamento", "2026-11-10T09:00"],
    ]),
    chamado([["abertura", "2026-11-08T23:59"]]),
    chamado([["abertura", "2026-11-09T00:00"]]),
  ];

  it("conta aberturas, fechamentos e reaberturas dentro da janela [início, fim)", () => {
    expect(contarEventos(chamados, semana)).toEqual({ abertos: 2, fechados: 2, reabertos: 1 });
  });

  it("taxa de reabertura = reaberturas ÷ fechamentos do período", () => {
    expect(taxaReabertura({ abertos: 0, fechados: 2, reabertos: 1 })).toBe(0.5);
    expect(taxaReabertura({ abertos: 3, fechados: 0, reabertos: 0 })).toBeNull();
  });

  it("em aberto: o último evento até o instante é abertura ou reabertura", () => {
    const [, reaberto] = chamados;
    expect(estaEmAberto(reaberto, t("2026-10-31T00:00"))).toBe(true);
    expect(estaEmAberto(reaberto, t("2026-11-03T00:00"))).toBe(false);
    expect(estaEmAberto(reaberto, t("2026-11-06T00:00"))).toBe(true);
    expect(estaEmAberto(reaberto, t("2026-11-11T00:00"))).toBe(false);
    expect(estaEmAberto(reaberto, t("2026-10-01T00:00"))).toBe(false);
    expect(chamadosEmAberto(chamados, t("2026-11-09T06:00"))).toHaveLength(3);
  });
});

describe("prazo de atendimento", () => {
  it("considera a abertura até o primeiro fechamento, pelo prazo da prioridade", () => {
    const chamados = [
      // crítica: 4 h → 3 h está no prazo
      chamado([["abertura", "2026-11-03T08:00"], ["fechamento", "2026-11-03T11:00"]], { prioridade: "critica" }),
      // crítica: 5 h está fora
      chamado([["abertura", "2026-11-03T08:00"], ["fechamento", "2026-11-03T13:00"]], { prioridade: "critica" }),
      // média: 3 dias exatos ainda está no prazo; a reabertura não muda o primeiro fechamento
      chamado(
        [
          ["abertura", "2026-11-02T08:00"],
          ["fechamento", "2026-11-05T08:00"],
          ["reabertura", "2026-11-06T08:00"],
          ["fechamento", "2026-11-07T08:00"],
        ],
        { prioridade: "media" },
      ),
      // primeiro fechamento fora da janela: não entra
      chamado([["abertura", "2026-11-08T08:00"], ["fechamento", "2026-11-09T08:00"]]),
    ];
    const resumo = resumirAtendimento(chamados, semana);
    expect(resumo.resolvidos).toBe(3);
    expect(resumo.noPrazo).toBe(2);
    expect(resumo.taxaNoPrazo).toBeCloseTo(2 / 3);
    expect(resumo.tempoMedioMs).toBe((3 * HORA_MS + 5 * HORA_MS + 3 * DIA_MS) / 3);
  });

  it("sem chamados resolvidos, taxa e tempo médio ficam nulos", () => {
    expect(resumirAtendimento([], semana)).toEqual({ resolvidos: 0, noPrazo: 0, taxaNoPrazo: null, tempoMedioMs: null });
  });

  it("fora do prazo só vale para chamado em aberto além do limite", () => {
    const alto = chamado([["abertura", "2026-11-08T06:00"]], { prioridade: "alta" });
    expect(estaForaDoPrazo(alto, t("2026-11-09T05:00"))).toBe(false);
    expect(estaForaDoPrazo(alto, t("2026-11-09T07:00"))).toBe(true);
    const fechado = chamado([["abertura", "2026-11-01T06:00"], ["fechamento", "2026-11-08T06:00"]], { prioridade: "alta" });
    expect(estaForaDoPrazo(fechado, t("2026-11-09T07:00"))).toBe(false);
  });
});

describe("comparações e distribuições", () => {
  it("variação relativa, nula sem base", () => {
    expect(variacaoRelativa(15, 12)).toBeCloseTo(0.25);
    expect(variacaoRelativa(9, 12)).toBeCloseTo(-0.25);
    expect(variacaoRelativa(5, 0)).toBeNull();
    expect(variacaoRelativa(5, null)).toBeNull();
  });

  it("distribui do maior para o menor, mantendo categorias sem chamados", () => {
    const chamados = [
      chamado([["abertura", "2026-11-03T08:00"]], { categoria: "lentidao" }),
      chamado([["abertura", "2026-11-03T09:00"]], { categoria: "acesso" }),
      chamado([["abertura", "2026-11-03T10:00"]], { categoria: "acesso" }),
    ];
    const fatias = distribuir(chamados, (c) => c.categoria, ["indisponibilidade", "lentidao", "acesso"] as const);
    expect(fatias.map((f) => [f.chave, f.quantidade])).toEqual([
      ["acesso", 2],
      ["lentidao", 1],
      ["indisponibilidade", 0],
    ]);
    expect(fatias[0].fracao).toBeCloseTo(2 / 3);
    expect(distribuir([], (c) => c.categoria, ["acesso"] as const)[0].fracao).toBeNull();
  });

  it("média por dia da semana divide pelo número de semanas", () => {
    const semanas = [
      { inicio: t("2026-10-26T00:00"), fim: t("2026-11-02T00:00") },
      { inicio: t("2026-11-02T00:00"), fim: t("2026-11-09T00:00") },
    ];
    const chamados = [
      chamado([["abertura", "2026-10-26T10:00"]]), // segunda
      chamado([["abertura", "2026-11-02T10:00"]]), // segunda
      chamado([["abertura", "2026-11-02T11:00"]]), // segunda
      chamado([["abertura", "2026-11-08T11:00"]]), // domingo
    ];
    expect(mediaPorDiaDaSemana(chamados, semanas)).toEqual([1.5, 0, 0, 0, 0, 0, 0.5]);
  });

  it("principais problemas agrupam por sistema + motivo e comparam com o período anterior", () => {
    const anterior = { inicio: t("2026-10-26T00:00"), fim: semana.inicio };
    const chamados = [
      chamado([["abertura", "2026-11-03T08:00"]], { motivo: "QR Code falha" }),
      chamado([["abertura", "2026-11-04T08:00"], ["fechamento", "2026-11-04T09:00"]], { motivo: "QR Code falha" }),
      chamado([["abertura", "2026-10-28T08:00"]], { motivo: "QR Code falha" }),
      chamado([["abertura", "2026-11-03T08:00"]], { motivo: "QR Code falha", sistemaId: "cartoes" }),
      chamado([["abertura", "2026-10-28T08:00"]], { motivo: "Só no anterior" }),
    ];
    const problemas = principaisProblemas(chamados, semana, anterior, t("2026-11-09T06:00"), 5);
    expect(problemas).toEqual([
      { sistemaId: "pix", motivo: "QR Code falha", quantidade: 2, quantidadeAnterior: 1, emAberto: 2 },
      { sistemaId: "cartoes", motivo: "QR Code falha", quantidade: 1, quantidadeAnterior: 0, emAberto: 1 },
    ]);
  });
});
