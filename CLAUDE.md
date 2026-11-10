@AGENTS.md

# Painel Executivo de Qualidade

Projeto de portfólio: automação que transforma resultados de testes automatizados em informação para gestores não técnicos (diretores e gerentes). Instituição **fictícia**: Banco Aurora.

Cada tela responde em segundos: o sistema está pronto para ir ao ar? A qualidade melhora ou piora? Onde estão os problemas e que área de negócio afetam? Há algo crítico parado esperando decisão?

## Regras inegociáveis

- Somente dados e sistemas fictícios. Nenhum nome, dado ou sistema de empresa real.
- Nenhuma integração com sistemas reais nem credenciais corporativas.
- A interface sempre mostra "Ambiente de demonstração · dados fictícios".
- Indicadores sempre calculados a partir dos registros (nunca digitados à parte), por funções puras e testadas.
- Linguagem de negócio nas telas de gestão; jargão técnico só na visão técnica.
- Sem banco de dados, autenticação ou infraestrutura extra sem necessidade clara.
- Tailwind v4: `@tailwindcss/postcss` + `@import "tailwindcss"`. Nunca instruções da v3 (`tailwind.config.js`, `@tailwind`).
- Não atualizar nem misturar versões de dependências sem necessidade. Fixar versões exatas ao instalar.
- Comandos compatíveis com PowerShell (Windows).

## Stack (versões instaladas)

| Pacote | Versão |
|---|---|
| Node.js (ambiente) | 24.15.0 LTS |
| next / eslint-config-next | 16.4.6 |
| react / react-dom | 19.3.0 |
| typescript | 5.9.3 (faixa `^5` do template) |
| tailwindcss / @tailwindcss/postcss | 4.3.3 |
| recharts | 3.10.1 |
| lucide-react | 1.71.0 |
| eslint | 9.39.5 (faixa `^9` do template) |

Framework de testes E2E: **ainda não definido** (decisão na Fase 6; preferência: Playwright). Vitest para testes unitários das regras entra na Fase 2.

## Comandos

```powershell
npm run dev        # servidor local em http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

## Ritual de fim de fase

1. `npm run lint`, `npm run typecheck`, testes (a partir da Fase 2) e `npm run build`, sem falhas.
2. Atualizar este arquivo (status do plano) e `docs/decisoes.md`.
3. Commit em Conventional Commits (mensagens em português).
4. Resumo curto + como testar. Aguardar OK do usuário.

## Decisões-chave (detalhes em `docs/decisoes.md`)

- Dados em JSON versionados em `data/`; defeitos **derivados** das execuções (2 falhas seguidas abrem; 2 sucessos seguidos resolvem) + `acompanhamento.json` opcional.
- Semáforo: Risco = taxa < 85% ou defeito crítico aberto; Atenção = taxa < 95% ou defeito alto aberto; Pronto = demais.
- Taxa de sucesso = execuções com sucesso ÷ execuções no período. Meta única: 95%.
- Data de referência = última rodada; o diretor vê a última semana fechada (seg–dom); o gerente vê janela móvel de 7/30/90 dias.
- Histórico fictício: 13 semanas, seed fixa, mesmo formato dos dados importados, termina em 08/11/2026.
- API fictícia em servidor Node separado (`demo-api/`).

## Referência visual

Mockups em `docs/referencia/` (`visao-diretor.png`, `visao-gerente.png`). Ler no início da Fase 2.
Tokens: fundo #F4F6F9, cartão branco com borda #E2E8F0 e raio 12px, texto #0F172A/#475569, destaque #2F5BD3, sidebar #0F1B33, status verde #15803D, âmbar #B45309, vermelho #B91C1C (sempre com ícone e texto). Fonte IBM Plex Sans, números tabulares.

## Plano e status

| Fase | Entrega | Status |
|---|---|---|
| 1 | Setup: create-next-app, versões, Tailwind v4 via PostCSS, Recharts, Lucide, CLAUDE.md, docs/ | Concluída |
| 2 | Layout base + modelo de dados + histórico fictício + regras (Vitest) + visão do diretor | Pendente (aguarda mockups em `docs/referencia/`) |
| 3 | Visão do gerente (`/sistemas`, `/sistemas/[id]`) | Pendente |
| 4 | Visão técnica (`/execucoes`) | Pendente |
| 5 | Relatório executivo (`/relatorio`, impressão e copiar resumo) | Pendente |
| 6 | API fictícia + suíte de testes + importador do relatório | Pendente |
| 7 | GitHub Actions agendado | Pendente |
| 8 | README, repositório público e deploy na Vercel | Pendente |
