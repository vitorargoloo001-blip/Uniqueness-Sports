# Uniqueness Admin

Produção: **https://uniqueness-admin.vercel.app** (projeto Vercel
`uniqueness-admin`, mesmo time do `site/`, `AUTH_SECRET` próprio).

Painel administrativo privado da Uniqueness Sports — projeto Next.js
**separado** da loja (`../site/`), mas conectado ao **mesmo banco de dados**
Postgres/Supabase. Só usuários com `role: "ADMIN"` conseguem logar aqui;
a autenticação rejeita credenciais válidas de contas `CUSTOMER` na própria
camada de `authorize()`, não só na proxy de rotas.

## Por que um projeto separado

A loja (`site/`) é pública, otimizada para SEO e conversão. O admin é
privado, denso em dados, focado em produtividade. Compartilhar o banco via
duas apps Next.js independentes evita que uma dependência/rota administrativa
pese no bundle ou nas configurações de cache da loja — e vice-versa.

## Comandos

Rodar a partir desta pasta (`MazyOS/admin/`):

```bash
npm install       # também roda `prisma generate` via postinstall
npm run dev       # Turbopack dev server, http://localhost:3001 (site usa 3000)
npm run build     # build de produção
npm run start     # serve o build de produção (porta 3001)
npm run lint      # ESLint (flat config)
npm run db:migrate   # prisma migrate dev — mesma ressalva do site, ver CLAUDE.md
npm run db:studio    # Prisma Studio
```

Não há `db:seed` aqui de propósito — o seed (categorias, produtos, admin
inicial) é responsabilidade do `site/prisma/seed.ts`. Os dois projetos
apontam pro mesmo `DATABASE_URL`/`DIRECT_URL`.

## Variáveis de ambiente (`.env.local`, não versionado)

```
DATABASE_URL / DIRECT_URL     # mesmas do site/ — banco compartilhado
AUTH_SECRET                   # PRÓPRIO deste projeto, não compartilhado com o site
NEXTAUTH_URL                  # http://localhost:3001 em dev
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY     # usado só no servidor, pra upload de imagem
SUPABASE_STORAGE_BUCKET       # "uploads" — bucket público, criado via API do Supabase
```

## O que já está implementado (CRUD real, dados reais)

- **Autenticação** — login com Credentials + JWT, `authorize()` rejeita
  qualquer conta que não seja `ADMIN`, rate limiting próprio
  (`admin_login`, mais rígido que o do site) na mesma tabela `LoginAttempt`.
- **Dashboard** (`/`) — faturamento, pedidos por status, estoque baixo,
  pedidos recentes — tudo vindo de queries reais (`lib/dashboard.ts`).
- **Produtos** (`/produtos`) — CRUD completo, upload de imagem (Supabase
  Storage), preço/estoque/categoria, toggle ativo, exclusão bloqueada com
  mensagem clara se o produto está em carrinho de cliente (`P2003`).
- **Categorias** (`/categorias`) — CRUD completo, upload de imagem, slug
  auto-gerado (editável).
- **Pedidos** (`/pedidos`, `/pedidos/[id]`) — lista com status/pagamento,
  detalhe com itens, endereço, cupom aplicado, atualização de status
  (dispara `OrderEvent` + repõe estoque em cancelamento/reembolso),
  formulário de rastreio.
- **Envios** (`/pedidos/novos` → `/pedidos/em-preparo` → `/pedidos/postados`)
  — fila de trabalho do pedido pago até a entrega, ligada ao Melhor Envio:
  comprar etiqueta com o saldo, lista de separação, imprimir etiquetas em
  lote, marcar como postado (puxa o rastreio) e acompanhar prazo. Cada passo
  muda o status que o cliente vê no site. Ver `lib/fluxo.ts`.
- **Clientes** (`/clientes`, `/clientes/[id]`) — lista com total
  gasto/pedidos, detalhe com endereços e histórico de pedidos.
- **Cupons** (`/cupons`) — CRUD completo (percentual/fixo, validade, uso
  máximo, `usedCount` somente leitura).
- **Banners** (`/banners`) — CRUD completo com upload de imagem, ordem,
  período de exibição.
- **Conteúdo do site** (`/conteudo`) — editor genérico de chave/valor
  (`SiteSetting`), agrupado por `group`. **Importante:** o site (`site/`)
  ainda não lê nenhuma dessas chaves — ver seção abaixo.
- **Demandas** (`/demandas`) — lista/filtra `Lead`, atualização de status,
  exclusão. **Importante:** a loja ainda não tem formulário público que
  crie `Lead`s — ver seção abaixo.
- **Relatórios** (`/relatorios`) — faturamento últimos 12 meses, ticket
  médio, mais vendidos, pedidos por status de pagamento.
- **Configurações** (`/configuracoes`) — gestão da equipe com acesso admin
  (criar/promover/revogar — nunca permite remover o próprio acesso nem
  ficar sem nenhum admin) + configurações gerais (mesmo editor de
  `SiteSetting`, grupo `geral`).

## O que existe na estrutura mas ainda não está conectado ao site público

Isso é intencional e está sinalizado na própria UI — não é um bug, é
trabalho de integração ainda não feito:

- **`SiteSetting`** — a tabela e o CRUD são reais, mas nenhuma página do
  `site/` busca esses valores ainda. Editar um texto aqui não muda a loja
  até alguém trocar o conteúdo hardcoded do site por uma leitura dessa
  tabela.
- **`Lead`** — o CRUD é real, mas a página `/contato` do site só tem
  links de WhatsApp/email hoje, não um formulário que grava um `Lead`.

## Gotchas de versão (ver `CLAUDE.md` para detalhes técnicos)

Mesma base bleeding-edge do `site/` (Next 16, Prisma 7) **mais** duas
libs novas só usadas aqui: **TanStack Table v9** (API com registro
explícito de features — bem diferente da v8 mais conhecida) e o preset
**shadcn `radix-nova`**, que não tem o wrapper `Form`/`FormField` clássico
— usa primitivos `Field`/`FieldLabel`/`FieldError` (`components/ui/field.tsx`)
combinados manualmente com React Hook Form.
