"use client";

import React, { useState } from "react";
import Link from "next/link";
import { applyProvider } from "@/app/actions/provider";
import { useLanguage } from "@/components/LanguageProvider";
import { localizeHref } from "@/lib/i18n";
import { ShieldCheck, ChevronRight, CheckCircle2 } from "lucide-react";

export default function ProviderApplyPage() {
  const { locale, t } = useLanguage();
  const [formData, setFormData] = useState({
    companyName: "",
    applicantEmail: "",
    applicantName: "",
    legalEntityType: "gmbh",
    verticalsRequested: [] as string[],
    region: "Zürich",
    motivation: "",
    calendarSync: "manual",
    bookingMode: "request",
    recurringSupport: "yes_rotate",
    chatPreference: "opt_in"
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleVerticalToggle = (vertical: string) => {
    if (formData.verticalsRequested.includes(vertical)) {
      setFormData({
        ...formData,
        verticalsRequested: formData.verticalsRequested.filter(v => v !== vertical)
      });
    } else {
      setFormData({
        ...formData,
        verticalsRequested: [...formData.verticalsRequested, vertical]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.applicantEmail || !formData.applicantName) {
      setError(t("providers.apply.errMandatory"));
      return;
    }
    if (formData.verticalsRequested.length === 0) {
      setError(t("providers.apply.errCategory"));
      return;
    }

    setLoading(true);
    setError("");

    const res = await applyProvider({
      companyName: formData.companyName,
      applicantEmail: formData.applicantEmail,
      applicantName: formData.applicantName,
      legalEntityType: formData.legalEntityType,
      verticalsRequested: formData.verticalsRequested,
      region: formData.region,
      motivation: formData.motivation,
      calendarSync: formData.calendarSync,
      bookingMode: formData.bookingMode,
      recurringSupport: formData.recurringSupport,
      chatPreference: formData.chatPreference
    });

    setLoading(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.error || t("providers.apply.errSubmit"));
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#f2f2f2] font-body flex flex-col">
      {/* Header */}
      <nav className="max-w-7xl mx-auto w-full px-6 py-6 border-b border-[#1f1f1f] flex justify-between items-center shrink-0">
        <Link href={localizeHref("/providers", locale)} className="font-display font-medium text-body-lg tracking-widest text-[#f2f2f2] hover:text-accent transition-colors">
          {t("providers.nav.brand")}
        </Link>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex justify-center items-center p-6">
        <div className="max-w-xl w-full border border-[#262626] bg-[#141414] p-8 rounded-lg space-y-6">
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="h-16 w-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center border border-green-500/25 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-display-sm font-display font-medium text-[#f2f2f2]">{t("providers.apply.successTitle")}</h2>
              <p className="text-body-md text-[#a6a6a6] leading-relaxed">
                {t("providers.apply.successDesc")}
              </p>
              <div className="bg-[#0d0d0d] p-4 rounded border border-[#262626] text-body-sm text-[#a6a6a6] max-w-[45ch] mx-auto text-left space-y-1 font-mono">
                <span className="text-accent uppercase font-bold block mb-1">{t("providers.apply.provTitle")}</span>
                <p>{t("providers.apply.provEmail")} <span className="text-[#f2f2f2]">{formData.applicantEmail}</span></p>
                <p>{t("providers.apply.provPassword")} <span className="text-[#f2f2f2]">partner123</span></p>
                <p className="text-body-xs text-[#737373] mt-2 italic">{t("providers.apply.provNotice")}</p>
              </div>
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={localizeHref("/providers", locale)}
                  className="bg-accent hover:bg-accent-hover text-ink-inverse text-button px-6 py-3 rounded font-semibold transition-colors"
                >
                  {t("providers.apply.btnReturn")}
                </Link>
                <Link
                  href={localizeHref("/", locale)}
                  className="border border-[#262626] bg-[#141414] hover:bg-[#1f1f1f] text-[#f2f2f2] text-button px-6 py-3 rounded font-semibold transition-colors"
                >
                  {t("returnHome", "Visit Mondar Home")}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col gap-2">
                <span className="text-caption text-accent uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> {t("providers.apply.secureReg")}
                </span>
                <h2 className="text-display-sm font-display font-medium text-[#f2f2f2] tracking-tight">{t("providers.apply.title")}</h2>
                <p className="text-body-xs text-[#a6a6a6]">{t("providers.apply.desc")}</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md text-body-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-caption text-[#a6a6a6] font-semibold uppercase">{t("providers.apply.labelCompany")}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swiss Clean AG"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-sm focus:border-accent outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-caption text-[#a6a6a6] font-semibold uppercase">{t("providers.apply.labelEntity")}</label>
                  <select
                    value={formData.legalEntityType}
                    onChange={(e) => setFormData({ ...formData, legalEntityType: e.target.value })}
                    className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-sm focus:border-accent outline-none"
                  >
                    <option value="gmbh">GmbH</option>
                    <option value="ag">Aktiengesellschaft (AG)</option>
                    <option value="einzelfirma">Einzelfirma</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-caption text-[#a6a6a6] font-semibold uppercase">{t("providers.apply.labelContact")}</label>
                  <input
                    type="text"
                    required
                    placeholder="Jean Müller"
                    value={formData.applicantName}
                    onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                    className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-sm focus:border-accent outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-caption text-[#a6a6a6] font-semibold uppercase">{t("providers.apply.labelEmail")}</label>
                  <input
                    type="email"
                    required
                    placeholder="ops@swissclean.ch"
                    value={formData.applicantEmail}
                    onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
                    className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-sm focus:border-accent outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-caption text-[#a6a6a6] font-semibold uppercase">{t("providers.apply.labelRegion")}</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-sm focus:border-accent outline-none"
                >
                  <option value="Zürich">Zürich / Lake Zürich</option>
                  <option value="Geneva">Geneva / Lake Geneva</option>
                  <option value="Zug">Zug / Central Switzerland</option>
                  <option value="Lugano">Lugano / Ticino</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-caption text-[#a6a6a6] font-semibold uppercase block">{t("providers.apply.labelVerticals")}</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "domestic", label: t("providers.apply.catDomestic") },
                    { id: "commercial", label: t("providers.apply.catCommercial") },
                    { id: "hospitality", label: t("providers.apply.catHospitality") },
                    { id: "aviation", label: t("providers.apply.catAviation") },
                    { id: "yacht", label: t("providers.apply.catYacht") },
                    { id: "moveout", label: t("providers.apply.catMoveout") }
                  ].map((vert) => (
                    <button
                      key={vert.id}
                      type="button"
                      onClick={() => handleVerticalToggle(vert.id)}
                      className={`p-3 border text-left rounded-md transition-colors text-body-xs font-semibold ${
                        formData.verticalsRequested.includes(vert.id)
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-[#262626] bg-[#0d0d0d] text-[#a6a6a6] hover:bg-[#1a1a1a]"
                      }`}
                    >
                      {vert.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-caption text-[#a6a6a6] font-semibold uppercase">{t("providers.apply.labelCalendarSync")}</label>
                  <select
                    value={formData.calendarSync}
                    onChange={(e) => setFormData({ ...formData, calendarSync: e.target.value })}
                    className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-sm focus:border-accent outline-none"
                  >
                    <option value="google">{t("providers.apply.syncGoogle")}</option>
                    <option value="outlook">{t("providers.apply.syncOutlook")}</option>
                    <option value="apple">{t("providers.apply.syncApple")}</option>
                    <option value="manual">{t("providers.apply.syncManual")}</option>
                    <option value="other">{t("providers.apply.syncOther")}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-caption text-[#a6a6a6] font-semibold uppercase">{t("providers.apply.labelBookingMode")}</label>
                  <select
                    value={formData.bookingMode}
                    onChange={(e) => setFormData({ ...formData, bookingMode: e.target.value })}
                    className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-sm focus:border-accent outline-none"
                  >
                    <option value="instant">{t("providers.apply.modeInstant")}</option>
                    <option value="request">{t("providers.apply.modeRequest")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-caption text-[#a6a6a6] font-semibold uppercase">{t("providers.apply.labelRecurringSupport")}</label>
                  <select
                    value={formData.recurringSupport}
                    onChange={(e) => setFormData({ ...formData, recurringSupport: e.target.value })}
                    className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-sm focus:border-accent outline-none"
                  >
                    <option value="yes_dedicated">{t("providers.apply.recurringYesDedicated")}</option>
                    <option value="yes_rotate">{t("providers.apply.recurringYesRotate")}</option>
                    <option value="no">{t("providers.apply.recurringNo")}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-caption text-[#a6a6a6] font-semibold uppercase">{t("providers.apply.labelChatPreference")}</label>
                  <select
                    value={formData.chatPreference}
                    onChange={(e) => setFormData({ ...formData, chatPreference: e.target.value })}
                    className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-sm focus:border-accent outline-none"
                  >
                    <option value="opt_in">{t("providers.apply.chatOptIn")}</option>
                    <option value="opt_out">{t("providers.apply.chatOptOut")}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-caption text-[#a6a6a6] font-semibold uppercase">{t("providers.apply.labelMotivation")}</label>
                <textarea
                  rows={3}
                  value={formData.motivation}
                  onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                  placeholder={t("providers.apply.motivationPlaceholder")}
                  className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-sm focus:border-accent outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3.5 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                {loading ? t("providers.apply.btnSubmitting") : t("providers.apply.btnSubmit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
