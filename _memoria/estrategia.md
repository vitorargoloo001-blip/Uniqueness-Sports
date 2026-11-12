# Estratégia

> O que importa agora. Prioridades, metas, prazos.
> O Claude usa isso pra decidir o que sugerir primeiro e o que adiar.
> Atualize sempre que as prioridades mudarem.

## Fase

Marca com direção de produto e identidade visual definidas. Site evoluiu de institucional+WhatsApp pra **e-commerce completo** no mesmo dia (2026-08-27): contas, endereços, carrinho, checkout, banco de dados (Postgres/Supabase), pedidos, rastreamento — tudo real e testado ponta a ponta, não maquete. Ver `site/README.md` pra arquitetura e status detalhado.

Painel administrativo virou projeto Next.js **separado** (`admin/`, "Uniqueness Admin", 2026-08-28) — conectado ao mesmo banco, só usuários ADMIN acessam. CRUD real (produtos, categorias, pedidos, clientes, cupons, banners, demandas, relatórios, equipe admin) com upload de imagem via Supabase Storage. Dois pontos ainda não conectados ao site público: os textos editados em "Conteúdo do site" (`SiteSetting`) não são lidos por nenhuma página do `site/` ainda, e "Demandas" (`Lead`) não tem formulário público alimentando — a página `/contato` do site só tem links de WhatsApp/email. Ver `admin/README.md`.

## Prioridade principal

**Gargalo atual:** pagamento ainda não processa de verdade — a integração com Mercado Pago está pronta no código (checkout, webhook com verificação de assinatura, atualização automática de pedido), mas falta a conta/credenciais reais (`MERCADO_PAGO_ACCESS_TOKEN`). Sem isso o site cria o pedido normalmente mas não cobra. Depois de configurar localmente, as mesmas variáveis precisam ir pro projeto Vercel antes do próximo deploy, senão o site em produção fica sem banco/pagamento.

**Pra tirar das costas** (candidata a virar skill via `/mapear-rotinas`): a rotina semanal de transformar a visão da marca em conteúdo prático — definir o que postar, ajustar copy, briefing de arte, revisar se tá com a cara da Uniqueness e manter tudo consistente (sem cair em conteúdo genérico de suplemento).

**Próximas prioridades:** criar conta Mercado Pago e configurar credenciais (local + Vercel); fotos de produto reais; fechar tipografia oficial; recuperação de senha por email antes de abrir pro público (rate limiting no login já está implementado — ver seção "Segurança" em `site/README.md` pro que ainda falta); decidir se as páginas básicas de admin dentro de `site/app/admin/` são removidas agora que existe o painel dedicado. Login do admin está em `.env.local` (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, gitignored, válido tanto pro site quanto pro `admin/` — mesma conta) — trocar a senha após o primeiro acesso.

`admin/` em produção: `https://uniqueness-admin.vercel.app` (projeto Vercel próprio, `uniqueness-admin`, mesmo time). `AUTH_SECRET` de produção é diferente do dev e do usado pelo `site/` — não compartilhado entre projetos.

## O que pode esperar

## Contexto com prazo
