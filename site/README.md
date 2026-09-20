# Site — UNIQUENESS SPORTS

E-commerce completo: contas, endereços, carrinho, checkout, pagamento
(Mercado Pago), pedidos, rastreamento e painel admin. Evoluiu do modelo
institucional+WhatsApp original (2026-08-27) pra loja real com banco de
dados (2026-08-27, mesmo dia — ver `_memoria/estrategia.md`).

## Direção visual

**Claro/premium** — fundo off-white (#F7F5F0), preto como cor principal,
cinza claro pra divisórias e cards. Ver `identidade/design-guide.md`
(reconciliado com essa paleta).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — tokens em `app/globals.css` (`@theme`)
- **Prisma 7** (driver adapter `@prisma/adapter-pg`) + **PostgreSQL** (Supabase)
- **Auth.js v5** (`next-auth@beta`) — Credentials provider (email+senha, bcrypt), sessão JWT, `@auth/prisma-adapter`
- **Zod v4** — validação (`lib/validations.ts`)
- **React Hook Form** — formulários client-side
- **Mercado Pago SDK** (`mercadopago` + `@mercadopago/sdk-react`) — gateway
  de pagamento ativo, pagamento embutido no site (Payment Brick: cartão,
  Pix e boleto sem redirecionar)
- **anime.js v4** — microinterações (hero, scroll-reveal, hover)

## Rodar localmente

```bash
npm install                      # roda `prisma generate` via postinstall
cp .env.example .env.local       # preencher DATABASE_URL, DIRECT_URL, AUTH_SECRET etc.
npm run db:migrate                # aplica o schema no banco (interativo)
npm run db:seed                   # popula categorias/produtos (+ admin se SEED_ADMIN_* setado)
npm run dev                       # http://localhost:3000
```

`npm run build && npm run start` pra produção. `npm run db:studio` abre o
Prisma Studio pra inspecionar/editar dados direto.

## Configuração (.env.local)

Ver `.env.example` pra lista completa. As obrigatórias pra rodar:

- `DATABASE_URL` / `DIRECT_URL` — Postgres (pooled/direct — ver nota no `prisma7.config.ts`)
- `AUTH_SECRET` — string aleatória (`openssl rand -base64 32`)
- `NEXT_PUBLIC_SITE_URL` — usado no `notification_url` do webhook do Mercado Pago

Pra pagamento funcionar de verdade (Payment Brick, embutido no site):

- `MERCADO_PAGO_ACCESS_TOKEN` / `MERCADO_PAGO_WEBHOOK_SECRET` /
  `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` — sem isso o checkout cria o pedido
  normalmente mas o pagamento falha com uma mensagem clara (não finge que
  funcionou). Criar conta em
  [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers).

Pra criar/promover um admin: `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD`, depois `npm run db:seed`.

## Arquitetura

```
prisma/schema.prisma      13 models: User/Account/Session/VerificationToken
                           (auth), Address, Product/Category, Cart/CartItem,
                           Order/OrderItem/Payment/OrderEvent
prisma/seed.ts             categorias + 5 produtos + admin opcional

lib/prisma.ts              client singleton (driver adapter, pooled)
lib/auth.ts                config Auth.js (Credentials + PrismaAdapter)
lib/auth-actions.ts        registerAction/loginAction/logoutAction
lib/account.ts             perfil, endereços, troca de senha
lib/cart.ts                carrinho — anônimo (cookie) + logado (DB), merge no login
lib/orders.ts              criação de pedido (transação: reserva estoque
                           atomicamente), consulta, restauração de estoque
lib/checkout.ts            createOrderAction (cria o pedido) + payOrderAction
                           (cobra via Payment Brick, sem redirect)
lib/payment/               types.ts (interface PaymentGateway) +
                           mercadopago.ts (Payment.create/webhook, ativo) +
                           apply-event.ts (aplica pago/recusado no pedido,
                           usado pelo payOrderAction e pelo webhook) +
                           stripe.ts (stub, não implementado)
lib/admin.ts                ações restritas a role ADMIN
lib/tracking.ts             rastreamento público (sem login)
lib/products.ts             queries de catálogo (server-only)
lib/format.ts                formatPrice/formatInstallments (client-safe,
                             sem import de Prisma — importante não misturar
                             com lib/products.ts, ver nota abaixo)
lib/order-status.ts          ORDER_STATUS_LABELS (client-safe)

proxy.ts                    protege /minha-conta/* (autenticado) e
                             /admin/* (role ADMIN) — Next 16 renomeou
                             middleware.ts para proxy.ts

app/(store)/carrinho, checkout, checkout/sucesso, checkout/erro
app/(account)/minha-conta/{pedidos,dados,enderecos,seguranca}
app/admin/{produtos,pedidos,clientes,cupons}
app/rastrear-pedido        público, sem login
app/api/webhooks/mercadopago  valida assinatura (WebhookSignatureValidator
                               do SDK), atualiza Order+Payment, cria
                               OrderEvent, restaura estoque se cancelado
app/api/webhooks/stripe       501 — gateway não implementado
```

### Por que `lib/products.ts` e `lib/format.ts` são arquivos separados

`lib/products.ts` importa `prisma` (que importa o driver `pg`, só roda em
Node). `formatPrice`/`formatInstallments` são usados também em Client
Components (`ProductCard`, `HeaderClient`, etc.). Se essas funções
morassem no mesmo arquivo que as queries Prisma, importar `formatPrice`
num Client Component puxaria o módulo inteiro — incluindo `pg` — pro bundle
do browser, e o build quebra (`Module not found: Can't resolve 'net'/'tls'`).
Por isso: `lib/format.ts` e `lib/order-status.ts` são "puros" (zero import
de Prisma), e tanto `lib/prisma.ts` quanto `lib/products.ts`/`lib/orders.ts`
têm `import "server-only"` no topo pra pegar esse erro em build-time em vez
de silenciosamente vazar código de servidor pro cliente.

### Carrinho: anônimo -> logado

Visitante sem login ganha um cookie httpOnly (`cart_session_id`) na primeira
adição ao carrinho. Cart no banco é criado com `sessionId` (não `userId`).
No login/cadastro, `mergeCartOnLogin()` funde esse carrinho no carrinho do
usuário (somando quantidades, respeitando estoque) e apaga o carrinho
anônimo.

### Pedido e estoque

`createOrderFromCart` roda dentro de uma `$transaction`: decrementa estoque
linha por linha com `updateMany({ where: { stock: { gte: quantity } } })` —
se a condição falhar (corrida entre dois checkouts do último item), a
transação inteira reverte e o cliente recebe erro claro, não um pedido
"fantasma". Cancelamento/reembolso (`restoreOrderStock`) devolve o estoque.

## Catálogo

`prisma/seed.ts` popula 5 produtos (creatina, UNIQFIRE termogênico,
pré-treino, shaker, camiseta — sem whey) e 5 categorias. Sem fotos reais
ainda — cards mostram um bloco estilizado com o nome do produto.

## Segurança — o que já está e o que falta

**Já implementado:**
- Senhas com bcrypt, nunca em texto puro
- Nenhum dado de cartão trafega ou é armazenado pelo site (Payment Brick do
  Mercado Pago — mesmo embutido na página, o formulário de cartão roda num
  iframe deles, tokenizado; o site nunca vê o número do cartão)
- Webhook do Mercado Pago valida assinatura HMAC (`WebhookSignatureValidator`
  do SDK oficial) antes de processar qualquer evento
- Rotas `/minha-conta/*` e `/admin/*` protegidas em `proxy.ts` (nível de
  rota) — mas cada Server Action também revalida (`requireAdmin()`,
  `requireUserId()`) porque Proxy sozinho não cobre Server Actions em todos
  os casos (ver aviso da própria doc do Next 16 sobre isso)
- Zod valida todo input de formulário, incluindo CPF com dígito verificador
  real (não é só regex de tamanho)

**Ainda falta pra produção:**
- Rate limiting em login/cadastro (hoje não tem — força bruta é possível)
- Recuperação de senha por email (precisa de um provedor de email — Resend,
  SES etc. — estrutura não criada ainda)
- Cálculo de frete real (campo `shippingTotal` existe, fica em 0)
- Cupons (`discountTotal` existe no Order, mas não tem model `Coupon` —
  ver `app/admin/cupons/page.tsx` pra instruções de como adicionar)

## Próximos passos sugeridos

1. Criar conta Mercado Pago e configurar `MERCADO_PAGO_ACCESS_TOKEN` +
   `MERCADO_PAGO_WEBHOOK_SECRET` + `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`
   (sandbox primeiro, depois produção)
2. Configurar as mesmas env vars no projeto Vercel antes do próximo deploy
   (`vercel env add`) — sem isso o site em produção não vai ter banco nem
   pagamento
3. Fotos de produto reais
4. Fechar tipografia oficial da marca
5. Rate limiting + recuperação de senha antes de abrir pro público
