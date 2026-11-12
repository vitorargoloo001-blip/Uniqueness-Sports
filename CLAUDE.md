# UNIQUENESS SPORTS — MazyOS

> Sistema operacional da marca. Empresa enxuta: núcleo estratégico
> centralizado (marca, produto, comunicação, decisões comerciais),
> com apoio pontual em design, conteúdo, site e operação.

## O que é esse workspace

Operação de marca e conteúdo da Uniqueness Sports — academia que
fabrica os próprios suplementos, produtos esportivos e lifestyle.

**Estrutura de pastas:**
- `_memoria/` — quem é a empresa, como falamos, foco atual
- `identidade/` — marca aplicada em tudo que o sistema gera (logo em `identidade/logo.png`)
- `marketing/` — campanhas, conteúdo, mídia paga
- `saidas/` — documentos pontuais
- `scripts/` — automações e ferramentas de apoio
- `dados/` — arquivos a analisar
- `templates/` — moldes usados pelo próprio MazyOS
- `site/` — código do site oficial (Next.js, e-commerce completo: contas, carrinho, checkout, pagamento, pedidos). Tem seu próprio `site/CLAUDE.md` com comandos e arquitetura
- `admin/` — painel administrativo privado ("Uniqueness Admin"), projeto Next.js separado do `site/` mas conectado ao mesmo banco de dados. Só usuários `ADMIN` acessam. Tem seu próprio `admin/CLAUDE.md`

## Sobre a empresa

Uniqueness Sports é uma marca de academia que fabrica os próprios
suplementos, produtos esportivos e lifestyle. Não segue o mercado
fitness de hype — constrói em cima de constância, básico bem feito
e presença. Atende quem treina com constância e quer comprar de uma
marca com identidade, não só preço.

Estrutura enxuta: núcleo estratégico (direção de marca, produto,
comunicação, comercial) concentrado em poucas pessoas, com apoio
pontual para design, conteúdo, site e operação — mantendo consistência
e controle da identidade.

## O que mais fazemos aqui

- Conteúdo semanal que traduz a visão da marca em posts/carrosséis consistentes
- Peças de identidade visual (old school, premium, esportivo)
- Site oficial da marca (`site/`, Next.js) — e-commerce completo (contas, carrinho, checkout, pagamento Mercado Pago, pedidos), com painel admin dedicado (`admin/`) — ver `_memoria/estrategia.md`, `site/README.md` e `admin/README.md`

## Tom de voz

Direto, quase manifesto. Old school, premium, sem enfeite. Ver
`_memoria/preferencias.md` para o guia completo e exemplo real de escrita.

Evitar: jargão de guru, tom de vendedor desesperado, texto "com cara
de IA" (redondo, explicado demais, sem verdade).

## Regras do sistema

- Toda peça visual (carrossel, post, site) segue `identidade/design-guide.md`
- Conteúdo publicado ou pontual vai em `saidas/`
- Campanhas e mídia paga ficam em `marketing/`

---

## Contexto do negócio

No início de toda conversa, ler os seguintes arquivos (quando existirem
e estiverem preenchidos):

1. `_memoria/empresa.md` — quem é o usuário, o que faz, como funciona o negócio
2. `_memoria/preferencias.md` — tom de voz, estilo de escrita, o que evitar
3. `_memoria/estrategia.md` — foco atual, prioridades, prazos

Usar essas informações como base pra qualquer resposta ou decisão. Ao
sugerir prioridades, formatos ou abordagens, considerar o foco atual
descrito em `estrategia.md`.

Pra qualquer tarefa visual (carrossel, post, landing page), consultar
`identidade/design-guide.md` como referência de estilo.

Não é necessário listar o que foi lido nem confirmar a leitura. Apenas
usar o contexto naturalmente.

---

## Fluxo de trabalho

