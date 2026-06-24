import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { cookies, headers } from "next/headers";
import { getTranslationsForLocale } from "@/lib/i18n";
import { LanguageProvider } from "@/components/LanguageProvider";
import { CookieBanner } from "@/components/CookieBanner";
import { DemoStoreRibbon } from "@/components/DemoStoreRibbon";
import { AIChatBubble } from "@/components/AIChatBubble";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Mondar | Specialty Cleaning Services Switzerland",
    template: "%s | Mondar"
  },
  description: "Bespoke specialty cleaning for aviation, yacht, commercial, and luxury residential properties in Switzerland. Book online with vetted Swiss experts.",
  keywords: ["specialty cleaning", "private jet cleaning", "yacht detailing Switzerland", "office cleaning Zurich", "luxury villa cleaning", "Mondar cleaning", "commercial cleaning Swiss"],
  authors: [{ name: "Mondar AG" }],
  creator: "Mondar AG",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://mondar.ch"),
  openGraph: {
    title: "Mondar | Specialty Cleaning Services",
    description: "Bespoke specialty cleaning for aviation, yacht, commercial, and luxury residential properties in Switzerland.",
    url: "https://mondar.ch",
    siteName: "Mondar",
    images: [
      {
        url: "/images/hero.png",
        width: 1200,
        height: 630,
        alt: "Mondar Specialty Cleaning Services"
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mondar | Specialty Cleaning Services",
    description: "Bespoke specialty cleaning in Switzerland.",
    images: ["/images/hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const reqHeaders = await headers();
  const localeHeader = reqHeaders.get("x-locale");
  const cookieStore = await cookies();
  const locale = localeHeader || cookieStore.get("NEXT_LOCALE")?.value || "de";
  const dictionary = getTranslationsForLocale(locale);

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">
        <LanguageProvider locale={locale} dictionary={dictionary}>
          <DemoStoreRibbon />
          {children}
          <CookieBanner />
          <AIChatBubble />
        </LanguageProvider>
      </body>
    </html>
  );
}

