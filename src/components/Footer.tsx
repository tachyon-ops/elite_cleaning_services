import React from "react";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { db } from "@/lib/db";
import { cookies, headers } from "next/headers";
import { getTranslationsForLocale, translate, localizeHref } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { COMPANY_CONFIG } from "@/lib/config";

const verticalMeta: Record<string, { link: string }> = {
  domestic: { link: "/book/domestic" },
  moveout: { link: "/book/moveout" },
  aviation: { link: "/book/aviation" },
  yacht: { link: "/book/yacht" },
  commercial: { link: "/book/commercial" },
  hospitality: { link: "/book/hospitality" },
  special: { link: "/book/special-services" }
};

interface CategoryType {
  slug: string;
  customPriceText: string | null;
}

export async function Footer() {
  const reqHeaders = await headers();
  const localeHeader = reqHeaders.get("x-locale");
  const cookieStore = await cookies();
  const locale = localeHeader || cookieStore.get("NEXT_LOCALE")?.value || "de";
  const dictionary = getTranslationsForLocale(locale);
  const t = (key: string) => translate(key, dictionary);

  const phoneSetting = await db.systemSetting.findUnique({
    where: { key: "contact_phone" }
  });
  const emailSetting = await db.systemSetting.findUnique({
    where: { key: "contact_email" }
  });

  const phone = phoneSetting?.value || COMPANY_CONFIG.phone;
  const email = emailSetting?.value || COMPANY_CONFIG.email;

  const activeCategories = await db.serviceCategory.findMany({
    where: { active: true }
  }) as CategoryType[];

  const displayOrder = ["domestic", "moveout", "aviation", "yacht", "commercial", "hospitality", "special"];

  const sortedCategories = activeCategories.sort((a: CategoryType, b: CategoryType) => {
    const indexA = displayOrder.indexOf(a.slug);
    const indexB = displayOrder.indexOf(b.slug);
    const orderA = indexA === -1 ? 999 : indexA;
    const orderB = indexB === -1 ? 999 : indexB;
    return orderA - orderB;
  });

  return (
    <footer className="bg-ink text-ink-inverse mt-auto border-t border-ink-muted/20">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 md:px-16 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 lg:gap-12">
        {/* Col 1 */}
        <div className="text-center md:text-left">
          <span className="font-display text-display-sm font-bold text-ink-inverse tracking-tight">ELITE</span>
          <p className="text-body-sm text-ink-subtle mt-4 max-w-[25ch] mx-auto md:mx-0">
            {t("footerSection.tagline")}
          </p>
        </div>
        {/* Links Group */}
        <div className="grid grid-cols-2 gap-8 md:contents">
          {/* Col 2 */}
          <div>
            <span className="text-caption text-accent uppercase block mb-4">{t("footerSection.services")}</span>
            <ul className="space-y-2 text-body-sm text-ink-subtle">
              {sortedCategories.map((cat: CategoryType) => (
                <li key={cat.slug}>
                  <Link href={localizeHref(verticalMeta[cat.slug]?.link || `/book/${cat.slug}`, locale)} className="hover:text-ink-inverse transition-colors">
                    {t(`categories.${cat.slug}.title`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Col 3 */}
          <div>
            <span className="text-caption text-accent uppercase block mb-4">{t("footerSection.company")}</span>
            <ul className="space-y-2 text-body-sm text-ink-subtle">
              <li><Link href={localizeHref("/about", locale)} className="hover:text-ink-inverse transition-colors">{t("footerSection.aboutUs")}</Link></li>
              <li><Link href={localizeHref("/providers", locale)} className="hover:text-ink-inverse transition-colors">{t("footerSection.becomePartner")}</Link></li>
              <li><Link href={localizeHref("/providers/account/login", locale)} className="hover:text-ink-inverse transition-colors">{t("footerSection.partnerLogin")}</Link></li>
              <li><Link href={localizeHref("/admin/login", locale)} className="hover:text-ink-inverse transition-colors">{t("footerSection.staffLogin")}</Link></li>
              <li><Link href={localizeHref("/contact", locale)} className="hover:text-ink-inverse transition-colors">{t("footerSection.contact")}</Link></li>
            </ul>
          </div>
        </div>
        {/* Col 4 */}
        <div className="text-center md:text-left border-t border-ink-muted/10 pt-8 md:pt-0 md:border-t-0">
          <span className="text-caption text-accent uppercase block mb-4">{t("footerSection.contactHeader")}</span>
          <div className="inline-flex flex-col items-center md:items-start gap-3 text-body-sm text-ink-subtle">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-accent shrink-0" />
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="hover:text-ink-inverse transition-colors">
                {phone}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-accent shrink-0" />
              <a href={`mailto:${email}`} className="hover:text-ink-inverse transition-colors">
                {email}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="border-t border-ink-muted/20 py-8 px-6 md:px-16 text-body-sm text-ink-subtle max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto md:order-last">
          <LanguageSwitcher />
          <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
            <Link href={localizeHref("/legal/privacy", locale)} className="hover:text-ink-inverse transition-colors">{t("footerSection.privacy")}</Link>
            <Link href={localizeHref("/legal/terms", locale)} className="hover:text-ink-inverse transition-colors">{t("footerSection.terms")}</Link>
            <Link href={localizeHref("/legal/cookies", locale)} className="hover:text-ink-inverse transition-colors">{t("footerSection.cookies")}</Link>
            <Link href={localizeHref("/legal/impressum", locale)} className="hover:text-ink-inverse transition-colors">{t("footerSection.impressum")}</Link>
            <Link href={localizeHref("/legal/provider-terms", locale)} className="hover:text-ink-inverse transition-colors">{t("footerSection.providerTerms")}</Link>
          </div>
        </div>
        <span className="text-caption md:text-body-sm text-center md:text-left md:order-first">&copy; {new Date().getFullYear()} {t("footerSection.copyright")}</span>
      </div>
    </footer>
  );
}
