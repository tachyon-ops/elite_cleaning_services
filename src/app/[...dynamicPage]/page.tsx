import React from "react";
import { notFound, redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { InPlacePageEditor } from "@/components/InPlacePageEditor";
import { checkAndSeedDb } from "@/lib/db/seed-checker";
import { ContactSection } from "@/components/ContactSection";

export const dynamic = "force-dynamic";

const LOCALES = ["de", "en", "fr", "it", "rm", "es", "pt"];
const DEFAULT_LOCALE = "de";

interface PageProps {
  params: Promise<{ dynamicPage: string[] }>;
}

function renderMarkdownToHtml(md: string): string {
  // Normalize carriage returns to avoid parsing issues across OS or databases
  let html = md
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers (smaller, elegant, and using valid Tailwind classes from our typography scale)
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-display-sm font-display font-bold text-ink uppercase tracking-wider mb-6 border-b border-border/30 pb-4">$1</h1>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-body-lg font-bold text-ink uppercase tracking-wider mt-8 mb-3">$1</h2>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-body-sm font-semibold text-accent uppercase tracking-wider mt-6 mb-2">$1</h3>');

  // Bullet Lists
  html = html.replace(/^\s*-\s+(.+)$/gm, '<li class="ml-6 list-disc mb-2 text-ink-subtle">$1</li>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code class="bg-bg-subtle px-1.5 py-0.5 rounded text-sm font-mono border border-border/50 text-ink">$1</code>');

  // Images
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="my-8 rounded-xl shadow-lg border border-border/30 max-w-full h-auto mx-auto" />');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-accent hover:text-accent-hover underline">$1</a>');

  // Split into blocks by double newlines for paragraphs
  const blocks = html.split(/\n\n+/);
  html = blocks
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      
      // If it contains structural elements, output directly
      if (trimmed.startsWith("<h") || trimmed.startsWith("<li")) {
        return trimmed;
      }
      
      // Treat as paragraph
      const formatted = trimmed.replace(/\n/g, "<br />");
      return `<p class="text-body-md text-ink-subtle mb-6 leading-relaxed">${formatted}</p>`;
    })
    .join("\n");

  return html;
}

export default async function DynamicStaticPage({ params }: PageProps) {
  // Ensure seed check is run in case database is cold
  await checkAndSeedDb();

  const awaitedParams = await params;
  const pathParts = awaitedParams.dynamicPage || [];
  const rawPath = pathParts.join("/");

  // Determine active locale
  const reqHeaders = await headers();
  const localeHeader = reqHeaders.get("x-locale");
  const cookieStore = await cookies();
  const locale = localeHeader || cookieStore.get("NEXT_LOCALE")?.value || DEFAULT_LOCALE;

  // 1. Attempt exact lookup for this slug and locale
  const translation = await db.pageTranslation.findFirst({
    where: {
      slug: rawPath,
      locale: locale
    },
    include: {
      page: true
    }
  });

  // 2. Fallback check: Did they request a slug that belongs to another locale?
  if (!translation) {
    const alternateTranslation = await db.pageTranslation.findFirst({
      where: {
        slug: rawPath
      },
      include: {
        page: true
      }
    });

    if (alternateTranslation) {
      // Find the equivalent translation for the active locale
      const targetTranslation = await db.pageTranslation.findFirst({
        where: {
          pageId: alternateTranslation.pageId,
          locale: locale
        }
      });

      if (targetTranslation) {
        // Redirect to the correct localized canonical slug
        const redirectSlug = targetTranslation.slug;
        const redirectUrl = `/${locale}/${redirectSlug}`;
        
        return redirect(redirectUrl);
      }
    }
    
    // If absolutely not matching any pages in the system, 404
    return notFound();
  }

  // Check if admin edit mode should be active
  const isAdmin = cookieStore.get("admin_session")?.value === "true";

  // Fetch admin configured values for contact details (or fallbacks)
  const emailRes = await db.systemSetting.findUnique({ where: { key: "contact_email" } });
  const phoneRes = await db.systemSetting.findUnique({ where: { key: "contact_phone" } });
  const addressRes = await db.systemSetting.findUnique({ where: { key: "contact_address" } });
  const showPhoneRes = await db.systemSetting.findUnique({ where: { key: "show_phone_number" } });
  const showOfficeRes = await db.systemSetting.findUnique({ where: { key: "show_office_address" } });

  const email = emailRes?.value || "ops@elite-cleaning.ch";
  const showPhone = showPhoneRes?.value !== "false";
  const phone = showPhone ? (phoneRes?.value || "+41 (0) 44 123 4567") : "";
  const address = addressRes?.value || "Bahnhofstrasse 12, 8001 Zürich, Switzerland";
  const showOffice = showOfficeRes ? showOfficeRes.value !== "false" : true;

  const whatsappNumRes = await db.systemSetting.findUnique({ where: { key: "whatsapp_number" } });
  const whatsappLabelRes = await db.systemSetting.findUnique({ where: { key: "whatsapp_label" } });
  const whatsappNum = whatsappNumRes?.value || "";
  const whatsappLabel = whatsappLabelRes?.value || "";

  // Replace placeholders dynamically
  const contentWithConfig = translation.content
    .replaceAll("{{CONTACT_EMAIL}}", email)
    .replaceAll("{{CONTACT_PHONE}}", phone)
    .replaceAll("{{CONTACT_ADDRESS}}", address);

  const parsedHtml = renderMarkdownToHtml(contentWithConfig);

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-body">
      <Header />

      <main className="flex-1 bg-bg py-16 md:py-24">
        <div className={`mx-auto px-6 transition-all duration-500 ${translation.page.key === "contact" ? "max-w-6xl" : "max-w-4xl"}`}>
          {/* Main article layout */}
          <article className="prose prose-invert max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: parsedHtml }} 
              className="text-body-md text-ink-subtle"
            />
          </article>

          {translation.page.key === "contact" && (
            <ContactSection
              locale={locale}
              email={email}
              phone={phone}
              showPhone={showPhone}
              address={address}
              whatsappNum={whatsappNum}
              whatsappLabel={whatsappLabel}
              showOffice={showOffice}
            />
          )}
        </div>
      </main>

      <Footer />

      {/* Mount editor if user has admin privileges */}
      {isAdmin && (
        <InPlacePageEditor
          pageKey={translation.page.key}
          initialLocale={locale}
          initialSlug={translation.slug}
          initialTitle={translation.title}
          initialContent={translation.content}
        />
      )}
    </div>
  );
}
