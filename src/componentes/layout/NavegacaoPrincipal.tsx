"use client";

import { FileText, Headset, LayoutGrid, List, Monitor, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS: { href: string; rotulo: string; Icone: LucideIcon }[] = [
  { href: "/", rotulo: "Visão executiva", Icone: LayoutGrid },
  { href: "/sistemas", rotulo: "Sistemas", Icone: Monitor },
  { href: "/execucoes", rotulo: "Execuções de teste", Icone: List },
  { href: "/sustentacao", rotulo: "Sustentação", Icone: Headset },
  { href: "/relatorio", rotulo: "Relatório semanal", Icone: FileText },
];

function estaAtivo(href: string, caminho: string) {
  return href === "/" ? caminho === "/" : caminho === href || caminho.startsWith(`${href}/`);
}

export function NavegacaoPrincipal() {
  const caminho = usePathname();
  return (
    <nav aria-label="Navegação principal">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {ITENS.map(({ href, rotulo, Icone }) => {
          const ativo = estaAtivo(href, caminho);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[14px] whitespace-nowrap transition-colors focus-visible:outline-white ${
                  ativo
                    ? "bg-marinho-ativo font-semibold text-white"
                    : "text-marinho-texto hover:bg-marinho-ativo/60 hover:text-white"
                }`}
              >
                <Icone aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={1.75} />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
