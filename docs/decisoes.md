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

**Por quê:** combina volume (taxa) e gravidade (defeito). Um sistema com 99% de sucesso mas com o Pix por QR Code quebrado não pode estar "Pronto". A regra completa aparece escrita na tela. O texto do mockup ("nenhuma falha crítica") foi completado com "ou alta" para refletir a regra real.
**Detalhe:** a taxa é comparada arredondada a uma casa decimal, como aparece na tela (ver T12).

### D05. Taxa de sucesso = execuções com sucesso ÷ execuções no período
**Alternativa descartada:** % de casos cuja última execução passou.
**Por quê:** é mais estável, se explica numa frase e permite tendência semanal comparável.

### D06. Meta única de 95%
**Por quê:** simplicidade de leitura. Metas por sistema ficam como evolução.

### D07. "Semana" = última semana fechada (segunda a domingo) antes da última execução
**Por quê:** o relatório executivo compara semanas completas. Não depender do relógio do servidor torna a demonstração reproduzível.

### D08. Defeitos derivados das execuções, com acompanhamento opcional (modelo híbrido)
**Decisão:** um defeito é um **problema de negócio**, ou seja, a funcionalidade mais a descrição traduzida do erro, e não um teste isolado. Se três testes da validação de documentos falham pelo mesmo motivo, é um único defeito.
- **Abre** quando o mesmo problema falha 2 vezes com menos de 4 dias entre uma falha e a seguinte. A data de abertura é a da primeira falha.
- **Resolve** depois de 4 dias sem nova falha e com pelo menos 2 sucessos dos testes afetados. A data de resolução é a do primeiro sucesso depois da última falha.
- O arquivo `acompanhamento.json` acrescenta situação (em análise, em correção ou aguardando decisão), responsável e, quando justificado, outra severidade.

**Alternativas:** (a) somente derivados, sem situação rica; (b) somente cadastro manual, que é dado fora da automação.
**Por quê:** mantém a automação real (abertura e resolução vêm dos testes) e ainda responde "existe algo crítico parado que exige decisão?".
**Ajuste feito na Fase 2:** a regra planejada (2 falhas seguidas abrem, 2 sucessos seguidos resolvem) fazia um problema intermitente abrir e fechar várias vezes na simulação, gerando códigos novos para o mesmo problema. A janela de 4 dias elimina esse vai e vem. Agrupar por problema, e não por teste, evitou defeitos duplicados.
**Códigos:** prefixo do sistema + número sequencial pela ordem de confirmação (PX-101, AC-104), como no mockup. A ordem de confirmação nunca muda quando o histórico cresce, então os códigos são estáveis.

### D09. Severidade herda a criticidade da funcionalidade
**Por quê:** a criticidade é uma decisão de negócio tomada uma única vez, no catálogo. O acompanhamento pode sobrescrevê-la caso a caso.

### D10. Tempo médio de correção
**Decisão:** média em dias corridos, da abertura à resolução, dos defeitos **resolvidos** nos últimos 30 dias, com **meta de até 3 dias** (vinda do mockup). A janela aparece no próprio cartão.
**Por quê:** uma semana costuma ter poucos defeitos resolvidos e a média ficaria instável.

### D11. Histórico fictício: 13 semanas, seed fixa
**Decisão:** semanas 33 a 45 de 2026, com rodadas automáticas às 06:00 e às 18:00. A última é em 09/11/2026 às 06:00, o que torna a semana 45 (02 a 08/11) a última semana fechada. São 75 casos de teste (25 funcionalidades × 3), num total de 183 rodadas e 13.725 execuções, em cerca de 1 MB.
**Como:** um roteiro de incidentes (`scripts/historico/cenarios.ts`) define quais testes falham, quando e com que probabilidade. Fora deles há um ruído mínimo de 0,1%. Um teste automatizado garante que o arquivo versionado é exatamente o que o gerador produz.
**Por quê:** cobre o filtro de 90 dias e a tendência. A seed fixa garante que todos vejam o mesmo painel. O formato é idêntico ao dos dados importados, então as telas não distinguem a origem.

### D12. Tendência de 6 semanas na visão executiva
**Decisão:** seguir o mockup (6 semanas). O plano previa 12.
**Por quê:** para um diretor, 6 semanas mostram a direção recente sem poluir o gráfico. Históricos mais longos ficam para as visões de gerente e técnica.

### D13. Os números vêm dos dados, não do mockup
**Contexto:** no mockup a taxa geral sobe para 94,2%. Nos dados gerados ela cai 4,1 pontos nesta semana (de 98,2% para 94,1%), porque a Abertura de Conta e o Pix pioraram.
**Decisão:** manter. O mockup define o visual; os números são sempre calculados. A queda reforça a história da semana ("um sistema entrou em risco").

### D14. Impacto dos problemas intermitentes em frequência
**Decisão:** se, desde a abertura do defeito (até 7 dias), menos da metade das execuções dos testes afetados falhou, a linha de impacto vira "cerca de 1 em cada N tentativas falha nos testes". Nos demais casos, mostra a consequência de negócio do catálogo.
**Por quê:** para um problema intermitente, a frequência diz mais ao gestor do que a consequência genérica. É o formato do mockup.

### D15. Rebaixamento de severidade justificado
**Caso:** PX-103, "Mensagem de erro genérica para o cliente", acontece na funcionalidade crítica "Envio por chave", mas o Pix é concluído normalmente.
**Decisão:** o acompanhamento rebaixa a severidade para baixa, registrando o motivo.
**Por quê:** a severidade herdada é um bom padrão, mas a decisão final é de negócio. Sem isso, um problema de texto deixaria o Pix em "Risco".

