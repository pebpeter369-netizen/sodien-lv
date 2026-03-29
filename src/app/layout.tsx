import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { NotificationPrompt } from "@/components/ui/NotificationPrompt";

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

const siteUrl = process.env.SITE_URL || "https://tavadiena.lv";

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
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
  openGraph: {
    type: "website",
    locale: "lv_LV",
    siteName: "TavaDiena.lv",
    url: siteUrl,
  },
  twitter: {
    card: "summary",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
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
