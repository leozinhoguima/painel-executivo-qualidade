import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { Sidebar } from "@/componentes/layout/Sidebar";
import { carregarBase } from "@/dados/repositorio";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Painel Executivo de Qualidade · Banco Aurora (fictício)",
    template: "%s · Qualidade · Banco Aurora (fictício)",
  },
  description:
    "Demonstração: resultados de testes automatizados traduzidos em indicadores para a gestão. Todos os dados são fictícios.",
};

function ultimaExecucao() {
  try {
    const ultima = carregarBase().rodadas.at(-1);
    return ultima ? { instante: ultima.instante, totalTestes: ultima.totalTestes } : null;
  } catch {
    // A página mostra o erro detalhado; a barra lateral só não exibe o rodapé.
    return null;
  }
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${plexSans.variable} antialiased`}>
      <body className="min-h-dvh font-sans lg:flex">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-cartao focus:px-4 focus:py-3 focus:text-[14px] focus:font-semibold"
        >
          Pular para o conteúdo
        </a>
        <Sidebar ultimaExecucao={ultimaExecucao()} />
        <main id="conteudo" className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
