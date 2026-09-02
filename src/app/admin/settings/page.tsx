"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldCheck, X, ShieldAlert, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import {
  getLoggedInAdmin,
  getRegistration2FASecret,
  sendRegistrationEmailOtp,
  enableAdmin2FA,
  disableAdmin2FA,
  getSystemSetting,
  updateSystemSetting,
  updateAdminProfile,
  changeAdminPassword
} from "@/app/actions/admin";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // 2FA state variables
  const [setup2FAOpen, setSetup2FAOpen] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState("totp"); // totp, email
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [totpError, setTotpError] = useState("");
  const [loading2FA, setLoading2FA] = useState(false);

  // WhatsApp & Contact state variables
  const [whatsappNumber, setWhatsappNumber] = useState("41791234567");
  const [whatsappLabel, setWhatsappLabel] = useState("+41 79 123 45 67");
  const [autoCheckout, setAutoCheckout] = useState(true);
  const [contactPhone, setContactPhone] = useState("+41 (0) 44 123 4567");
  const [contactEmail, setContactEmail] = useState("ops@elite-cleaning.ch");
  const [contactAddress, setContactAddress] = useState("Bahnhofstrasse 12, 8001 Zürich, Switzerland");
  const [showPhone, setShowPhone] = useState(true);
  const [showOffice, setShowOffice] = useState(true);
  const [minLeadDays, setMinLeadDays] = useState(5);
  const [businessDaysOnly, setBusinessDaysOnly] = useState(true);
  const [allowWeekends, setAllowWeekends] = useState(false);
  const [allowAfterHours, setAllowAfterHours] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [whatsappSuccess, setWhatsappSuccess] = useState("");
  const [whatsappError, setWhatsappError] = useState("");

  // Profile Editor state variables
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password Editor state variables
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const loadAdmin = async () => {
    setLoading(true);
    const user = await getLoggedInAdmin();
    if (user) {
      setAdmin(user);
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
      
      // Load WhatsApp & Lead Time settings
      const resNum = await getSystemSetting("whatsapp_number");
      const resLab = await getSystemSetting("whatsapp_label");
      const resAuto = await getSystemSetting("auto_checkout");
      const resPhone = await getSystemSetting("contact_phone");
      const resEmail = await getSystemSetting("contact_email");
      const resAddress = await getSystemSetting("contact_address");
      const resShowPhone = await getSystemSetting("show_phone_number");
      const resShowOffice = await getSystemSetting("show_office_address");
      const resLead = await getSystemSetting("min_lead_time_days");
      const resBiz = await getSystemSetting("lead_time_business_days_only");
      const resWeekends = await getSystemSetting("allow_weekend_bookings");
      const resAfterHours = await getSystemSetting("allow_after_hours_bookings");
      if (resNum.success && resNum.value) {
        setWhatsappNumber(resNum.value);
      }
      if (resLab.success && resLab.value) {
        setWhatsappLabel(resLab.value);
      }
      if (resAuto.success) {
        setAutoCheckout(resAuto.value === null ? true : resAuto.value === "true");
      }
      if (resPhone.success && resPhone.value) {
        setContactPhone(resPhone.value);
      }
      if (resEmail.success && resEmail.value) {
        setContactEmail(resEmail.value);
      }
      if (resAddress.success && resAddress.value) {
        setContactAddress(resAddress.value);
      }
      if (resShowPhone.success) {
        setShowPhone(resShowPhone.value !== "false");
      }
      if (resShowOffice.success) {
        setShowOffice(resShowOffice.value !== "false");
      }
      if (resLead.success && resLead.value !== null) {
        const parsed = parseInt(resLead.value, 10);
        if (!isNaN(parsed)) setMinLeadDays(parsed);
      }
      if (resBiz.success && resBiz.value !== null) {
        setBusinessDaysOnly(resBiz.value !== "false");
      }
      if (resWeekends.success && resWeekends.value !== null) {
        setAllowWeekends(resWeekends.value === "true");
      }
      if (resAfterHours.success && resAfterHours.value !== null) {
        setAllowAfterHours(resAfterHours.value === "true");
      }
    } else {
      setError("Failed to load administrative session. Please log in.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  const handleStart2FA = async () => {
    if (!admin?.email) return;
    setTotpError("");
    setTotpToken("");
    setLoading2FA(true);
    
    if (twoFactorMethod === "totp") {
      const res = await getRegistration2FASecret(admin.email);
      setLoading2FA(false);
      if (res.success && res.secret && res.qrDataUrl) {
        setTwoFactorSecret(res.secret);
        setQrCodeUrl(res.qrDataUrl);
        setSetup2FAOpen(true);
      } else {
        setTotpError(res.error || "Failed to initiate TOTP setup");
      }
    } else {
      const res = await sendRegistrationEmailOtp(admin.email);
      setLoading2FA(false);
      if (res.success && res.otp) {
        setTwoFactorSecret(res.otp);
        setSetup2FAOpen(true);
      } else {
        setTotpError(res.error || "Failed to send email OTP code. Please check your SMTP settings.");
      }
    }
  };

  const handleVerifyAndEnable2FA = async () => {
    if (!admin?.email || totpToken.length !== 6) return;
    setTotpError("");
    setLoading2FA(true);
    const res = await enableAdmin2FA(admin.email, twoFactorMethod, twoFactorSecret, totpToken);
    setLoading2FA(false);

    if (res.success) {
      setSetup2FAOpen(false);
      setTwoFactorSecret("");
      setQrCodeUrl("");
      setTotpToken("");
      loadAdmin();
    } else {
      setTotpError(res.error || "Failed to verify passcode. Please try again.");
    }
  };

  const handleDisable2FA = async () => {
    if (!admin?.email || !confirm("Are you sure you want to disable Two-Factor Authentication? Your administrative account security will be significantly reduced.")) return;
    setTotpError("");
    setLoading2FA(true);
    const res = await disableAdmin2FA(admin.email);
    setLoading2FA(false);

    if (res.success) {
      loadAdmin();
    } else {
      alert("Failed to disable 2FA: " + res.error);
    }
  };

  const handleSaveWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWhatsapp(true);
    setWhatsappSuccess("");
    setWhatsappError("");
    
    // Validate digits only for the number
    const cleanNumber = whatsappNumber.replace(/\D/g, "");
    if (!cleanNumber) {
      setWhatsappError(t("admin.settings.whatsappError"));
      setSavingWhatsapp(false);
      return;
    }

    const resNum = await updateSystemSetting("whatsapp_number", cleanNumber);
    const resLab = await updateSystemSetting("whatsapp_label", whatsappLabel || cleanNumber);
    const resAuto = await updateSystemSetting("auto_checkout", autoCheckout ? "true" : "false");
    const resPhone = await updateSystemSetting("contact_phone", contactPhone);
    const resEmail = await updateSystemSetting("contact_email", contactEmail);
    const resAddress = await updateSystemSetting("contact_address", contactAddress);
    const resShowPhone = await updateSystemSetting("show_phone_number", showPhone ? "true" : "false");
    const resShowOffice = await updateSystemSetting("show_office_address", showOffice ? "true" : "false");
    const resLead = await updateSystemSetting("min_lead_time_days", String(minLeadDays));
    const resBiz = await updateSystemSetting("lead_time_business_days_only", businessDaysOnly ? "true" : "false");
    const resWeekends = await updateSystemSetting("allow_weekend_bookings", allowWeekends ? "true" : "false");
    const resAfterHours = await updateSystemSetting("allow_after_hours_bookings", allowAfterHours ? "true" : "false");
    
    setSavingWhatsapp(false);
    if (resNum.success && resLab.success && resAuto.success && resPhone.success && resEmail.success && resAddress.success && resShowPhone.success && resShowOffice.success && resLead.success && resBiz.success && resWeekends.success && resAfterHours.success) {
      setWhatsappSuccess(t("admin.settings.whatsappSuccess"));
      setWhatsappNumber(cleanNumber);
    } else {
      setWhatsappError(
        resNum.error || 
        resLab.error || 
        resAuto.error || 
        resPhone.error || 
        resEmail.error || 
        resAddress.error || 
        resShowPhone.error || 
        resShowOffice.error || 
        resLead.error || 
        resBiz.error || 
        resWeekends.error || 
        resAfterHours.error || 
        "Failed to update settings."
      );
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileSuccess("");
    setProfileError("");

    if (!profileName.trim() || !profileEmail.trim()) {
      setProfileError("Name and email are required.");
      setUpdatingProfile(false);
      return;
    }

    const res = await updateAdminProfile(profileName, profileEmail);
    setUpdatingProfile(false);
    if (res.success) {
      setProfileSuccess("Profile details updated successfully.");
      loadAdmin();
    } else {
      setProfileError(res.error || "Failed to update profile.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordSuccess("");
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      setChangingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      setChangingPassword(false);
      return;
    }

    const res = await changeAdminPassword(currentPassword, newPassword);
    setChangingPassword(false);
    if (res.success) {
      setPasswordSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordError(res.error || "Failed to change password.");
    }
  };

  if (loading) {
    return (
      <div className="p-8 md:p-12 text-center text-body-md font-mono text-accent animate-pulse">
        LOADING SETTINGS GATEWAY...
      </div>
    );
  }

  if (error || !admin) {
    return (
      <div className="p-8 md:p-12 max-w-xl mx-auto text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-display-xs font-display text-red-400">{error || "Access Denied"}</h2>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 space-y-8 max-w-7xl w-full mx-auto">
      <header>
        <span className="text-caption text-accent uppercase tracking-widest block mb-2">
          {t("admin.settings.backofficeSettings")}
        </span>
        <h1 className="text-display-md font-display font-medium text-[#f2f2f2] tracking-tight">
          {t("admin.settings.securityConfig")}
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Column: Profile Card & WhatsApp Settings Card */}
        <div className="space-y-8">
          {/* Profile Card */}
          <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
            <h3 className="text-body-sm font-semibold uppercase tracking-wider text-[#a6a6a6]">
              {t("admin.settings.adminProfile")}
            </h3>
            <div className="space-y-1">
              <span className="text-body-md font-bold text-[#f2f2f2] block">{admin.name}</span>
              <span className="text-body-xs text-[#a6a6a6] font-mono block">{admin.email}</span>
              <span className="text-[10px] bg-accent/10 border border-accent/20 text-accent font-mono uppercase font-bold px-2 py-0.5 rounded inline-block mt-2">
                {admin.role}
              </span>
            </div>
          </div>

          {/* WhatsApp & Contact Settings Card */}
          <form onSubmit={handleSaveWhatsapp} className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
            <h3 className="text-body-sm font-semibold uppercase tracking-wider text-[#a6a6a6]">
              {t("admin.settings.whatsappConfig")}
            </h3>
            
            {whatsappSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded text-body-xs">
                {whatsappSuccess}
              </div>
            )}
            {whatsappError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-body-xs">
                {whatsappError}
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
                  className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-sm focus:border-accent outline-none font-semibold"
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
                  placeholder="e.g. my@email.com"
                  className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-sm focus:border-accent outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#a6a6a6] font-semibold uppercase block mb-1">
                  {t("admin.settings.contactAddressLabel")}
                </label>
                <textarea
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                  placeholder="e.g. Bahnhofstrasse 12, 8001 Zürich"
                  rows={3}
                  className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-sm focus:border-accent outline-none font-semibold resize-none"
                />
              </div>

              <div className="pt-2 border-t border-[#262626] space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="autoCheckoutCheckbox"
                      checked={autoCheckout}
                      onChange={(e) => setAutoCheckout(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-[#262626] bg-[#0d0d0d] text-accent focus:ring-accent cursor-pointer accent-accent"
                    />
                    <label htmlFor="autoCheckoutCheckbox" className="text-body-xs font-semibold text-[#f2f2f2] cursor-pointer select-none">
                      {t("admin.settings.autoCheckoutLabel")}
                    </label>
                  </div>
                  <p className="text-[11px] text-[#a6a6a6] leading-relaxed pl-7">
                    {t("admin.settings.autoCheckoutDesc")}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#262626]/40">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="showPhoneCheckbox"
                      checked={showPhone}
                      onChange={(e) => setShowPhone(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-[#262626] bg-[#0d0d0d] text-accent focus:ring-accent cursor-pointer accent-accent"
                    />
                    <label htmlFor="showPhoneCheckbox" className="text-body-xs font-semibold text-[#f2f2f2] cursor-pointer select-none">
                      {t("admin.settings.showPhoneLabel")}
                    </label>
                  </div>
                  <p className="text-[11px] text-[#a6a6a6] leading-relaxed pl-7">
                    {t("admin.settings.showPhoneDesc")}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#262626]/40">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="showOfficeCheckbox"
                      checked={showOffice}
                      onChange={(e) => setShowOffice(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-[#262626] bg-[#0d0d0d] text-accent focus:ring-accent cursor-pointer accent-accent"
                    />
                    <label htmlFor="showOfficeCheckbox" className="text-body-xs font-semibold text-[#f2f2f2] cursor-pointer select-none">
                      {t("admin.settings.showOfficeLabel")}
                    </label>
                  </div>
                  <p className="text-[11px] text-[#a6a6a6] leading-relaxed pl-7">
                    {t("admin.settings.showOfficeDesc")}
                  </p>
                </div>

                {/* Booking Lead Time & Notice Window */}
                <div className="pt-3 border-t border-[#262626] space-y-3">
                  <span className="text-[10px] text-accent uppercase font-bold tracking-widest block font-mono">
                    Booking Lead Time & Notice Window
                  </span>
                  
                  <div>
                    <label className="text-[10px] text-[#a6a6a6] font-semibold uppercase block mb-1">
                      Minimum Advance Notice (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={minLeadDays}
                      onChange={(e) => setMinLeadDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-sm focus:border-accent outline-none font-semibold"
                    />
                    <p className="text-[11px] text-[#a6a6a6] leading-relaxed pt-1">
                      Prevents last-minute bookings. The next {minLeadDays} {businessDaysOnly ? "business" : ""} days will be blocked on the client booking calendar for tailored matching.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#262626]/40">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="businessDaysOnlyCheckbox"
                        checked={businessDaysOnly}
                        onChange={(e) => setBusinessDaysOnly(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-[#262626] bg-[#0d0d0d] text-accent focus:ring-accent cursor-pointer accent-accent"
                      />
                      <label htmlFor="businessDaysOnlyCheckbox" className="text-body-xs font-semibold text-[#f2f2f2] cursor-pointer select-none">
                        Count Business Days Only (Skip Weekends)
                      </label>
                    </div>
                    <p className="text-[11px] text-[#a6a6a6] leading-relaxed pl-7">
                      When enabled, Saturday and Sunday are excluded from the lead time countdown (e.g. 5 business days notice).
                    </p>
                  </div>
                </div>

                {/* Supply Chain & Dispatch Controls */}
                <div className="pt-3 border-t border-[#262626] space-y-3">
                  <span className="text-[10px] text-accent uppercase font-bold tracking-widest block font-mono">
                    Supply Chain & Dispatch Controls
                  </span>

                  {/* Weekend Bookings Toggle */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="allowWeekendCheckbox"
                        checked={allowWeekends}
                        onChange={(e) => setAllowWeekends(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-[#262626] bg-[#0d0d0d] text-accent focus:ring-accent cursor-pointer accent-accent"
                      />
                      <label htmlFor="allowWeekendCheckbox" className="text-body-xs font-semibold text-[#f2f2f2] cursor-pointer select-none">
                        Allow Weekend Bookings (Saturdays & Sundays)
                      </label>
                    </div>
                    <p className="text-[11px] text-[#a6a6a6] leading-relaxed pl-7">
                      When disabled, Saturday and Sunday dates are greyed out on client calendars and blocked on dispatch to prevent subcontractor capacity bottlenecks.
                    </p>
                  </div>

                  {/* After-Hours Bookings Toggle */}
                  <div className="space-y-1.5 pt-2 border-t border-[#262626]/40">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="allowAfterHoursCheckbox"
                        checked={allowAfterHours}
                        onChange={(e) => setAllowAfterHours(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-[#262626] bg-[#0d0d0d] text-accent focus:ring-accent cursor-pointer accent-accent"
                      />
                      <label htmlFor="allowAfterHoursCheckbox" className="text-body-xs font-semibold text-[#f2f2f2] cursor-pointer select-none">
                        Allow After-Hours Bookings (Evening Slots)
                      </label>
                    </div>
                    <p className="text-[11px] text-[#a6a6a6] leading-relaxed pl-7">
                      When disabled, evening/after-hours dispatches are paused across all booking funnels, restricting dispatches to standard business hours (08:00 - 17:00).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingWhatsapp}
              className="w-full bg-accent hover:bg-accent-hover disabled:bg-accent/40 text-ink-inverse text-caption font-bold py-2.5 rounded transition-colors cursor-pointer text-center uppercase tracking-wider"
            >
              {savingWhatsapp ? "SAVING..." : t("admin.settings.saveSettings")}
            </button>
          </form>
        </div>

        {/* Right Column: 2FA Settings & Profile Editor & Password Editor */}
        <div className="md:col-span-2 space-y-8">
          {/* 2FA Settings Card */}
          <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-6">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-accent" />
            <h3 className="text-body-md font-semibold text-[#f2f2f2]">{t("admin.settings.mfaTitle")}</h3>
          </div>

          {totpError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded text-body-xs">
              {totpError}
            </div>
          )}

          {admin.twoFactorEnabled ? (
            <div className="space-y-4 bg-[#0d0d0d] p-5 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 text-green-400 text-body-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> Two-Factor Authentication Active
              </div>
              <p className="text-body-xs text-[#a6a6a6] leading-relaxed">
                Your administrative backoffice account is guarded with **{admin.twoFactorMethod === "email" ? t("admin.settings.emailOtp") : t("admin.settings.totpApp")}**. A verification code will be requested on each log in session.
              </p>
              <button
                onClick={handleDisable2FA}
                disabled={loading2FA}
                className="bg-red-600/10 hover:bg-red-650/15 border border-red-500/30 text-red-400 text-caption font-bold px-4 py-2.5 rounded transition-colors cursor-pointer"
              >
                {loading2FA ? "PROCESSING..." : t("admin.settings.disableMfa")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {!setup2FAOpen ? (
                <div className="space-y-4 bg-[#0d0d0d] p-5 rounded-lg border border-[#262626]">
                  <div className="text-caption text-yellow-500 font-semibold uppercase tracking-wider">2FA Gated Security Disabled</div>
                  <p className="text-body-xs text-[#a6a6a6] leading-relaxed">
                    Secure your administrator controls from credential leakage by enabling Multi-Factor Authentication.
                  </p>

                  <div className="flex flex-col gap-3 pt-2">
                    <label className="text-[10px] text-[#a6a6a6] font-semibold uppercase">{t("admin.settings.mfaMethod")}</label>
                    <div className="flex gap-6 pb-2">
                      <label className="flex items-center gap-2 text-body-xs font-semibold text-[#f2f2f2] cursor-pointer select-none">
                        <input
                          type="radio"
                          name="settingsMfaMethod"
                          value="totp"
                          checked={twoFactorMethod === "totp"}
                          onChange={() => setTwoFactorMethod("totp")}
                          className="accent-accent"
                        />
                        {t("admin.settings.totpApp")}
                      </label>
                      <label className="flex items-center gap-2 text-body-xs font-semibold text-[#f2f2f2] cursor-pointer select-none">
                        <input
                          type="radio"
                          name="settingsMfaMethod"
                          value="email"
                          checked={twoFactorMethod === "email"}
                          onChange={() => setTwoFactorMethod("email")}
                          className="accent-accent"
                        />
                        {t("admin.settings.emailOtp")}
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleStart2FA}
                    disabled={loading2FA}
                    className="bg-accent hover:bg-accent-hover text-ink-inverse text-caption font-bold px-4 py-2.5 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{loading2FA ? "GENERATING SECURE KEY..." : t("admin.settings.enableMfa")}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-5 bg-[#0d0d0d] p-5 rounded-lg border border-[#262626] animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-[#1f1f1f]">
                    <span className="text-caption text-accent font-semibold uppercase font-mono tracking-wider">
                      {twoFactorMethod === "totp" ? "Authenticator App Setup" : "Email Verification Setup"}
                    </span>
                    <button onClick={() => setSetup2FAOpen(false)} className="text-[#a6a6a6] hover:text-[#f2f2f2] cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {twoFactorMethod === "totp" ? (
                    <div className="space-y-4">
                      <p className="text-body-xs text-[#a6a6a6] leading-relaxed">
                        Scan the QR code below using your mobile authenticator app (Google Authenticator, Authy, or 1Password), or input the secret key manually.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#141414] p-4 rounded border border-[#262626]">
                        {qrCodeUrl && (
                          <img src={qrCodeUrl} alt="2FA QR Code" className="w-32 h-32 border border-[#262626] p-1.5 bg-white rounded" />
                        )}
                        <div className="space-y-2 text-center sm:text-left flex-1">
                          <span className="text-caption text-[#a6a6a6] uppercase font-bold block">Secret Key</span>
                          <code className="text-body-xs text-accent font-mono block select-all p-1.5 bg-[#080808] border border-[#1f1f1f] rounded break-all">
                            {twoFactorSecret}
                          </code>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-body-xs text-[#a6a6a6] leading-relaxed">
                        We sent a 6-digit verification code to <code className="text-accent">{admin.email}</code>. Please input the passcode to activate Email OTP.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <label className="text-caption text-[#a6a6a6] font-semibold uppercase">
                      {twoFactorMethod === "totp" ? "Verify Authenticator Code" : "Verify Email OTP Code"}
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        maxLength={6}
                        value={totpToken}
                        onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ""))}
                        placeholder="e.g. 123456"
                        className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded-md text-body-sm focus:border-accent outline-none w-32 tracking-[0.2em] font-mono text-center"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyAndEnable2FA}
                        disabled={totpToken.length !== 6 || loading2FA}
                        className="bg-accent hover:bg-accent-hover disabled:bg-accent/40 text-ink-inverse text-caption font-bold px-5 py-2.5 rounded transition-colors cursor-pointer"
                      >
                        {loading2FA ? "VERIFYING..." : "CONFIRM & ACTIVATE"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>

          {/* Profile Details Form */}
          <form onSubmit={handleUpdateProfile} className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-6">
            <h3 className="text-body-md font-semibold text-[#f2f2f2]">Edit Profile Details</h3>
            
            {profileSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded text-body-xs">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-body-xs">
                {profileError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#a6a6a6] font-semibold uppercase block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-sm focus:border-accent outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#a6a6a6] font-semibold uppercase block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="e.g. my@email.com"
                  className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-sm focus:border-accent outline-none font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="bg-accent hover:bg-accent-hover disabled:bg-accent/40 text-ink-inverse text-caption font-bold px-4 py-2.5 rounded transition-colors cursor-pointer uppercase tracking-wider"
            >
              {updatingProfile ? "SAVING..." : "UPDATE PROFILE"}
            </button>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-6">
            <h3 className="text-body-md font-semibold text-[#f2f2f2]">Change Password</h3>

            {passwordSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded text-body-xs">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-body-xs">
                {passwordError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#a6a6a6] font-semibold uppercase block mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-sm focus:border-accent outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#a6a6a6] font-semibold uppercase block mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-sm focus:border-accent outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#a6a6a6] font-semibold uppercase block mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-sm focus:border-accent outline-none font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="bg-accent hover:bg-accent-hover disabled:bg-accent/40 text-ink-inverse text-caption font-bold px-4 py-2.5 rounded transition-colors cursor-pointer uppercase tracking-wider"
            >
              {changingPassword ? "CHANGING..." : "CHANGE PASSWORD"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
