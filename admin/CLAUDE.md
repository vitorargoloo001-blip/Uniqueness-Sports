@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This folder is a Next.js codebase living inside the larger MazyOS content-ops
workspace (`../CLAUDE.md`, `../_memoria/`, `../identidade/design-guide.md`).
There is no separate git repo here — this folder is part of the MazyOS repo
one level up, so run git commands from `../`.

**This is a separate Next.js project from `../site/`** (the public store),
but both connect to the **same** PostgreSQL database via the same
`DATABASE_URL`/`DIRECT_URL`. Schema changes made in one project's
`prisma/schema.prisma` must be mirrored into the other's — there is no
automated sync. See `README.md` for the full rationale and current
integration gaps (SiteSetting/Lead tables exist and have real CRUD here,
but the storefront doesn't read/write them yet).

**`Coupon` scope (2026-08-28)**: `Coupon.productId`/`.categoryId` (both
nullable, mutually exclusive — enforced by `couponSchema`'s `.refine()` in
`lib/validations.ts`, not a DB constraint) let a coupon target one
specific product, one specific category, or — if both are null — the
whole store. The form's `scope: "STORE" | "PRODUCT" | "CATEGORY"` field is
UI-only sugar; `coupons-actions.ts`'s `toData()` collapses it back down to
the two nullable FK columns before writing. **The storefront now has full
redemption** (`site/`: `Cart.couponId`, a code input in `(store)/carrinho`
and `(store)/checkout`, server-side revalidation on every cart read and
again independently at order time, an offer badge on scoped products, and
a store-wide countdown announcement bar) — built 2026-08-28, see
`site/CLAUDE.md`/`site/lib/coupons.ts`. Nothing here on the admin side
changed for it; the admin only needed the scope fields above.

## Commands

Run from this directory (`MazyOS/admin/`):

```bash
npm install       # also runs `prisma generate` via postinstall
npm run dev       # Turbopack dev server, http://localhost:3001
npm run build     # production build
npm run start     # serve the production build (port 3001)
npm run lint      # ESLint (flat config)
npm run db:migrate   # prisma migrate dev — see Prisma gotcha below
npm run db:studio    # Prisma Studio, browse/edit data directly
```

No test suite is configured.

## Version warnings — read before writing code

This project sits on the same bleeding-edge Next.js/Prisma majors as
`site/`, **plus two more libraries whose current API differs sharply from
older/training-data versions**. Don't assume — check the installed API.

**Next.js 16** / **Prisma 7** / **Auth.js v5**: same gotchas as `site/` —
`proxy.ts` not `middleware.ts`, driver-adapter Prisma client
(`lib/prisma.ts`), `signIn()` throws `AuthError` on bad creds. See
`../site/CLAUDE.md` for the full writeup; not repeated here.

**TanStack Table v9** (`@tanstack/react-table@^9`): this is **not** the
commonly-known v8 API. Every feature (sorting, pagination, filtering) must
be registered explicitly via `tableFeatures({...})` — there's no bundled
"everything on" default, and `useReactTable` is replaced by `useTable`.
`node_modules/@tanstack/react-table/skills/migrate-v8-to-v9/SKILL.md` and
`node_modules/@tanstack/table-core/skills/*/SKILL.md` are the authoritative
source (bundled with the installed package, so they match this exact
version — check them before touching table code, not training data).
This project centralizes the feature set in `lib/table-features.ts` and
the reusable grid in `components/data-table.tsx` — reuse both rather than
calling `useTable` directly. Column arrays **must** be built with
`columnHelper.columns([...])` (not a plain array) or per-column `TValue`
inference breaks and the build fails with a wall of generic-mismatch
errors — see any `components/<entity>/*-table.tsx` for the pattern.

**shadcn/ui preset `radix-nova`**: this project's `components.json` uses a
newer shadcn preset that does **not** ship the classic
`Form`/`FormField`/`FormMessage` wrapper around React Hook Form. Instead
it ships primitive `Field`/`FieldLabel`/`FieldError`/`FieldGroup`
(`components/ui/field.tsx`) meant to be wired manually: `register()` +
`Controller` from RHF, `errors={[errors.fieldName]}` passed straight into
`FieldError`. See any `components/<entity>/*-form.tsx` for the pattern.
Running `npx shadcn@latest add form` on this preset is a no-op — use
`npx shadcn@latest add field` instead if that file is ever missing.

**RHF + Zod v4 `z.coerce`**: any form schema using `z.coerce.number()`
(prices, quantities, etc.) needs `useForm<z.input<typeof schema>, unknown,
z.infer<typeof schema>>` — plain `useForm<SchemaType>` fails to type-check
because `zodResolver`'s input type (`z.input`, pre-coercion, e.g.
`unknown`) differs from its output type (`z.infer`, post-coercion, e.g.
`number`). See `components/produtos/product-form.tsx` or
`components/cupons/coupon-form.tsx` for the pattern.

