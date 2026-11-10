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

### D20. Visão técnica: última semana por padrão, mais recentes primeiro
**Decisão:** `/execucoes` abre nos últimos 7 dias, com todos os sistemas e resultados, da execução mais recente para a mais antiga, 50 por página. Filtros: período, sistema, funcionalidade e resultado. Cada falha mostra a mensagem técnica original **e**, abaixo, a tradução de negócio ("→ Falha na validação de documentos do cliente").
**Por quê:** é a tela de quem investiga: o que aconteceu por último importa mais. Exibir as duas mensagens lado a lado deixa a camada de tradução visível e auditável.
**Detalhes:** com o filtro "Somente falhas" ou "Somente sucessos", o resumo mostra só a contagem, porque a taxa seria sempre 0% ou 100%. Uma funcionalidade de outro sistema é ignorada, e uma página além do fim mostra a última.

### D22. Relatório semanal: os mesmos números, em uma folha
**Decisão:** `/relatorio` reaproveita a mesma função da visão executiva (`montarVisaoDiretor`) e acrescenta só o volume da semana. Conteúdo: resumo, 4 indicadores, prontidão por sistema (com área e defeitos), tendência de 6 semanas em barras, os 3 principais problemas e um rodapé "Como ler" com a regra do semáforo e o aviso de dados fictícios.
**Por quê:** um teste garante que relatório e painel nunca divergem. A tendência é desenhada em barras simples (HTML), porque imprime com nitidez em qualquer impressora, e o gráfico interativo não faz sentido no papel. Tons claros no lugar do bloco azul-marinho evitam gastar tinta.
**Verificação:** o PDF gerado pelo navegador (Edge, A4, margens de 12 mm) foi conferido com 1 página.

### D23. "Copiar resumo" copia o relatório inteiro em texto simples
**Decisão:** o botão copia título, resumo, indicadores, prontidão, problemas e a base de cálculo, em texto sem formatação (marcadores "•" e listas numeradas), para colar em e-mail, Teams ou WhatsApp. A tela mostra uma prévia ("Ver o texto que será copiado").
**Por quê:** só o parágrafo do resumo, sem números, não basta para quem vai repassar. O texto é gerado por uma função pura e testada, com os mesmos rótulos do painel.
**O botão "Baixar relatório (PDF)"** do cabeçalho abre esta página; o PDF é salvo pelo "Imprimir ou salvar em PDF". Não abrimos a janela de impressão automaticamente ao entrar, para não surpreender quem só quer ler.

### D24. A API fictícia reproduz os problemas em aberto da narrativa
**Decisão:** `demo-api/cenarios.json` ativa as mesmas falhas que estão em aberto no histórico: validação de documentos indisponível (502, 85%), QR Code intermitente (500, 30%), devolução parcial com valor integral, comprovante sem data e hora (50%), mensagem genérica no Pix por chave (45%), lentidão no limite do cartão (3,5 s, 80%) e conflito na atualização cadastral (409, 35%).
**Por quê:** a primeira rodada real continua a história em vez de contradizê-la. Na verificação desta fase, as falhas da rodada real entraram nos **mesmos 7 defeitos** (por exemplo, AC-104 passou de 30 para 33 ocorrências), sem criar códigos novos. Isso mostra que a camada de tradução une o dado fictício e o real.
**Como "corrigir" um problema na demonstração:** mude `"ativa": false` no cenário e rode `npm run qualidade` algumas vezes, com mais de 4 dias entre a primeira e a última rodada sem falha (ou ajuste a data). O defeito é resolvido sozinho pela regra D08.
**Realismo:** as falhas agem como bugs de verdade: a mensagem genérica só aparece nas respostas de erro, e a devolução "errada" só é percebida na devolução parcial (na total, o valor coincide).

### D25. A primeira rodada real fica versionada
**Decisão:** a rodada de 10/11/2026 gerada nesta fase (`data/execucoes/2026-11-10-164526.json`) entra no repositório.
**Por quê:** é a prova de que o fluxo funciona de ponta a ponta. A partir dela, o painel mostra "Última execução automática: 10/11/2026, 16:45", e a visão técnica identifica essas linhas como "Suíte automatizada".

### D21. Do defeito à mensagem técnica em um clique
**Decisão:** na tabela de defeitos da visão do gerente, a funcionalidade é um link para as falhas dela na visão técnica, no mesmo período.
**Por quê:** liga os três níveis (diretor → gerente → técnico). O gestor vê o problema em linguagem de negócio e, se precisar, o time técnico chega à mensagem original sem procurar.

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