Antes de executar qualquer tarefa, verificar se existe skill relevante
em `.claude/skills/`. Se encontrar, seguir as instruções da skill. Se
não encontrar, executar a tarefa normalmente.

Além das skills locais, a skill global `karpathy-guidelines` (instalada
em `~/.claude/skills/`, via
[andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills))
se aplica automaticamente em qualquer tarefa de código dentro desse
workspace — principalmente em `scripts/`. Ela reforça: pensar antes de
codar (assumir nada, perguntar quando incerto), simplicidade (só o que
foi pedido), mudanças cirúrgicas (não mexer no que não foi pedido) e
execução orientada a critério de sucesso verificável.

Ao concluir uma tarefa que não tinha skill mas parece repetível (o
usuário provavelmente vai pedir de novo no futuro), perguntar:

> "Isso pode virar uma skill pra próxima vez. Quer que eu crie?"

Não perguntar pra tarefas pontuais ou perguntas simples. Só quando o
padrão de repetição for claro.

---

## Aprender com correções

Quando o usuário corrigir algo, melhorar uma resposta ou dar uma
instrução que parece permanente (frases como "na verdade é assim", "não
faça mais isso", "prefiro assim", "sempre que...", "evita...", "da
próxima vez..."), perguntar:

> "Quer que eu salve isso pra não precisar repetir?"

Se sim, identificar onde faz mais sentido salvar:

- **Sobre o negócio** (clientes, serviços, mercado) → `_memoria/empresa.md`
- **Sobre preferências e estilo** (tom de voz, formato, o que evitar) → `_memoria/preferencias.md`
- **Sobre prioridades e foco** (projetos, metas, prazos) → `_memoria/estrategia.md`
- **Regra de comportamento nessa pasta** → próprio `CLAUDE.md`

Salvar com uma linha nova clara, sem reformatar o arquivo inteiro.
Confirmar mostrando a linha adicionada.

Não perguntar se a correção for óbvia de contexto imediato (ex: "na
verdade o arquivo se chama X"). Só perguntar quando a informação tiver
valor duradouro.

---

## Manter contexto atualizado

Ao terminar uma tarefa que mudou algo relevante (cliente novo, skill
nova, mudança de foco, processo novo, ferramenta instalada, estrutura
alterada), perguntar:

> "Isso mudou algo no teu contexto. Quer que eu atualize a memória?"

Se sim, identificar o que atualizar:

- **Cliente, serviço, ferramenta, equipe** → `_memoria/empresa.md`
- **Mudança de prioridade ou foco** → `_memoria/estrategia.md`
- **Tom ou estilo** → `_memoria/preferencias.md`
- **Pasta, regra de organização, skill criada** → `CLAUDE.md`
- **Visual (cores, fontes, logo)** → `identidade/design-guide.md`

Mostrar o que vai mudar antes de salvar. Não reformatar o arquivo
inteiro, só adicionar ou editar a linha relevante.

**Quando NÃO perguntar:**
- Tarefas pontuais sem impacto no contexto (escrever um email avulso, criar um post)
- Perguntas simples ou conversas sem ação
- Mudanças já salvas pelo bloco "Aprender com correções"

**Dica:** rode `/atualizar` pra uma varredura completa quando houver dúvida.

---

## Criação de skills

Quando o usuário pedir skill nova:

1. Verificar se existe template relevante em `templates/skills/`. Se
   existir, usar como base e adaptar pro contexto
2. Perguntar se é específica desse projeto ou útil em qualquer:
   - Específica → `.claude/skills/nome-da-skill/SKILL.md` (local)
   - Universal → `~/.claude/skills/nome-da-skill/SKILL.md` (global)
3. Ler `_memoria/empresa.md` e `_memoria/preferencias.md` pra calibrar
   o conteúdo da skill ao contexto do negócio
4. Se a skill precisar de arquivos de apoio (templates, exemplos),
   criar dentro da pasta da skill
5. Seguir o fluxo da skill-creator nativa do Claude Code