## Critical gotcha: the server/client module boundary

Same rule as `site/`: `lib/prisma.ts` and every `lib/*.ts` file that
queries Prisma directly (`lib/products.ts`, `lib/orders.ts`, `lib/dashboard.ts`,
etc.) starts with `import "server-only"`. Pure formatting/status helpers
live in `lib/format.ts` and `lib/status.ts` instead — Prisma-free, safe to
import from Client Components.

**A second, easy-to-miss version of the same boundary bug**: a Server
Component page that does `const data = orders.map((o) => ({ ...o, total:
Number(o.total) }))` and passes `data` to a Client Component looks safe
because `total` got converted — but if the Prisma row has *other*
`Decimal` fields (e.g. `Order.subtotal`, `.shippingTotal`,
`.discountTotal` alongside `.total`), the `...o` spread carries those
raw `Decimal` class instances across the RSC boundary untouched, and
React throws `Only plain objects can be passed to Client Components from
Server Components` at runtime (build still succeeds — TypeScript doesn't
catch this, only running the page does). Fix: build the object passed to
a Client Component explicitly, field by field, converting every
`Decimal` — never spread a raw Prisma row into client-bound props. See
`app/(dashboard)/pedidos/page.tsx` for the corrected pattern (this was
caught and fixed during initial Playwright verification, not by the type
checker).

## Two bugs found only in production (not local dev) — 2026-08-28

**Server Action body size limit**: Next.js defaults `experimental.serverActions.bodySizeLimit`
to 1MB. The storage bucket accepts uploads up to 8MB
(`lib/upload-actions.ts`), so any real product/category/banner photo over
~1MB made `uploadImageAction` fail with `Error: Body exceeds...` → a 500
on the page. Never caught locally because test uploads used a tiny
generated image. Fixed by setting `serverActions.bodySizeLimit: "10mb"` in
`next.config.ts` — if raising the storage bucket's own limit later, bump
this too (keep it above the bucket limit, not equal to it).

