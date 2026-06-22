import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { cookies, headers } from "next/headers";
import { getTranslationsForLocale } from "@/lib/i18n";
import { LanguageProvider } from "@/components/LanguageProvider";
import { CookieBanner } from "@/components/CookieBanner";
import { DemoStoreRibbon } from "@/components/DemoStoreRibbon";
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
  title: "Elite Cleaning Services",
  description: "Specialty cleaning booked online. Done by Swiss experts.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
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
        </LanguageProvider>
      </body>
    </html>
  );
}

