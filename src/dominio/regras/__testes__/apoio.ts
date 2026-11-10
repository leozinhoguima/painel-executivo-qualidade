import { montarBase } from "@/dados/validacao";
import type {
  Acompanhamento,
  BaseQualidade,
  Catalogo,
  ExecucaoArmazenada,
  RegraTraducao,
} from "@/dominio/tipos";

/** Catálogo mínimo para testes: 2 sistemas, 3 funcionalidades, 4 casos. */
export const CATALOGO_TESTE: Catalogo = {
  sistemas: [
    { id: "pix", nome: "Pix", artigo: "o", area: "Pagamentos", prefixoDefeito: "PX" },
    { id: "cartoes", nome: "Cartões", artigo: "os", area: "Cartões", prefixoDefeito: "CT" },
  ],
  funcionalidades: [
    { id: "pix-chave", sistemaId: "pix", nome: "Envio por chave", criticidade: "critica", impactoNegocio: "clientes não enviam Pix" },
    { id: "pix-qr", sistemaId: "pix", nome: "Envio por QR Code", criticidade: "alta", impactoNegocio: "QR Code indisponível" },
    { id: "ct-limite", sistemaId: "cartoes", nome: "Consulta de limite", criticidade: "media", impactoNegocio: "limite demora" },
  ],
  casos: [
    { id: "chave-1", funcionalidadeId: "pix-chave", requisicao: "POST /pix", descricaoTecnica: "envio 1" },
    { id: "chave-2", funcionalidadeId: "pix-chave", requisicao: "POST /pix", descricaoTecnica: "envio 2" },
    { id: "qr-1", funcionalidadeId: "pix-qr", requisicao: "POST /pix/qr", descricaoTecnica: "qr 1" },
    { id: "limite-1", funcionalidadeId: "ct-limite", requisicao: "GET /limite", descricaoTecnica: "limite 1" },
  ],
};

export const REGRAS_TESTE: RegraTraducao[] = [
  { padrao: /^POST \/pix retornou 5\d\d/, descricao: "Falha no envio de Pix" },
];

/** Rodada simplificada: data/hora local (−03:00) e resultado por caso. */
export interface RodadaTeste {
  em: string;
  resultados: Record<string, "ok" | string>;
}

/**
 * Monta uma base a partir de rodadas descritas de forma compacta.
 * "ok" = sucesso; qualquer outro texto = falha com aquela mensagem técnica.
 */
export function criarBase(rodadas: RodadaTeste[], acompanhamento: Acompanhamento[] = []): BaseQualidade {
  return montarBase(
    CATALOGO_TESTE,
    [
      {
        origem: "teste",
        conteudo: {
          versao: 1,
          rodadas: rodadas.map((r, i) => ({
            id: `r${i}`,
            dataHora: `${r.em}:00-03:00`,
            origem: "historico-ficticio",
            execucoes: Object.entries(r.resultados).map(
              ([casoId, resultado]): ExecucaoArmazenada =>
                resultado === "ok"
                  ? { casoId, resultado: "sucesso", duracaoMs: 100 }
                  : { casoId, resultado: "falha", duracaoMs: 100, erroTecnico: resultado },
            ),
          })),
        },
      },
    ],
    acompanhamento,
    REGRAS_TESTE,
  );
}

export const instante = (local: string) => Date.parse(`${local}:00-03:00`);