### T16. Filtros como formulário GET e paginação no servidor
**Decisão:** os filtros da visão técnica são um `<form method="get">` com `<select>` nativos e botão "Aplicar filtros". A filtragem e a paginação acontecem no servidor; o navegador recebe só as 50 linhas da página.
**Por quê:** 90 dias somam cerca de 13.500 execuções, e enviar tudo ao navegador deixaria a página pesada. O formulário nativo funciona sem JavaScript, é acessível por teclado e leitor de tela, e o recorte fica na URL. Valores inválidos na URL voltam ao padrão, sem erro.

### T17. Impressão com CSS e rótulos no domínio
**Decisão:** a impressão usa `@page { size: A4; margin: 12mm }` e as variantes `print:` do Tailwind (esconde barra lateral, botões e prévia; compacta espaçamentos). `print-color-adjust: exact` preserva as cores dos selos. A cópia usa `navigator.clipboard`, com alternativa para navegadores sem essa API.
**Organização:** os rótulos de negócio ("Risco", "Crítica", "Aguardando decisão") foram movidos para `src/dominio/rotulos.ts`, e o texto de variação ("+2,4 pontos vs. …") virou uma função única (`descreverVariacao`), usada pelo painel, pelo gerente e pelo relatório. Assim, a camada de domínio não depende de componentes visuais.

### T18. Playwright Test 1.64.1, somente testes de API
**Decisão (aprovada):** Playwright Test 1.64.1, com escopo apenas de API (sem navegador). A 1.65.0 tinha 5 dias de publicação; a 1.64.1 é a correção da linha anterior, com um mês de uso, e atende ao `^1.51.1` exigido pelo Next.
**Por quê:** é a ferramenta mais reconhecida no mercado de QA hoje. O cliente HTTP dela dispensa o download de navegadores (cerca de 150 MB a menos no CI), e o relatório JSON é oficial e estável.
**Como os testes se ligam ao painel:**
- cada teste declara a anotação `{ type: "caso", description: "<id do catálogo>" }`, e o título é a descrição técnica do catálogo;
- as falhas usam mensagens padronizadas ("`POST /pix/qrcode/pagamentos retornou 500 (esperado 201)`", "`Tempo limite de 2000 ms excedido em …`"), sempre com a requisição do catálogo, para que a camada de tradução as reconheça;
- `retries: 0`: falhas são o objeto de medição, e repetir esconderia instabilidade;
- um tempo máximo padrão de 3 s por requisição funciona como SLA, e os casos com limite próprio (1 s, 2 s e 5 s) o declaram.

**Execução:** 75 testes em cerca de 5 segundos, com 6 workers. O Playwright sobe a API sozinho (`webServer`).

### T19. API fictícia em Node puro, com sorteio determinístico
**Decisão:** servidor `node:http`, sem framework, com rotas declaradas no mesmo formato do catálogo (`/cartoes/{id}/limite`). Um teste garante que toda requisição do catálogo tem rota.
**Sorteio das falhas:** hash da seed + id do caso (cabeçalho `x-caso-teste`) + índice da falha. O resultado não depende da ordem dos testes em paralelo. A seed vem de `DEMO_SEED` ou, por padrão, da data e hora (muda a cada minuto), então cada rodada varia como num ambiente real.

### T20. Importador puro, tolerante e sem duplicatas
**Decisão:** `src/importacao/playwright.ts` converte o relatório JSON e não depende dos tipos internos do Playwright: lê só os campos necessários e confere cada um.
- **Avisa sem interromper:** teste sem anotação, caso inexistente, caso repetido, teste pulado e casos do catálogo sem resultado.
- **Interrompe:** relatório sem a estrutura esperada, nenhum caso reconhecido, ou rodada já importada.
- O tempo limite do próprio Playwright vira "`Tempo limite de N ms excedido em <requisição>`".
- O arquivo gerado passa pela mesma validação do histórico, então as telas não distinguem a origem.

**`npm run qualidade`:** roda a suíte e importa. O código de saída 1 do Playwright (há testes falhando) é o esperado; o fluxo só para se o relatório não for gerado.

### T21. Testes de coerência usam só o histórico fictício
**Decisão:** os testes das visões (`diretor`, `gerente`, `tecnica`, `relatorio`) carregam apenas `historico-ficticio.json` (`carregarBaseDemonstracao`).
**Por quê:** cada rodada real importada muda a data de referência. Sem isso, os testes quebrariam a cada execução do GitHub Actions sem que nada estivesse errado.

### T14. Nomes de arquivo dos mockups
**Decisão:** renomeados para `visao-diretor.png` e `visao-gerente.png` (sem acentos, espaços ou `@`).
**Por quê:** nomes ASCII evitam problemas no Git, em URLs do README e em terminais.
