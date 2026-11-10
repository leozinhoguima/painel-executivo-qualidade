import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validarCatalogo } from "@/dados/validacao";
import { aplicarFalhas, falhasDaRequisicao, sortear, validarCenarios, type Cenario } from "./falhas";
import { encontrarRota, ROTAS } from "./rotas";

const ler = (...p: string[]) => JSON.parse(readFileSync(path.join(process.cwd(), ...p), "utf8"));

describe("API fictícia: rotas", () => {
  const catalogo = validarCatalogo(ler("data", "catalogo.json"));

  it("toda requisição do catálogo de testes tem uma rota na API", () => {
    const rotas = new Set(ROTAS.map((r) => `${r.metodo} ${r.padrao}`));
    const semRota = catalogo.casos
      .map((c) => c.requisicao.split("?")[0])
      .filter((req) => !rotas.has(req));
    expect(semRota).toEqual([]);
  });

  it("prefere a rota fixa à rota com parâmetro", () => {
    expect(encontrarRota("GET", "/transferencias/agendamentos")?.rota.padrao).toBe("/transferencias/agendamentos");
    expect(encontrarRota("GET", "/transferencias/TR-9")?.params).toEqual({ id: "TR-9" });
    expect(encontrarRota("GET", "/nao-existe")).toBeNull();
  });
});

describe("API fictícia: falhas configuráveis", () => {
  it("o arquivo de cenários é válido e toda rota configurada existe", () => {
    const cenarios = validarCenarios(ler("demo-api", "cenarios.json"));
    const rotas = new Set(ROTAS.map((r) => `${r.metodo} ${r.padrao}`));
    for (const c of cenarios) expect(rotas.has(c.rota), c.rota).toBe(true);
  });

  it("rejeita configuração inválida com mensagem clara", () => {
    expect(() => validarCenarios({ falhas: [{ nome: "x", rota: "GET /a", tipo: "magica", probabilidade: 1 }] })).toThrow(
      /tipo desconhecido/,
    );
    expect(() => validarCenarios({ falhas: [{ nome: "x", rota: "GET /a", tipo: "status", status: 500, probabilidade: 2 }] })).toThrow(
      /probabilidade/,
    );
  });

  it("o sorteio é determinístico e respeita a probabilidade", () => {
    expect(sortear("s1", "caso-1")).toBe(sortear("s1", "caso-1"));
    const cenario: Cenario = { nome: "x", rota: "GET /a", tipo: "status", status: 500, probabilidade: 0.3, ativa: true };
    const sorteadas = Array.from({ length: 2000 }, (_, i) => falhasDaRequisicao([cenario], "GET /a", "seed", `c${i}`).length);
    const proporcao = sorteadas.reduce((a, b) => a + b, 0) / sorteadas.length;
    expect(proporcao).toBeGreaterThan(0.25);
    expect(proporcao).toBeLessThan(0.35);
    expect(falhasDaRequisicao([{ ...cenario, ativa: false }], "GET /a", "seed", "c1")).toEqual([]);
  });

  it("aplica cada tipo de falha só onde faz sentido", () => {
    const sucesso = { status: 201, corpo: { valorOriginal: 50, valorDevolvido: 25, dataHora: "x" } };
    expect(aplicarFalhas(sucesso, [{ tipo: "status", status: 502 }]).status).toBe(502);
    expect(aplicarFalhas(sucesso, [{ tipo: "campo-ausente", campo: "dataHora" }]).corpo).not.toHaveProperty("dataHora");
    expect(aplicarFalhas(sucesso, [{ tipo: "valor-incorreto", campo: "valorDevolvido", copiarDe: "valorOriginal" }]).corpo).toMatchObject({
      valorDevolvido: 50,
    });
    const recusa = { status: 422, corpo: { mensagem: "Saldo insuficiente." } };
    expect(aplicarFalhas(recusa, [{ tipo: "mensagem-generica", texto: "Erro 0x51" }]).corpo).toEqual({ mensagem: "Erro 0x51" });
    // Mensagem genérica não altera respostas de sucesso
    expect(aplicarFalhas(sucesso, [{ tipo: "mensagem-generica", texto: "Erro 0x51" }])).toEqual(sucesso);
  });
});
