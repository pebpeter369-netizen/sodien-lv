import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { NotificationPrompt } from "@/components/ui/NotificationPrompt";
import { SITE_URL as siteUrl } from "@/lib/brand";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const sourceSerif = Source_Serif_4({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563EB",
};

export const metadata: Metadata = {
  title: {
    default: "TavaDiena.lv — Aktuālā informācija Latvijā",
    template: "%s | TavaDiena.lv",
  },
  description:
    "Vārda dienas, algu kalkulators, svētku dienas un aktuālākās ziņas Latvijā. Ērti rīki un informācija katrai dienai.",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
      { url: "/icons/logo-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.svg",
  },
  openGraph: {
    type: "website",
    locale: "lv_LV",
    siteName: "TavaDiena.lv",
    images: [OG_DEFAULT_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

// Site-wide WebSite + Organization JSON-LD (rendered once, in the root layout).
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "TavaDiena.lv",
      alternateName: "Tava Diena",
      inLanguage: "lv",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "TavaDiena.lv",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icons/logo-512.png`,
        width: 512,
        height: 512,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lv">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          async
          src="https://plausible.io/js/pa-ARlhaNjwtRQ550eDS4do6.js"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body
        className={`${sourceSans.variable} ${sourceSerif.variable} antialiased`}
      >
        <Header />
        <main className="min-h-screen pb-16 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
        <NotificationPrompt />
      </body>
    </html>
  );
}
