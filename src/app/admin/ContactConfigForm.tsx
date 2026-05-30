"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { updateSystemSetting } from "@/app/actions/admin";

interface ContactConfigFormProps {
  initialWhatsappNumber: string;
  initialWhatsappLabel: string;
  initialContactPhone: string;
  initialContactEmail: string;
  initialAutoCheckout: boolean;
}

export function ContactConfigForm({
  initialWhatsappNumber,
  initialWhatsappLabel,
  initialContactPhone,
  initialContactEmail,
  initialAutoCheckout
}: ContactConfigFormProps) {
  const { t } = useLanguage();
  
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsappNumber);
  const [whatsappLabel, setWhatsappLabel] = useState(initialWhatsappLabel);
  const [contactPhone, setContactPhone] = useState(initialContactPhone);
  const [contactEmail, setContactEmail] = useState(initialContactEmail);
  const [autoCheckout, setAutoCheckout] = useState(initialAutoCheckout);
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    // Validate digits only for the WhatsApp number
    const cleanNumber = whatsappNumber.replace(/\D/g, "");
    if (!cleanNumber) {
      setError(t("admin.settings.whatsappError"));
      setSaving(false);
      return;
    }

    const resNum = await updateSystemSetting("whatsapp_number", cleanNumber);
    const resLab = await updateSystemSetting("whatsapp_label", whatsappLabel || cleanNumber);
    const resAuto = await updateSystemSetting("auto_checkout", autoCheckout ? "true" : "false");
    const resPhone = await updateSystemSetting("contact_phone", contactPhone);
    const resEmail = await updateSystemSetting("contact_email", contactEmail);

    setSaving(false);
    if (resNum.success && resLab.success && resAuto.success && resPhone.success && resEmail.success) {
      setSuccess(t("admin.settings.whatsappSuccess"));
      setWhatsappNumber(cleanNumber);
    } else {
      setError(
        resNum.error || 
        resLab.error || 
        resAuto.error || 
        resPhone.error || 
        resEmail.error || 
        "Failed to update settings."
      );
    }
  };

  return (
    <form onSubmit={handleSave} className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
      <h3 className="text-body-sm font-semibold uppercase tracking-wider text-[#a6a6a6]">
        {t("admin.settings.whatsappConfig")}
      </h3>
      
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded text-body-xs">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-body-xs">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-[#a6a6a6] font-semibold uppercase block mb-1">
            {t("admin.settings.whatsappNumberLabel")}
          </label>
          <input
            type="text"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="e.g. 41791234567"
            className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-sm focus:border-accent outline-none font-semibold font-mono"
          />
        </div>

        <div>
          <label className="text-[10px] text-[#a6a6a6] font-semibold uppercase block mb-1">
            {t("admin.settings.displayLabel")}
          </label>
          <input
            type="text"
            value={whatsappLabel}
            onChange={(e) => setWhatsappLabel(e.target.value)}
            placeholder="e.g. +41 79 123 45 67"
            className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-sm focus:border-accent outline-none font-semibold"
          />
        </div>

        <div>
          <label className="text-[10px] text-[#a6a6a6] font-semibold uppercase block mb-1">
            {t("admin.settings.contactPhoneLabel")}
          </label>
          <input
            type="text"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="e.g. +41 (0) 44 123 4567"
            className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-sm focus:border-accent outline-none font-semibold"
          />
        </div>

        <div>
          <label className="text-[10px] text-[#a6a6a6] font-semibold uppercase block mb-1">
            {t("admin.settings.contactEmailLabel")}
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="e.g. ops@elite-cleaning.ch"
            className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-sm focus:border-accent outline-none font-semibold"
          />
        </div>

        <div className="pt-2 border-t border-[#262626] space-y-2">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="autoCheckoutCheckboxDashboard"
              checked={autoCheckout}
              onChange={(e) => setAutoCheckout(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-[#262626] bg-[#0d0d0d] text-accent focus:ring-accent cursor-pointer accent-accent"
            />
            <label htmlFor="autoCheckoutCheckboxDashboard" className="text-body-xs font-semibold text-[#f2f2f2] cursor-pointer select-none">
              {t("admin.settings.autoCheckoutLabel")}
            </label>
          </div>
          <p className="text-[11px] text-[#a6a6a6] leading-relaxed pl-7">
            {t("admin.settings.autoCheckoutDesc")}
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-accent hover:bg-accent-hover disabled:bg-accent/40 text-ink-inverse text-caption font-bold py-2.5 rounded transition-colors cursor-pointer text-center uppercase tracking-wider"
      >
        {saving ? "SAVING..." : t("admin.settings.saveSettings")}
      </button>
    </form>
  );
}