### D16. Data absoluta da última execução na barra lateral
**Decisão:** "09/11/2026, 06:00 · 75 testes" em vez de "Hoje, 06:00".
**Por quê:** as páginas são geradas no build. Um "Hoje" calculado naquele momento ficaria incorreto no dia seguinte.

### D17. Visão do gerente: período móvel e defeitos sempre atuais
**Decisão:**
- 7, 30 ou 90 dias são uma **janela móvel** que termina na última execução (padrão: 30 dias, como no mockup). Com rodadas a cada 12 horas, 7 dias = 14 execuções automáticas.
- Taxa, testes executados, sucesso por funcionalidade e tempo de correção usam o período escolhido. A variação compara com o período anterior de mesmo tamanho ("vs. 30 dias anteriores").
- **Defeitos em aberto não dependem do período:** são sempre os da data da última execução, porque um problema aberto continua aberto.
- O selo de status ao lado do nome do sistema usa a mesma regra do semáforo, aplicada ao período escolhido.

**Por quê:** o diretor olha a semana fechada (comparável semana a semana); o gerente precisa investigar períodos diferentes. A tela sempre mostra o período exato ("Últimos 30 dias (10/10 a 09/11/2026)") para que os números não pareçam divergir da visão executiva. Defeitos críticos ou altos determinam o status em qualquer período, então o semáforo das duas visões coincide nos casos que importam.

### D18. Status por funcionalidade considera defeitos em aberto
**Contexto:** "Envio por QR Code" tem 98,9% de sucesso em 30 dias, mas aparece em Atenção por causa de um defeito de severidade alta aberto.
**Decisão:** manter a mesma regra do semáforo também por funcionalidade e dizer isso no cabeçalho do cartão ("o status também considera os defeitos em aberto").
**Por quê:** uma taxa alta num período longo pode esconder um problema que começou há 3 dias. A regra única evita exceções difíceis de explicar.

### D19. "Voltar" leva para a tela de origem
**Contexto:** sugestão de quem validou a Fase 3. Ao entrar no Pix pela lista de Sistemas, o link "‹ Visão executiva" levava para outra tela, e não de volta à lista.
**Decisão:** a lista de Sistemas abre a visão do gerente com `?de=sistemas`, e o link passa a ser "‹ Sistemas". Vindo da visão executiva (ou sem origem), continua "‹ Visão executiva", como no mockup. A origem é preservada ao trocar o período.
**Alternativa descartada:** usar o histórico do navegador (`history.back()`). Quebra quando a página é aberta por um link compartilhado e depende de JavaScript.

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

### T09. Vitest 4.1 para testes unitários e tsx para scripts
**Decisão:** Vitest 4.1.12 e tsx 4.23.15, ambos só em desenvolvimento.
**Por que não o Vitest 5.1.0 (mais recente):** saiu em 02/11/2026 e exige `@types/node` 22 ou superior, o que obrigaria a atualizar o `@types/node` 20 do template. A linha 4.1 é madura e compatível com o que já está instalado.
**Escopo:** só testes unitários das regras (funções puras). O framework da suíte de testes da API fictícia continua para a Fase 6.

### T10. Fuso fixo −03:00 nos cálculos
**Por quê:** o Brasil não tem horário de verão desde 2019. Um deslocamento fixo mantém as funções puras e o resultado igual em qualquer máquina, inclusive no CI e na Vercel (que rodam em UTC).

### T11. Dados lidos no servidor; páginas estáticas
**Decisão:** o repositório (`src/dados/repositorio.ts`) lê e valida os JSON no servidor. As páginas recebem só os números prontos e são geradas no build. O `outputFileTracingIncludes` garante que a pasta `data/` vá para o deploy.
**Por quê:** nenhum dado bruto vai para o navegador, a página fica rápida e a validação falha de forma clara (`ErroDadosInvalidos` indica arquivo e campo).

### T12. Classificação com o valor exibido
**Por quê:** sem isso, um sistema com 94,96% apareceria como "95,0%" e, ainda assim, em Atenção. O número mostrado e o status nunca podem se contradizer.

### T13. Gráfico com `responsive` do Recharts 3
**Decisão:** usar a prop `responsive` do gráfico, em vez do `ResponsiveContainer`, que é o caminho recomendado no guia de dimensionamento do Recharts 3. O gráfico tem tooltip por semana, descrição textual e tabela equivalente para leitores de tela.

### T15. Período do gerente na URL, com renderização sob demanda
**Decisão:** o seletor de período é um conjunto de links (`?periodo=7|30|90`), e a página lê o parâmetro no servidor. Por isso a rota `/sistemas/[sistemaId]` é renderizada sob demanda; as demais continuam estáticas.
**Alternativa:** pré-calcular os 3 períodos e alternar no navegador. Mantém a página estática, mas envia três vezes mais dados e duplica a lógica de estado.
**Por quê:** o link compartilhado abre exatamente o mesmo recorte, funciona sem JavaScript, e o custo é baixo (dados em cache no servidor, cálculo de milissegundos). Um valor inválido na URL volta para 30 dias, sem erro.

### T14. Nomes de arquivo dos mockups
**Decisão:** renomeados para `visao-diretor.png` e `visao-gerente.png` (sem acentos, espaços ou `@`).
**Por quê:** nomes ASCII evitam problemas no Git, em URLs do README e em terminais.
