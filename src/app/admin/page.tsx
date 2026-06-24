import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslationsForLocale, translate } from "@/lib/i18n";
import { isAdminAuthenticated, getDashboardStats } from "@/app/actions/admin";
import { Calendar, CreditCard, Star, Clock, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import { ContactConfigForm } from "./ContactConfigForm";

export default async function AdminDashboardPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";
  const dictionary = getTranslationsForLocale(locale);
  const t = (key: string) => translate(key, dictionary);

  const res = await getDashboardStats();
  const stats = res.success && res.stats ? res.stats : {
    bookingsCount: 0,
    activeBookings: 0,
    completedBookings: 0,
    revenueMTD: 0,
    avgRating: 5.0
  };

  // Fetch company & contact configuration directly from system settings
  const whatsappNumberRes = await db.systemSetting.findUnique({ where: { key: "whatsapp_number" } });
  const whatsappLabelRes = await db.systemSetting.findUnique({ where: { key: "whatsapp_label" } });
  const contactPhoneRes = await db.systemSetting.findUnique({ where: { key: "contact_phone" } });
  const contactEmailRes = await db.systemSetting.findUnique({ where: { key: "contact_email" } });
  const contactAddressRes = await db.systemSetting.findUnique({ where: { key: "contact_address" } });
  const autoCheckoutRes = await db.systemSetting.findUnique({ where: { key: "auto_checkout" } });
  const showPhoneRes = await db.systemSetting.findUnique({ where: { key: "show_phone_number" } });
  const showOfficeRes = await db.systemSetting.findUnique({ where: { key: "show_office_address" } });

  const initialWhatsappNumber = whatsappNumberRes?.value || "41791234567";
  const initialWhatsappLabel = whatsappLabelRes?.value || "+41 79 123 45 67";
  const initialContactPhone = contactPhoneRes?.value || "+41 (0) 44 123 4567";
  const initialContactEmail = contactEmailRes?.value || "ops@elite-cleaning.ch";
  const initialContactAddress = contactAddressRes?.value || "Bahnhofstrasse 12, 8001 Zürich, Switzerland";
  const initialAutoCheckout = autoCheckoutRes ? autoCheckoutRes.value === "true" : true;
  const initialShowPhone = showPhoneRes ? showPhoneRes.value !== "false" : true;
  const initialShowOffice = showOfficeRes ? showOfficeRes.value !== "false" : true;

  return (
    <div className="p-8 md:p-12 space-y-8 max-w-7xl w-full mx-auto">
      <header>
        <span className="text-caption text-accent uppercase tracking-widest block mb-2">
          {t("admin.dashboard.operationsHub")}
        </span>
        <h1 className="text-display-md font-display font-medium text-[#f2f2f2] tracking-tight">
          {t("admin.dashboard.systemOverview")}
        </h1>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center text-[#a6a6a6]">
            <span className="text-caption font-semibold uppercase tracking-wider">
              {t("admin.dashboard.activeBookings")}
            </span>
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-display-sm font-bold text-[#f2f2f2] block">{stats.activeBookings}</span>
            <span className="text-body-xs text-[#a6a6a6]">
              {t("admin.dashboard.pendingDispatches")}
            </span>
          </div>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center text-[#a6a6a6]">
            <span className="text-caption font-semibold uppercase tracking-wider">
              {t("admin.dashboard.revenueMtd")}
            </span>
            <CreditCard className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-display-sm font-bold text-[#f2f2f2] block">CHF {stats.revenueMTD}</span>
            <span className="text-body-xs text-[#a6a6a6]">
              {t("admin.dashboard.fromCompletedDeposits")}
            </span>
          </div>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center text-[#a6a6a6]">
            <span className="text-caption font-semibold uppercase tracking-wider">
              {t("admin.dashboard.totalBookings")}
            </span>
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-display-sm font-bold text-[#f2f2f2] block">{stats.bookingsCount}</span>
            <span className="text-body-xs text-[#a6a6a6]">
              {t("admin.dashboard.allLoggedBookings")}
            </span>
          </div>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center text-[#a6a6a6]">
            <span className="text-caption font-semibold uppercase tracking-wider">
              {t("admin.dashboard.avgRating")}
            </span>
            <Star className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-display-sm font-bold text-[#f2f2f2] block">{stats.avgRating} / 5</span>
            <span className="text-body-xs text-[#a6a6a6]">
              {t("admin.dashboard.satisfactionIndex")}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: System Notice & Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 border border-[#262626] bg-[#141414] p-6 rounded-lg flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-body-md font-semibold text-[#f2f2f2]">
              {t("admin.dashboard.noticeTitle")}
            </h3>
            <p className="text-body-sm text-[#a6a6a6] leading-relaxed">
              {t("admin.dashboard.noticeText")}
            </p>
          </div>
        </div>

        <div>
          <ContactConfigForm
            initialWhatsappNumber={initialWhatsappNumber}
            initialWhatsappLabel={initialWhatsappLabel}
            initialContactPhone={initialContactPhone}
            initialContactEmail={initialContactEmail}
            initialContactAddress={initialContactAddress}
            initialAutoCheckout={initialAutoCheckout}
            initialShowPhone={initialShowPhone}
            initialShowOffice={initialShowOffice}
          />
        </div>
      </div>
    </div>
  );
}
