/**
 * Gerador pseudoaleatório determinístico (mulberry32).
 * A mesma seed sempre produz a mesma sequência — base do histórico fictício reproduzível.
 */
export function criarAleatorio(seed: number): () => number {
  let estado = seed >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
