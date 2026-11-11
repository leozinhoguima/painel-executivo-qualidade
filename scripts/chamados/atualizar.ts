import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { carregarBase } from "@/dados/repositorio";
import { validarCatalogo } from "@/dados/validacao";
import { validarArquivoChamados } from "@/dados/validacaoChamados";
import { paraIsoLocal } from "@/lib/datas";
import { CENARIO_CHAMADOS } from "./cenarios";
import { gerarChamados, serializarChamados } from "./gerador";

/**
 * Regrava data/chamados/chamados.json até `ate` (padrão: a última rodada de
 * testes, para que a sustentação e os testes tenham a mesma data de referência).
 */
export function atualizarChamados(ate?: string) {
  const raiz = process.cwd();
  const catalogo = validarCatalogo(JSON.parse(readFileSync(path.join(raiz, "data", "catalogo.json"), "utf8")));

  let geradoAte = ate;
  if (!geradoAte) {
    const ultima = carregarBase().rodadas.at(-1);
    if (!ultima) throw new Error("Não há rodadas de teste para definir a data dos chamados.");
    geradoAte = paraIsoLocal(ultima.instante);
  }

  const arquivo = gerarChamados(catalogo, CENARIO_CHAMADOS, geradoAte);
  validarArquivoChamados(arquivo, catalogo);

  const pasta = path.join(raiz, "data", "chamados");
  mkdirSync(pasta, { recursive: true });
  const destino = path.join(pasta, "chamados.json");
  writeFileSync(destino, serializarChamados(arquivo), "utf8");
  return { geradoAte: arquivo.geradoAte, total: arquivo.chamados.length, destino: path.relative(raiz, destino) };
}
