import Link from "next/link";
import { EstadoVazio } from "@/componentes/ui/Estados";

export default function NaoEncontrado() {
  return (
    <EstadoVazio
      titulo="Página não encontrada"
      descricao="O endereço acessado não existe neste painel de demonstração."
      acao={
        <Link
          href="/"
          className="mt-2 inline-flex min-h-11 items-center rounded-lg bg-marinho px-4 text-[14px] font-medium text-white hover:bg-marinho-ativo"
        >
          Voltar à visão executiva
        </Link>
      }
    />
  );
}
