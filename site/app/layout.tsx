import type { Metadata } from "next";
import { Oswald, Inter, Archivo_Black } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import MetaPixel from "@/components/MetaPixel";
import { SITE_NAME, SITE_DESCRIPTION, SITE_KEYWORDS, BRAND_TAGLINE, SITE_URL } from "@/lib/seo";

// Condensed/heavy display placeholder (design-guide.md: official typeface
// not chosen yet). Anton was tried first but its glyph shaping breaks for
// Ã/É/Ê whenever the element gets an opacity/transform change after first
// paint (repro'd independent of animation library) — swap for another
// heavy display font if this one doesn't work for the final choice.
const display = Archivo_Black({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-archivo",
});

const oswald = Oswald({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Uniqueness Sports | Suplementos, Roupas e Acessórios Esportivos",
    template: "%s | Uniqueness Sports",
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Uniqueness Sports | Suplementos e Lifestyle Esportivo",
    description: "Produtos esportivos com presença, qualidade e identidade para quem vive o treino.",
    url: SITE_URL,
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Uniqueness Sports | Suplementos e Lifestyle Esportivo",
    description: "Produtos esportivos com presença, qualidade e identidade para quem vive o treino.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SportingGoodsStore",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/identidade/logo.png`,
  description: BRAND_TAGLINE,
  areaServed: "BR",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "pt-BR",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${oswald.variable} ${inter.variable}`}
    >
      <body className="bg-bg text-ink antialiased">
        <MetaPixel />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <AnnouncementBar />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
