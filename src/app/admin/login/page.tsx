"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Mail, KeyRound, ArrowRight, ArrowLeft } from "lucide-react";
import { loginAdmin, loginAdmin2FA, checkAdminExists } from "@/app/actions/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 2FA Verification Flow State
  const [requires2FA, setRequires2FA] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [totpToken, setTotpToken] = useState("");

  useEffect(() => {
    const checkExists = async () => {
      const res = await checkAdminExists();
      if (res.success && !res.exists) {
        router.push("/admin/signup");
      } else {
        setChecking(false);
      }
    };
    checkExists();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setError("");
    setLoading(true);
    const res = await loginAdmin(email);
    setLoading(false);

    if (res) {
      if (res.success) {
        if (res.requires2FA && res.userId) {
          setRequires2FA(true);
          setUserId(res.userId);
          setMaskedEmail(res.emailMasked || "");
        } else {
          router.push("/admin");
          router.refresh();
        }
      } else {
        setError(res.error || "Invalid administrative credentials");
      }
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpToken.length !== 6) return;

    setError("");
    setLoading(true);
    const res = await loginAdmin2FA(userId, totpToken);
    setLoading(false);

    if (res) {
      if (res.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(res.error || "Invalid verification code");
      }
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#f2f2f2] font-body flex justify-center items-center">
        <p className="text-body-md font-mono text-accent animate-pulse">CHECKING PLATFORM STATUS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] flex justify-center items-center px-6">
      <div className="max-w-md w-full border border-[#262626] bg-[#141414] p-8 rounded-lg space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 bg-accent/10 text-accent rounded-full flex items-center justify-center border border-accent/25">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-display-sm font-display font-medium text-[#f2f2f2] tracking-tight">ELITE CONTROL</h2>
          <p className="text-body-xs text-[#a6a6a6] uppercase tracking-widest">
            {requires2FA ? "Verify Email OTP Code" : "Administrative Access Only"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md text-body-sm">
            {error}
          </div>
        )}

        {!requires2FA ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-caption text-[#a6a6a6] font-semibold uppercase flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Administrative Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@elite-cleaning.ch"
                className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-md focus:border-accent outline-none w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "SEND OTP CODE"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-caption text-[#a6a6a6] font-semibold uppercase flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> 6-Digit Email OTP Code
              </label>
              <p className="text-[11px] text-[#a6a6a6] leading-relaxed">
                A verification OTP code has been sent to your email <code className="text-accent">{maskedEmail}</code>.
              </p>
              <input
                type="text"
                maxLength={6}
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 123456"
                className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-md focus:border-accent outline-none tracking-[0.2em] font-mono text-center"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setTotpToken("");
                  setError("");
                }}
                className="flex-1 border border-[#262626] hover:bg-[#1a1a1a] text-[#a6a6a6] font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={loading || totpToken.length !== 6}
                className="flex-1 bg-accent hover:bg-accent-hover disabled:bg-accent/40 text-ink-inverse font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Verify Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