**Hydration mismatch (`Minified React error #418`) from timezone/locale-dependent formatting**:
Any `.toLocaleDateString()` / `.toLocaleString()` call *without* an
explicit `timeZone` (and, for numbers, without an explicit locale)
produces different output on the server (Vercel, not Brazil's timezone)
than in the browser (a Brazilian admin's local timezone) — and since these
calls happen inside Client Components that are also SSR'd, that
divergence is a real hydration mismatch, not just a cosmetic risk. Fixed
in `lib/format.ts` (`timeZone: "America/Sao_Paulo"` — these format real
timestamps like `Order.createdAt`, meant to read in the business's local
time) and in `components/dashboard/sales-chart.tsx` /
`components/relatorios/monthly-revenue-chart.tsx` (`timeZone: "UTC"`
instead — these format `YYYY-MM-DD`/`YYYY-MM` *date-only* keys that
`new Date()` already parses as UTC midnight, so formatting them back in
UTC is what keeps the displayed calendar day correct, not just
hydration-safe; `America/Sao_Paulo` there would silently shift the label
to the previous day). Also pinned the shadcn-vendor `chart.tsx`'s bare
`.toLocaleString()` to `"pt-BR"`. Rule of thumb: any date/number
formatting called from a Client Component's render path needs an
explicit `timeZone` (dates) and locale (numbers) — never rely on runtime
defaults matching between server and browser.

## Shared-database gotcha: product `imageUrl` can be a local path OR a Supabase URL

`Product.imageUrl` was seeded (in `site/prisma/seed.ts`) with **relative
paths** like `/products/product-creatina.png`, resolved against `site/`'s
own `public/` folder — but `admin/` is a separate Vercel deployment with
its own `public/`, so it can never serve those files, and naively
rendering that raw value here 400s. `site/`'s own data layer
(`lib/products.ts`) already null-safes this for the storefront
(`existsSync` check, falls back to a placeholder), but nothing on the
admin side did the equivalent, so a product seeded with a stale local
path rendered as a broken image here. Fixed by nulling out the stale
local-path values in the DB and re-uploading the one real photo (UNIQFIRE)
through Supabase Storage instead, and by teaching `site/lib/products.ts`'s
`resolveImageUrl` to trust `http(s)://` URLs unconditionally rather than
running the local `existsSync` check against them. Going forward, every
image set through this admin panel is already a full Supabase Storage
URL (see `lib/upload-actions.ts`) — this only bites if a product's
`imageUrl` is ever hand-set to a bare local path again.

## Architecture

**Access control**: `proxy.ts` matches every route except `/login`,
`Next/_static` and image assets, and redirects to `/login` unless
`session.user.role === "ADMIN"`. `lib/auth.ts`'s `authorize()` independently
rejects non-`ADMIN` accounts at the credential level — a `CUSTOMER` with a
perfectly valid password still gets `null` back, never a session. Every
Server Action additionally calls `requireAdmin()` (`lib/require-admin.ts`)
— proxy doesn't reliably cover Server Actions in Next 16, same caveat as
`site/`.

**Data layer**: identical Prisma 7 driver-adapter setup to `site/`
(`lib/prisma.ts`, `prisma7.config.ts`), pointed at the same database.
`prisma/schema.prisma` and `prisma/migrations/` are copied from `site/` —
keep them in sync manually when the schema changes in either project.

**Image uploads**: `lib/supabase-admin.ts` holds a service-role Supabase
client (server-only, bypasses RLS). `lib/upload-actions.ts` exposes
`uploadImageAction(folder, formData)` / `deleteImageAction(url)` as Server
Actions, called directly from the client `components/upload/image-upload.tsx`.
Deleting a product/category/banner best-effort deletes its stored image
too (`.catch(() => {})` — never blocks the DB delete on a storage
hiccup).

**Shipping flow (2026-09-23)**: three pages under `app/(dashboard)/pedidos/`
walk a paid order to the customer, one `Order.status` each — `novos`
(`PAID`: buy + generate the Melhor Envio label with account balance, move to
preparo), `em-preparo` (`PROCESSING`: picking list, one batch PDF of labels,
mark as posted — pulls the tracking code from Melhor Envio), `postados`
(`SHIPPED`: tracking, business days vs. quoted deadline, mark delivered).
Queries and the status transitions live in `lib/fluxo.ts`, batch actions in
`lib/fluxo-actions.ts`, UI in `components/pedidos/flow-{header,lists}.tsx`,
stage list in `lib/status.ts`'s `FLOW_STAGES` (also drives the sidebar's
"Envios" group and its counters). Every transition is a conditional
`updateMany` on the source status, because the site moves the same orders
on its own: `site/lib/melhor-envio.ts` creates the shipment in the Melhor
Envio cart when payment approves, and its webhook + daily cron
(`/api/cron/melhor-envio`, which this admin also calls via
`syncShipmentsAction` with `SITE_URL`/`CRON_SECRET`) push
`generated`→`PROCESSING`, `posted`→`SHIPPED`, `delivered`→`DELIVERED`. Status
changes write `OrderEvent`s, which is what the customer sees on the site.

**Tables**: `components/data-table.tsx` is the one generic grid (search +
sort + pagination) every entity list reuses; `lib/table-features.ts`
holds the shared TanStack v9 feature registration (see version warning
above).

**Status colors**: `lib/status.ts` maps every enum (`OrderStatus`,
`PaymentStatus`, `LeadStatus`, `DiscountType`) to a label and a
`StatusVariant` (`success | warning | danger | info | neutral`).
`components/status-badge.tsx` renders the variant using the
`--status-*` CSS custom properties defined in `app/globals.css` — add new
statuses there, never inline a color.

**Styling**: Tailwind v4, shadcn `radix-nova` preset. Light-only by
design (`app/globals.css` `:root` block hardcodes the brand palette from
`../identidade/design-guide.md` — off-white `#F7F5F0` background, white
`#FFFFFF` cards, `#0A0A0A` primary/text); the `.dark` block shadcn
generated is unused dead code, left in place but never triggered since no
component adds a `dark` class or toggle.

**Path alias**: `@/*` resolves to this directory's root (not `src/`).
