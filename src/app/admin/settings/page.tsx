"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldCheck, X, ShieldAlert, ArrowRight } from "lucide-react";
import {
  getLoggedInAdmin,
  getRegistration2FASecret,
  sendRegistrationEmailOtp,
  enableAdmin2FA,
  disableAdmin2FA
} from "@/app/actions/admin";

export default function AdminSettingsPage() {
  const router = useRouter();
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

  const loadAdmin = async () => {
    setLoading(true);
    const user = await getLoggedInAdmin();
    if (user) {
      setAdmin(user);
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
        <span className="text-caption text-accent uppercase tracking-widest block mb-2">Backoffice Settings</span>
        <h1 className="text-display-md font-display font-medium text-[#f2f2f2] tracking-tight">
          Security Configuration
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Profile Card */}
        <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
          <h3 className="text-body-sm font-semibold uppercase tracking-wider text-[#a6a6a6]">Admin Profile</h3>
          <div className="space-y-1">
            <span className="text-body-md font-bold text-[#f2f2f2] block">{admin.name}</span>
            <span className="text-body-xs text-[#a6a6a6] font-mono block">{admin.email}</span>
            <span className="text-[10px] bg-accent/10 border border-accent/20 text-accent font-mono uppercase font-bold px-2 py-0.5 rounded inline-block mt-2">
              {admin.role}
            </span>
          </div>
        </div>

        {/* 2FA Settings Card */}
        <div className="md:col-span-2 border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-6">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-accent" />
            <h3 className="text-body-md font-semibold text-[#f2f2f2]">Multi-Factor Authentication (MFA)</h3>
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
                Your administrative backoffice account is guarded with **{admin.twoFactorMethod === "email" ? "Email One-Time Password (OTP)" : "Authenticator App (TOTP)"}**. A verification code will be requested on each log in session.
              </p>
              <button
                onClick={handleDisable2FA}
                disabled={loading2FA}
                className="bg-red-600/10 hover:bg-red-650/15 border border-red-500/30 text-red-400 text-caption font-bold px-4 py-2.5 rounded transition-colors cursor-pointer"
              >
                {loading2FA ? "PROCESSING..." : "DISABLE 2-FACTOR AUTH"}
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
                    <label className="text-[10px] text-[#a6a6a6] font-semibold uppercase">MFA Dispatch Method</label>
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
                        Authenticator App (TOTP)
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
                        Email One-Time Password (OTP)
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleStart2FA}
                    disabled={loading2FA}
                    className="bg-accent hover:bg-accent-hover text-ink-inverse text-caption font-bold px-4 py-2.5 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{loading2FA ? "GENERATING SECURE KEY..." : "ENABLE MULTI-FACTOR AUTH"}</span>
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
      </div>
    </div>
  );
}
