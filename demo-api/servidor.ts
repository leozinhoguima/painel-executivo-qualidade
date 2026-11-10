/**
 * API FICTÍCIA de demonstração do Banco Aurora, com falhas configuráveis.
 * Uso: npm run api:demo   (porta 4010; DEMO_SEED fixa o sorteio das falhas)
 */
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { aplicarFalhas, falhasDaRequisicao, validarCenarios, type Resposta } from "./falhas";
import { encontrarRota } from "./rotas";

const PORTA = Number(process.env.PORTA ?? 4010);
const cenarios = validarCenarios(
  JSON.parse(readFileSync(path.join(process.cwd(), "demo-api", "cenarios.json"), "utf8")),
);

/** Seed do sorteio: fixa via DEMO_SEED ou, por padrão, data e hora (muda a cada minuto). */
const seed = process.env.DEMO_SEED ?? new Date().toISOString().slice(0, 16);
let contador = 0;

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORTA}`);
  const metodo = req.method ?? "GET";

  let bruto = "";
  for await (const parte of req) bruto += parte;

  const responder = (r: Resposta) => {
    const ehTexto = typeof r.corpo === "string";
    res.writeHead(r.status, {
      "content-type": r.tipoConteudo ?? (ehTexto ? "text/plain; charset=utf-8" : "application/json; charset=utf-8"),
      "x-ambiente": "demonstracao-ficticia",
    });
    res.end(r.corpo === undefined ? undefined : ehTexto ? r.corpo : JSON.stringify(r.corpo));
  };

  if (url.pathname === "/saude") return responder({ status: 200, corpo: { situacao: "ok", seed } });

  const encontrada = encontrarRota(metodo, url.pathname);
  if (!encontrada) return responder({ status: 404, corpo: { mensagem: "Rota inexistente na API fictícia." } });

  let corpo: Record<string, unknown> = {};
  try {
    corpo = bruto ? (JSON.parse(bruto) as Record<string, unknown>) : {};
  } catch {
    return responder({ status: 400, corpo: { mensagem: "Corpo da requisição não é um JSON válido." } });
  }

  const rota = `${metodo} ${encontrada.rota.padrao}`;
  const chave = req.headers["x-caso-teste"]?.toString() ?? `requisicao-${++contador}`;
  const falhas = falhasDaRequisicao(cenarios, rota, seed, chave);

  for (const f of falhas) if (f.tipo === "lentidao") await esperar(f.atrasoMs);

  const normal = encontrada.rota.tratar({ params: encontrada.params, query: url.searchParams, corpo });
  responder(aplicarFalhas(normal, falhas));
});

servidor.listen(PORTA, () => {
  const ativas = cenarios.filter((c) => c.ativa);
  console.log(`API fictícia do Banco Aurora em http://localhost:${PORTA} (seed "${seed}")`);
  console.log(`${ativas.length} falha(s) simulada(s) ativa(s):`);
  for (const c of ativas) console.log(`  • ${c.nome} — ${c.rota} (${Math.round(c.probabilidade * 100)}%)`);
});
