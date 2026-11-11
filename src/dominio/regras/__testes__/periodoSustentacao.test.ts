import { describe, expect, it } from "vitest";
import { formatarDataHora } from "@/lib/formatacao";
import { diasAte, lerRecorte, mesesFechados, periodoSustentacao } from "../periodoSustentacao";

const t = (local: string) => Date.parse(`${local}:00-03:00`);
const janela = (j: { inicio: number; fim: number }) => [formatarDataHora(j.inicio), formatarDataHora(j.fim)];

describe("recortes da sustentação", () => {
  const referencia = t("2026-11-09T06:00"); // segunda-feira

  it("lê o recorte da URL e usa a semana como padrão", () => {
    expect(lerRecorte("dia")).toBe("dia");
    expect(lerRecorte(["mes"])).toBe("mes");
    expect(lerRecorte("ano")).toBe("semana");
    expect(lerRecorte(undefined)).toBe("semana");
  });

  it("dia: o último dia completo vs. o mesmo dia da semana anterior", () => {
    const p = periodoSustentacao(referencia, "dia");
    expect(janela(p.atual)).toEqual(["08/11/2026, 00:00", "09/11/2026, 00:00"]);
    expect(janela(p.anterior)).toEqual(["01/11/2026, 00:00", "02/11/2026, 00:00"]);
  });

  it("semana: a última semana fechada vs. a anterior", () => {
    const p = periodoSustentacao(referencia, "semana");
    expect(janela(p.atual)).toEqual(["02/11/2026, 00:00", "09/11/2026, 00:00"]);
    expect(janela(p.anterior)).toEqual(["26/10/2026, 00:00", "02/11/2026, 00:00"]);
  });

  it("mês: até o último dia completo vs. os mesmos dias do mês anterior", () => {
    const p = periodoSustentacao(referencia, "mes");
    expect(janela(p.atual)).toEqual(["01/11/2026, 00:00", "09/11/2026, 00:00"]);
    expect(janela(p.anterior)).toEqual(["01/10/2026, 00:00", "09/10/2026, 00:00"]);
  });

  it("mês: no dia 1, mostra o mês anterior inteiro vs. o mês antes dele", () => {
    const p = periodoSustentacao(t("2026-12-01T06:00"), "mes");
    expect(janela(p.atual)).toEqual(["01/11/2026, 00:00", "01/12/2026, 00:00"]);
    expect(janela(p.anterior)).toEqual(["01/10/2026, 00:00", "01/11/2026, 00:00"]);
  });

  it("mês: limita a comparação ao tamanho do mês anterior (31/03 vs. fevereiro)", () => {
    const p = periodoSustentacao(t("2027-03-31T06:00"), "mes");
    expect(janela(p.atual)).toEqual(["01/03/2027, 00:00", "31/03/2027, 00:00"]);
    expect(janela(p.anterior)).toEqual(["01/02/2027, 00:00", "01/03/2027, 00:00"]);
  });

  it("mês: atravessa a virada do ano", () => {
    const p = periodoSustentacao(t("2027-01-10T06:00"), "mes");
    expect(janela(p.anterior)).toEqual(["01/12/2026, 00:00", "10/12/2026, 00:00"]);
  });
});

describe("janelas dos gráficos", () => {
  it("dias completos até o fim, do mais antigo ao mais novo", () => {
    const dias = diasAte(t("2026-11-09T00:00"), 3);
    expect(dias.map((d) => formatarDataHora(d.inicio))).toEqual([
      "06/11/2026, 00:00",
      "07/11/2026, 00:00",
      "08/11/2026, 00:00",
    ]);
  });

  it("meses fechados antes do mês da referência", () => {
    const meses = mesesFechados(t("2026-11-09T06:00"), 6);
    expect(meses.map((m) => formatarDataHora(m.inicio).slice(0, 10))).toEqual([
      "01/05/2026",
      "01/06/2026",
      "01/07/2026",
      "01/08/2026",
      "01/09/2026",
      "01/10/2026",
    ]);
    expect(formatarDataHora(meses[5].fim)).toBe("01/11/2026, 00:00");
  });
});
