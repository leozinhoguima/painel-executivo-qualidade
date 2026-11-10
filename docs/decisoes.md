# Registro de decisões

Cada decisão traz o contexto e o porquê, para que possa ser explicada a um gestor ou numa entrevista.

---

## Negócio

### D01. Instituição e sistemas fictícios
**Decisão:** Banco Aurora, com 5 sistemas e áreas fictícias: Pix (Pagamentos Instantâneos), Transferências (Pagamentos), Abertura de Conta (Onboarding Digital), Cartões (Meios de Pagamento) e Internet Banking (Canais Digitais). Usuária fictícia: Marina Costa · Diretoria de Tecnologia.
**Por quê:** o domínio bancário é familiar a qualquer gestor e torna os impactos de negócio intuitivos. Ser fictício elimina qualquer risco de exposição de dados reais.

### D02. De 4 a 6 funcionalidades por sistema (cerca de 25 no total)
**Por quê:** é o suficiente para o painel parecer real e ainda caber de forma legível em "Sucesso por funcionalidade".

### D03. Narrativa nos dados fictícios
**Decisão:** Pix estável, Abertura de Conta piorando nas últimas 2 semanas (validação de documentos), Cartões se recuperando e um defeito crítico "aguardando decisão".
**Por quê:** uma demonstração precisa ter algo a dizer. Dados aleatórios sem história não mostram o valor do painel.

### D04. Regra do semáforo
- **Risco:** taxa abaixo de 85% **ou** algum defeito crítico em aberto.
- **Atenção:** taxa abaixo de 95% **ou** algum defeito de severidade alta em aberto.
- **Pronto:** os demais casos (95% ou mais e nenhum defeito crítico ou alto em aberto).

**Por quê:** combina volume (taxa) e gravidade (defeito). Um sistema com 99% de sucesso mas com o Pix por QR Code quebrado não pode estar "Pronto". A regra aparece escrita na tela para dar transparência.

### D05. Taxa de sucesso = execuções com sucesso ÷ execuções no período
**Alternativa descartada:** % de casos cuja última execução passou.
**Por quê:** é mais estável, se explica numa frase e permite tendência semanal comparável.

### D06. Meta única de 95%
**Por quê:** simplicidade de leitura. Metas por sistema ficam como evolução.

### D07. "Semana" = última semana fechada (segunda a domingo) antes da última execução
**Por quê:** o relatório executivo compara semanas completas. Não depender do relógio do servidor torna a demonstração reproduzível.

### D08. Defeitos derivados das execuções, com acompanhamento opcional (modelo híbrido)
**Decisão:** um caso de teste que falha em 2 rodadas seguidas abre um defeito, e 2 sucessos seguidos o resolvem. O arquivo `acompanhamento.json` acrescenta situação (em análise, em correção ou aguardando decisão), responsável e, se preciso, outra severidade.
**Alternativas:** (a) somente derivados, sem situação rica; (b) somente cadastro manual, que é dado fora da automação.
**Por quê:** mantém a automação real, porque abertura e resolução vêm dos testes, e ainda responde "existe algo crítico parado que exige decisão?". Exigir 2 ocorrências evita que uma instabilidade pontual abra ou feche defeitos.

### D09. Severidade herda a criticidade da funcionalidade
**Por quê:** a criticidade é uma decisão de negócio tomada uma única vez, no catálogo. O acompanhamento pode sobrescrevê-la caso a caso.

### D10. Tempo médio de correção
**Decisão:** média em dias corridos, da abertura à resolução, dos defeitos **resolvidos** no período. Na visão do diretor a janela é de 30 dias, indicada no cartão.
**Por quê:** uma semana costuma ter poucos defeitos resolvidos e a média ficaria instável.

### D11. Histórico fictício de 13 semanas, com seed fixa
**Por quê:** cobre o filtro de 90 dias e a tendência de 12 semanas. A seed fixa garante que todos vejam o mesmo painel. O formato é idêntico ao dos dados importados, então as telas não distinguem a origem.

---

## Técnicas

### T01. Stack e versões
**Decisão:** Next.js 16.4.6 (App Router), React 19.3.0, TypeScript 5.9, Tailwind CSS 4.3.3 via `@tailwindcss/postcss`, Recharts 3.10.1 e Lucide React 1.71.0. Node 24 LTS.
**Como foi verificado (10/11/2026):** `npm view` de cada pacote e das `peerDependencies`. Next 16.4.6 aceita React ^19 e Node ≥ 20.9. Recharts 3.10 e Lucide 1.71 aceitam React ^19.
**Por que manter TypeScript 5.9, se a 7.0 é a mais recente:** o TypeScript 7 (compilador nativo) não expõe mais a API JavaScript clássica, que ainda é usada pelo `typescript-eslint` e pela checagem de tipos do Next. A faixa `^5` escolhida pelo `create-next-app` é a combinação testada pelo próprio Next.
**Por que manter ESLint 9:** é a faixa do template oficial. Atualizar para a 10 sem necessidade arriscaria incompatibilidade com os plugins do `eslint-config-next`.
**Por que manter React 19.3.0 e Tailwind 4.3.3:** são as versões fixadas pelo `create-next-app` 16.4.6 (as mais recentes são 19.3.1 e 4.3.5). Não há motivo para trocar. `@tailwindcss/postcss` foi instalado na mesma versão do `tailwindcss`, para não misturar versões.

### T02. Tailwind v4 via PostCSS (e não o plugin do Turbopack)
**Contexto:** o template do `create-next-app` 16.4 vem com `@tailwindcss/turbopack`.
**Decisão:** trocar pela integração `@tailwindcss/postcss` + `postcss.config.mjs` + `@import "tailwindcss"`, que é a documentada no guia oficial do Next (`docs/01-app/01-getting-started/11-css.md`).
**Por quê:** é um requisito do projeto e o caminho mais documentado. Funciona igual com Turbopack e Webpack.

### T03. Configuração mínima do Next
**Decisão:** remover `cacheComponents` e `partialPrefetching`, que vinham ativados no template.
**Por quê:** os dados são JSON estáticos lidos no build e não há ganho real. Esses modos mudam a semântica de renderização (por exemplo, exigem limites de Suspense ao ler `searchParams`) e acrescentariam complexidade sem benefício para o projeto.

### T04. Dados em JSON versionados no repositório
**Alternativa:** Vercel Blob/KV.
**Por quê:** não precisa de banco de dados, o histórico fica auditável no Git e o fluxo "Actions faz commit e a Vercel publica de novo" é simples de explicar.

### T05. API fictícia em servidor Node separado
**Por quê:** separa o produto (painel) do sistema sob teste, como no mundo real. Também fica mais leve no CI.

### T06. PDF por impressão do navegador
**Por quê:** `window.print` com CSS próprio de impressão gera um PDF fiel sem dependências pesadas de renderização no servidor.

### T07. Sem modo escuro, somente pt-BR
**Por quê:** é uma ferramenta corporativa para um público brasileiro. Um tema único e bem acabado vale mais.

### T08. Alertas do `npm audit`
**Situação (Fase 1):** 7 alertas moderados no `minimatch`, uma dependência indireta do ESLint, que só é usado em desenvolvimento. As dependências de produção têm 0 vulnerabilidades (`npm audit --omit=dev`).
**Decisão:** não rodar `npm audit fix` agora, porque alteraria versões do conjunto de lint do template sem ganho para a aplicação publicada. Reavaliar na Fase 8.
