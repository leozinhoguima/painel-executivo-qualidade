import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os dados ficam em JSON na pasta data/ e são lidos no servidor.
  outputFileTracingIncludes: {
    "/**": ["./data/**/*.json"],
  },
  // Evita que o indicador de desenvolvimento cubra o rodapé da barra lateral.
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
