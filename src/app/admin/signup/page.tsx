"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, User, Mail, Lock, KeyRound, Check, ArrowRight, Eye, EyeOff } from "lucide-react";
import { checkAdminExists, registerAdmin, getRegistration2FASecret, verifyRegistrationToken, sendRegistrationEmailOtp } from "@/app/actions/admin";

export default function AdminSignupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 2FA details
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [totpVerified, setTotpVerified] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(false);

  // Local OTP state
  const [otpStatus, setOtpStatus] = useState("");
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    const checkExists = async () => {
      const res = await checkAdminExists();
      if (res.success) {
        setAdminExists(!!res.exists);
        if (res.exists) {
          router.push("/admin/login");
        }
      }
      setChecking(false);
    };
    checkExists();
  }, [router]);

  const handleSendEmailOtp = async (targetEmail: string) => {
    const emailToUse = targetEmail || email;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailToUse || !emailRegex.test(emailToUse)) {
      setOtpError("Please enter a valid email address first.");
      return;
    }
    setOtpError("");
    setOtpStatus("Sending security verification OTP code...");
    setLoading(true);
    const res = await sendRegistrationEmailOtp(emailToUse);
    setLoading(false);
    if (res.success && res.otp) {
      setTwoFactorSecret(res.otp);
      setOtpStatus(`Verification code successfully sent to ${emailToUse}. Please check your inbox.`);
      setOtpError("");
    } else {
      setOtpError(res.error || "Failed to send verification code. Please check your SMTP settings.");
      setOtpStatus("");
    }
  };

  // Automatically dispatch Email OTP when a valid email address is entered
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setTwoFactorSecret("");
      setTotpToken("");
      setTotpVerified(false);
      setOtpStatus("");
      setOtpError("");
      return;
    }

    const timer = setTimeout(() => {
      handleSendEmailOtp(email);
    }, 1200);

    return () => clearTimeout(timer);
  }, [email]);

  const handleVerifyTOTP = async () => {
    if (totpToken.length !== 6) return;
    setVerifyingToken(true);
    setError("");
    setOtpError("");
    const res = await verifyRegistrationToken(totpToken, twoFactorSecret, "email");
    setVerifyingToken(false);
    if (res.success && res.isValid) {
      setTotpVerified(true);
      setError("");
      setOtpError("");
    } else {
      setOtpError(res.error || "Invalid verification code. Please verify the numbers.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!totpVerified) {
      setError("Please verify the OTP code sent to your email before signing up.");
      return;
    }

    setLoading(true);
    const res = await registerAdmin({
      name,
      email,
      password,
      twoFactorSecret,
      twoFactorToken: totpToken
    });

    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 3500);
    } else {
      setError(res.error || "Registration failed.");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#f2f2f2] font-body flex justify-center items-center">
        <p className="text-body-md font-mono text-accent animate-pulse">CHECKING PLATFORM STATUS...</p>
      </div>
    );
  }

  if (adminExists) {
    return null; // Will redirect shortly via useEffect
  }

  return (
    <div className="min-h-screen bg-[#080808] flex justify-center items-center px-6 py-12">
      <div className="max-w-xl w-full border border-[#262626] bg-[#141414] p-8 rounded-lg space-y-6 shadow-xl">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 bg-accent/10 text-accent rounded-full flex items-center justify-center border border-accent/25">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-display-sm font-display font-medium text-[#f2f2f2] tracking-tight">INITIAL ROOT SETUP</h2>
          <p className="text-body-xs text-[#a6a6a6] uppercase tracking-widest">Register Primary Super Administrator</p>
        </div>

        {success ? (
          <div className="bg-[#0f170f] border border-green-500/30 text-green-400 p-8 rounded-lg text-center space-y-4 shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent" />
            <div className="h-14 w-14 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)] animate-pulse">
              <Check className="w-7 h-7" />
            </div>
            <h3 className="text-body-md font-display font-medium uppercase tracking-widest text-[#f2f2f2] mt-4">
              Credentials Secured
            </h3>
            <p className="text-body-xs text-[#a6a6a6] leading-relaxed max-w-[34ch] mx-auto">
              Cryptographic keys and administrative privileges configured. Initializing root gateway session...
            </p>
            <div className="pt-2">
              <div className="h-[3px] w-full bg-[#1b1b1b] rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full animate-loading-bar" style={{ width: "100%", transition: "width 3.5s linear" }} />
              </div>
            </div>
          </div>
        ) : (

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md text-body-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-caption text-[#a6a6a6] font-semibold uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jean Dupont"
                  className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-sm focus:border-accent outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-caption text-[#a6a6a6] font-semibold uppercase flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    const newEmail = e.target.value;
                    setEmail(newEmail);
                    setTwoFactorSecret("");
                    setTotpToken("");
                    setTotpVerified(false);
                    setOtpStatus("");
                  }}
                  placeholder="e.g. my@email.com"
                  className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-sm focus:border-accent outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <label className="text-caption text-[#a6a6a6] font-semibold uppercase flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Choose Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 pr-10 rounded-md text-body-sm focus:border-accent outline-none w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#a6a6a6] hover:text-[#f2f2f2] transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>




            {/* Email OTP Verification Section */}
            <div className="border border-[#262626] bg-[#0d0d0d] p-5 rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-body-sm font-semibold text-[#f2f2f2]">
                <KeyRound className="w-4 h-4 text-accent" /> Mandatory Email Verification (OTP)
              </div>
              
              <div className="space-y-3 p-4 rounded bg-[#141414] border border-[#262626]">
                <p className="text-body-xs text-[#a6a6a6] leading-relaxed">
                  A 6-digit one-time password (OTP) will be sent automatically to <code className="text-accent font-semibold">{email || "(Enter email first)"}</code>.
                </p>

                {otpStatus && (
                  <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded text-caption">
                    {otpStatus}
                  </div>
                )}

                {otpError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-caption font-mono">
                    {otpError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleSendEmailOtp(email)}
                  disabled={!email || loading}
                  className="bg-[#1c1c1c] hover:bg-[#262626] border border-[#262626] text-[#f2f2f2] text-caption font-bold px-4 py-2.5 rounded transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                >
                  {loading ? "SENDING CODE..." : twoFactorSecret ? "RESEND OTP" : "SEND OTP"}
                </button>
              </div>

              {twoFactorSecret && (
                <div className="flex flex-col gap-2 pt-2">
                  <label className="text-caption text-[#a6a6a6] font-semibold uppercase">
                    Verify Email OTP Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={totpToken}
                      onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 123456"
                      className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded-md text-body-sm focus:border-accent outline-none w-32 tracking-[0.2em] font-mono text-center"
                      disabled={totpVerified}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyTOTP}
                      disabled={totpToken.length !== 6 || totpVerified || verifyingToken}
                      className={`px-5 py-2.5 rounded-md font-semibold text-caption cursor-pointer transition-colors ${
                        totpVerified
                          ? "bg-green-600/10 text-green-400 border border-green-600/30"
                          : "bg-accent hover:bg-accent-hover text-ink-inverse"
                      }`}
                    >
                      {totpVerified ? "VERIFIED ✓" : "VERIFY CODE"}
                    </button>
                  </div>
                </div>
              )}
            </div>


            <button
              type="submit"
              disabled={loading || !totpVerified}
              className="w-full bg-accent hover:bg-accent-hover disabled:bg-accent/40 disabled:text-ink-inverse/50 text-ink-inverse text-button font-semibold py-3.5 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
            >
              <span>CREATE ADMIN ACCOUNT</span> <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
