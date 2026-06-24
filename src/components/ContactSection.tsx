import React from "react";
import Image from "next/image";
import { Mail, Phone, MapPin, MessageSquare, ExternalLink } from "lucide-react";
import { getTranslationsForLocale } from "@/lib/i18n";
import { ContactForm } from "@/components/ContactForm";

interface ContactSectionProps {
  locale: string;
  email: string;
  phone: string;
  showPhone: boolean;
  address: string;
  whatsappNum: string;
  whatsappLabel: string;
  showOffice: boolean;
}

export function ContactSection({
  locale,
  email,
  phone,
  showPhone,
  address,
  whatsappNum,
  whatsappLabel,
  showOffice,
}: ContactSectionProps) {
  const dictionary = getTranslationsForLocale(locale);
  
  // Localized helper to fetch nested values
  const t = (key: string) => {
    try {
      const parts = key.split(".");
      let current = dictionary;
      for (const part of parts) {
        if (current === undefined || current === null || current[part] === undefined) {
          return key;
        }
        current = current[part];
      }
      return typeof current === "string" ? current : key;
    } catch {
      return key;
    }
  };

  const formTranslations = {
    formTitle: t("contactPage.formTitle"),
    formDesc: t("contactPage.formDesc"),
    fieldName: t("contactPage.fieldName"),
    fieldEmail: t("contactPage.fieldEmail"),
    fieldPhone: t("contactPage.fieldPhone"),
    fieldSubject: t("contactPage.fieldSubject"),
    fieldMessage: t("contactPage.fieldMessage"),
    btnSubmit: t("contactPage.btnSubmit"),
    btnSubmitting: t("contactPage.btnSubmitting"),
    successMessage: t("contactPage.successMessage"),
    errorMessage: t("contactPage.errorMessage"),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-8">
      {/* Left side: Information, images, and contact cards */}
      <div className="lg:col-span-5 space-y-8">
        {/* Main image card */}
        <div className="relative group rounded-lg overflow-hidden border border-border/40 shadow-lg aspect-video lg:aspect-[4/3] bg-bg-subtle">
          <Image
            src="/images/contact_hero.png"
            alt="Mondar Switzerland Reception"
            fill
            className="object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
            sizes="(max-width: 1024px) 100vw, 40vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <span className="text-caption text-accent uppercase font-bold tracking-widest block mb-1">
              {t("hero.division")}
            </span>
            <h4 className="text-body-md font-display font-bold text-ink-inverse uppercase tracking-wider">
              {t("nav.brand") || "MONDAR"} Swiss Detailing
            </h4>
          </div>
        </div>

        {/* Contact channels list */}
        <div className="space-y-4">
          {/* Email Card */}
          <a
            href={`mailto:${email}`}
            className="flex items-start gap-4 p-5 bg-bg-subtle/40 hover:bg-bg-subtle border border-border/30 hover:border-accent rounded-lg transition-all duration-300 group shadow-sm hover:shadow"
          >
            <div className="p-3 bg-accent/10 border border-accent/25 rounded-full text-accent group-hover:bg-accent group-hover:text-ink-inverse transition-colors shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 text-body-sm font-bold text-ink uppercase tracking-wider">
                {t("contactPage.emailCardTitle")}
                <ExternalLink className="w-3 h-3 text-ink-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-caption text-ink-subtle">{t("contactPage.emailCardDesc")}</p>
              <p className="text-body-sm text-ink font-medium truncate">{email}</p>
            </div>
          </a>

          {/* WhatsApp Card */}
          {whatsappNum && (
            <a
              href={`https://wa.me/${whatsappNum}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-5 bg-bg-subtle/40 hover:bg-bg-subtle border border-border/30 hover:border-accent rounded-lg transition-all duration-300 group shadow-sm hover:shadow"
            >
              <div className="p-3 bg-accent/10 border border-accent/25 rounded-full text-accent group-hover:bg-accent group-hover:text-ink-inverse transition-colors shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 text-body-sm font-bold text-ink uppercase tracking-wider">
                  {t("contactPage.whatsappCardTitle")}
                  <ExternalLink className="w-3 h-3 text-ink-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-caption text-ink-subtle">{t("contactPage.whatsappCardDesc")}</p>
                <p className="text-body-sm text-ink font-medium truncate">
                  {showPhone ? (whatsappLabel || whatsappNum) : t("contactPage.whatsappCardAction")}
                </p>
              </div>
            </a>
          )}

          {/* Phone Card */}
          {showPhone && phone && (
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              className="flex items-start gap-4 p-5 bg-bg-subtle/40 hover:bg-bg-subtle border border-border/30 hover:border-accent rounded-lg transition-all duration-300 group shadow-sm hover:shadow"
            >
              <div className="p-3 bg-accent/10 border border-accent/25 rounded-full text-accent group-hover:bg-accent group-hover:text-ink-inverse transition-colors shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 text-body-sm font-bold text-ink uppercase tracking-wider">
                  {t("contactPage.phoneCardTitle")}
                  <ExternalLink className="w-3 h-3 text-ink-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-caption text-ink-subtle">{t("contactPage.phoneCardDesc")}</p>
                <p className="text-body-sm text-ink font-medium truncate">{phone}</p>
              </div>
            </a>
          )}

          {/* Address Card */}
          {showOffice && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-5 bg-bg-subtle/40 hover:bg-bg-subtle border border-border/30 hover:border-accent rounded-lg transition-all duration-300 group shadow-sm hover:shadow"
            >
              <div className="p-3 bg-accent/10 border border-accent/25 rounded-full text-accent group-hover:bg-accent group-hover:text-ink-inverse transition-colors shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-body-sm font-bold text-ink uppercase tracking-wider">
                  {t("contactPage.addressCardTitle")}
                  <ExternalLink className="w-3 h-3 text-ink-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-caption text-ink-subtle">{t("contactPage.addressCardDesc")}</p>
                <p className="text-body-sm text-ink font-medium leading-relaxed">{address}</p>
              </div>
              <div className="relative w-16 h-16 rounded overflow-hidden border border-border shrink-0 hidden sm:block">
                <Image
                  src="/images/contact_details.png"
                  alt="Office detail"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            </a>
          )}
        </div>
      </div>

      {/* Right side: The contact form */}
      <div className="lg:col-span-7">
        <ContactForm translations={formTranslations} />
      </div>
    </div>
  );
}
