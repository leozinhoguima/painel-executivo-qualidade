import { describe, expect, it } from "vitest";
import {
  diasEntre,
  inicioDaSemana,
  instanteLocal,
  paraDataLocal,
  semanaIso,
  semanasFechadas,
  ultimaSemanaFechada,
} from "./datas";

const em = (iso: string) => Date.parse(iso);

describe("datas no fuso de São Paulo", () => {
  it("converte para data local com deslocamento de −03:00", () => {
    // 02:00 UTC de 03/11 ainda é 23:00 de 02/11 em São Paulo
    const l = paraDataLocal(em("2026-11-03T02:00:00Z"));
    expect([l.dia, l.mes, l.hora, l.diaSemana]).toEqual([2, 11, 23, 0]);
  });

  it("a semana começa na segunda-feira 00:00 local", () => {
    expect(inicioDaSemana(em("2026-11-08T23:59:00-03:00"))).toBe(instanteLocal(2026, 11, 2));
    expect(inicioDaSemana(em("2026-11-09T00:00:00-03:00"))).toBe(instanteLocal(2026, 11, 9));
  });

  it("calcula a semana ISO, inclusive na virada do ano", () => {
    expect(semanaIso(instanteLocal(2026, 11, 2)).numero).toBe(45);
    expect(semanaIso(instanteLocal(2026, 1, 1))).toEqual({ ano: 2026, numero: 1 });
    // 01/01/2027 é sexta-feira: pertence à semana 53 de 2026
    expect(semanaIso(instanteLocal(2027, 1, 1))).toEqual({ ano: 2026, numero: 53 });
  });

  it("a última semana fechada é a anterior à semana da referência", () => {
    const semana = ultimaSemanaFechada(em("2026-11-09T06:00:00-03:00"));
    expect(semana.numero).toBe(45);
    expect(semana.inicio).toBe(instanteLocal(2026, 11, 2));
    expect(semana.fim).toBe(instanteLocal(2026, 11, 9));
  });

  it("lista semanas fechadas da mais antiga para a mais nova", () => {
    const semanas = semanasFechadas(em("2026-11-09T06:00:00-03:00"), 6);
    expect(semanas.map((s) => s.numero)).toEqual([40, 41, 42, 43, 44, 45]);
  });

  it("conta dias corridos completos e nunca negativos", () => {
    expect(diasEntre(em("2026-11-04T06:00:00-03:00"), em("2026-11-09T06:00:00-03:00"))).toBe(5);
    expect(diasEntre(em("2026-11-04T06:00:00-03:00"), em("2026-11-05T05:59:00-03:00"))).toBe(0);
    expect(diasEntre(em("2026-11-05T00:00:00-03:00"), em("2026-11-04T00:00:00-03:00"))).toBe(0);
  });
});
