import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CENARIO_CHAMADOS } from "../../../scripts/chamados/cenarios";
import { gerarChamados } from "../../../scripts/chamados/gerador";
import { carregarBaseDemonstracao } from "@/dados/repositorio";
import { validarCatalogo } from "@/dados/validacao";
import { montarBaseChamados } from "@/dados/validacaoChamados";
import { abertosNaJanela, chamadosEmAberto } from "../regras/chamados";
import { montarVisaoGerente } from "./gerente";
import { consultaDosFiltrosChamados, lerFiltrosChamados, montarListaChamados } from "./listaChamados";

// Testes e chamados fixos em 09/11/2026 06:00, independentes do que o robô grava.
const qualidade = carregarBaseDemonstracao();
const catalogo = validarCatalogo(JSON.parse(readFileSync(path.join(process.cwd(), "data", "catalogo.json"), "utf8")));
const chamados = montarBaseChamados(catalogo, gerarChamados(catalogo, CENARIO_CHAMADOS, "2026-11-09T06:00:00-03:00"));

describe("visão do gerente com chamados", () => {
  const visao = montarVisaoGerente(qualidade, "abertura-conta", 30, chamados);
  if (!visao?.chamados) throw new Error("visão sem chamados");
  const dados = visao.chamados;

  it("as barras somam os chamados abertos no período", () => {
    expect(dados.barras.reduce((a, b) => a + b.abertos, 0)).toBe(dados.abertos);
    const doSistema = chamados.chamados.filter((c) => c.sistemaId === "abertura-conta");
    expect(dados.abertos).toBe(abertosNaJanela(doSistema, visao.janela).length);
    expect(dados.emAberto).toBe(chamadosEmAberto(doSistema, chamados.referencia).length);
  });

  it("agrupa por dia até 30 dias e por semana em 90", () => {
    expect(dados.agrupamento).toBe("dia");
    expect(dados.barras).toHaveLength(31);
    const noventa = montarVisaoGerente(qualidade, "abertura-conta", 90, chamados)?.chamados;
    expect(noventa?.agrupamento).toBe("semana");
    expect(noventa?.barras.reduce((a, b) => a + b.abertos, 0)).toBe(noventa?.abertos);
  });

  it("o defeito de validação de documentos já gerou chamados de clientes", () => {
    const documentos = visao.defeitos.find((d) => d.funcionalidadeId === "ac-documentos");
    expect(documentos?.chamados).toBeGreaterThan(40);
  });

  it("sem chamados, a visão continua só com os testes", () => {
    const semChamados = montarVisaoGerente(qualidade, "abertura-conta", 30);
    expect(semChamados?.chamados).toBeNull();
    expect(semChamados?.defeitos.every((d) => d.chamados === 0)).toBe(true);
  });
});

describe("lista técnica de chamados", () => {
  const ler = (p: Record<string, string>) => lerFiltrosChamados(p, catalogo);

  it("lê os filtros da URL e ignora valores inválidos", () => {
    const f = ler({ periodo: "90", sistema: "pix", funcionalidade: "ct-limite", tipo: "x", situacao: "em-aberto", pagina: "-2" });
    expect(f).toMatchObject({ periodo: 90, sistemaId: "pix", funcionalidadeId: null, categoria: null, situacao: "em-aberto", pagina: 1 });
    expect(ler({}).periodo).toBe(30);
    expect(ler({ defeito: "ac-104" }).defeito).toBe("AC-104");
    expect(ler({ defeito: "<script>" }).defeito).toBeNull();
  });

  it("a consulta omite os padrões e volta aos mesmos filtros", () => {
    const f = ler({ sistema: "pix", motivo: "Comprovante de Pix sem data e hora" });
    const consulta = consultaDosFiltrosChamados(f, { pagina: 2 });
    expect(consulta).toBe("?sistema=pix&motivo=Comprovante+de+Pix+sem+data+e+hora&pagina=2");
    expect(ler(Object.fromEntries(new URLSearchParams(consulta)))).toEqual({ ...f, pagina: 2 });
  });

  it("os contadores batem com os filtros e a página tem no máximo 50 linhas", () => {
    const lista = montarListaChamados(chamados, qualidade, ler({ situacao: "em-aberto", periodo: "90" }));
    if (!lista) throw new Error("lista ausente");
    expect(lista.emAberto).toBe(lista.total);
    expect(lista.linhas.length).toBeLessThanOrEqual(50);
    expect(lista.linhas.every((l) => l.situacao === "em-aberto")).toBe(true);
    const fora = montarListaChamados(chamados, qualidade, ler({ situacao: "fora-do-prazo", periodo: "90" }));
    expect(fora?.total).toBe(lista.foraDoPrazo);
  });

  it("o filtro de defeito ignora o período e bate com a coluna do gerente", () => {
    const gerente = montarVisaoGerente(qualidade, "abertura-conta", 7, chamados);
    const documentos = gerente?.defeitos.find((d) => d.funcionalidadeId === "ac-documentos");
    if (!documentos) throw new Error("defeito ausente");
    const lista = montarListaChamados(chamados, qualidade, ler({ defeito: documentos.codigo }));
    expect(lista?.janela).toBeNull();
    expect(lista?.total).toBe(documentos.chamados);
    expect(lista?.linhas.every((l) => l.defeito === documentos.codigo)).toBe(true);
  });

  it("ordena do mais recente para o mais antigo", () => {
    const lista = montarListaChamados(chamados, qualidade, ler({}));
    const aberturas = lista?.linhas.map((l) => l.abertura) ?? [];
    expect(aberturas).toEqual([...aberturas].sort((a, b) => b - a));
  });
});
