import { defineConfig } from "@playwright/test";

const PORTA = 4010;

/**
 * Suíte de testes de API contra a API fictícia (demo-api/).
 * Sem navegador: usa apenas o cliente HTTP do Playwright.
 * O relatório JSON é a entrada do importador (npm run dados:importar).
 */
export default defineConfig({
  testDir: "tests/api",
  fullyParallel: true,
  workers: 6,
  // Falhas são o objeto de medição: sem novas tentativas, para não esconder instabilidade.
  retries: 0,
  timeout: 15_000,
  reporter: [["list"], ["json", { outputFile: "test-results/relatorio-playwright.json" }]],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    extraHTTPHeaders: { "content-type": "application/json" },
  },
  webServer: {
    command: "npm run api:demo",
    url: `http://localhost:${PORTA}/saude`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: "pipe",
  },
});
