import { describe, expect, it } from "vitest";
import type { Chamado, Defeito } from "../../tipos";
import { contarChamadosPorDefeito, vincularChamados } from "../vinculo";

const t = (local: string) => Date.parse(`${local}:00-03:00`);

function defeito(codigo: string, funcionalidadeId: string, abertoEm: string, resolvidoEm: string | null): Defeito {
  return {
    codigo,
    sistemaId: "pix",
    funcionalidadeId,
    casosAfetados: [],
    severidade: "alta",
    situacao: resolvidoEm ? "resolvido" : "aberto",
    abertoEm: t(abertoEm),
    resolvidoEm: resolvidoEm ? t(resolvidoEm) : null,
    descricaoNegocio: "Falha",
    erroTecnico: "erro",
    ocorrencias: 2,
  };
}

function chamado(codigo: string, abertura: string, funcionalidadeId?: string): Chamado {
  return {
    codigo,
    sistemaId: "pix",
    ...(funcionalidadeId ? { funcionalidadeId } : {}),
    categoria: "erro-transacao",
    prioridade: "alta",
    canal: "app",
    motivo: "Pix falha",
    abertura: t(abertura),
    eventos: [{ tipo: "abertura", instante: t(abertura) }],
  };
}

describe("ligação chamado ↔ defeito", () => {
  const defeitos = [
    defeito("PX-101", "pix-qr", "2026-09-10T06:00", "2026-09-15T06:00"),
    defeito("PX-102", "pix-qr", "2026-11-06T18:00", null),
    defeito("PX-103", "pix-chave", "2026-11-01T06:00", null),
  ];

  it("liga pela funcionalidade e pelo intervalo do defeito, com 1 dia de tolerância de cada lado", () => {
    const vinculos = vincularChamados(
      [
        chamado("dentro", "2026-09-12T10:00", "pix-qr"),
        chamado("antes-da-1a-falha", "2026-09-09T08:00", "pix-qr"),
        chamado("cedo-demais", "2026-09-09T05:00", "pix-qr"),
        chamado("depois-da-correcao", "2026-09-16T05:00", "pix-qr"),
        chamado("tarde-demais", "2026-09-16T07:00", "pix-qr"),
        chamado("defeito-em-aberto", "2026-11-09T05:00", "pix-qr"),
        chamado("outra-funcionalidade", "2026-09-12T10:00", "pix-chave"),
        chamado("sem-funcionalidade", "2026-09-12T10:00"),
      ],
      defeitos,
    );
    expect(Object.fromEntries(vinculos)).toEqual({
      dentro: "PX-101",
      "antes-da-1a-falha": "PX-101",
      "depois-da-correcao": "PX-101",
      "defeito-em-aberto": "PX-102",
    });
  });

  it("com dois defeitos possíveis, vale o aberto mais recentemente", () => {
    const sobrepostos = [
      defeito("PX-201", "pix-qr", "2026-11-01T06:00", "2026-11-05T06:00"),
      defeito("PX-202", "pix-qr", "2026-11-05T18:00", null),
    ];
    const vinculos = vincularChamados([chamado("c1", "2026-11-05T10:00", "pix-qr")], sobrepostos);
    expect(vinculos.get("c1")).toBe("PX-202");
  });

  it("conta os chamados por defeito", () => {
    const contagem = contarChamadosPorDefeito(
      new Map([
        ["a", "PX-101"],
        ["b", "PX-101"],
        ["c", "PX-102"],
      ]),
    );
    expect(Object.fromEntries(contagem)).toEqual({ "PX-101": 2, "PX-102": 1 });
  });
});
