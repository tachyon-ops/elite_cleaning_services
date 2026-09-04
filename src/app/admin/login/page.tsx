"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Mail, KeyRound, ArrowRight, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { loginAdmin, loginAdmin2FA, checkAdminExists, isAdminAuthenticated, requestPasswordResetAdmin, resetPasswordAdmin, devQuickLoginAdmin } from "@/app/actions/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 2FA Verification Flow State
  const [requires2FA, setRequires2FA] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Password Reset Flow State
  const [resetStep, setResetStep] = useState<"login" | "forgot" | "otp" | "success">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [resendingOtp, setResendingOtp] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkExistsAndAuth = async () => {
      try {
        const res = await checkAdminExists();
        if (res.success && !res.exists) {
          router.push("/admin/signup");
          return;
        }

        const authenticated = await isAdminAuthenticated();
        if (authenticated) {
          router.push("/admin");
          return;
        }
      } catch (err) {
        console.error("Admin check failed:", err);
      } finally {
        if (mounted) setChecking(false);
      }
    };
    checkExistsAndAuth();
    return () => { mounted = false; };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const res = await loginAdmin(email, password);
      if (res) {
        if (res.success) {
          if (res.requires2FA && res.userId) {
            setRequires2FA(true);
            setUserId(res.userId);
            setMaskedEmail(res.emailMasked || "");
            if (res.devOtp) {
              setDevOtp(res.devOtp);
            }
          } else {
            window.location.href = "/admin";
          }
        } else {
          setError(res.error || "Invalid administrative credentials");
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("Server Action") || err?.message?.includes("deployment") || err?.message?.includes("Failed to find")) {
        window.location.reload();
      } else {
        setError(err?.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = totpToken.replace(/\D/g, "").trim();
    if (cleanToken.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      // 1. Direct HTTP API endpoint - immune to build hash changes across deployments
      const response = await fetch("/api/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, token: cleanToken }),
      });

      const res = await response.json();
      if (res?.success) {
        window.location.href = "/admin";
        return;
      } else {
        setError(res?.error || "Invalid verification code");
      }
    } catch (apiErr) {
      // 2. Fallback to server action
      try {
        const res = await loginAdmin2FA(userId, cleanToken);
        if (res?.success) {
          window.location.href = "/admin";
          return;
        } else {
          setError(res?.error || "Invalid verification code");
        }
      } catch (err: any) {
        if (err?.message?.includes("Server Action") || err?.message?.includes("deployment") || err?.message?.includes("Failed to find")) {
          setError("Deployment updated in background. Refreshing page...");
          setTimeout(() => {
            window.location.reload();
          }, 800);
        } else {
          setError(err?.message || "Verification failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!userId || resendingOtp) return;
    setError("");
    setSuccessMessage("");
    setResendingOtp(true);
    try {
      const response = await fetch("/api/admin/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const res = await response.json();
      if (res?.success) {
        setSuccessMessage("A fresh 6-digit code has been sent to your email.");
        if (res.devOtp) setDevOtp(res.devOtp);
      } else {
        setError(res?.error || "Failed to resend OTP code.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to resend code.");
    } finally {
      setResendingOtp(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setError("");
    setLoading(true);
    const res = await requestPasswordResetAdmin(resetEmail);
    setLoading(false);

    if (res.success) {
      setResetStep("otp");
    } else {
      setError(res.error || "Failed to send reset code.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setError("");
    setLoading(true);
    const res = await resetPasswordAdmin(resetEmail, resetCode, newPassword);
    setLoading(false);

    if (res.success) {
      setResetStep("success");
      setSuccessMessage("Password reset successfully. You can now log in.");
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setError(res.error || "Failed to reset password.");
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
            {resetStep !== "login"
              ? "Password Recovery"
              : requires2FA
              ? "Verify Email OTP Code"
              : "Administrative Access Only"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md text-body-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-md text-body-sm">
            {successMessage}
          </div>
        )}

        {resetStep === "login" ? (
          !requires2FA ? (
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
                  placeholder="e.g. my@email.com"
                  className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-md focus:border-accent outline-none w-full"
                />
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="text-caption text-[#a6a6a6] font-semibold uppercase flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 pr-10 rounded-md text-body-md focus:border-accent outline-none w-full"
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

              <div className="flex justify-end items-center text-body-xs">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setResetEmail(email);
                    setResetStep("forgot");
                  }}
                  className="text-[#a6a6a6] hover:text-accent transition-colors font-medium cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Sending OTP..." : "SEND OTP CODE"} <ArrowRight className="w-4 h-4" />
              </button>

              {process.env.NODE_ENV !== "production" && (
                <button
                  type="button"
                  onClick={async () => {
                    setError("");
                    setLoading(true);
                    const res = await devQuickLoginAdmin("/admin/marketing");
                    setLoading(false);
                    if (res?.success) {
                      router.push(res.redirect || "/admin/marketing");
                      router.refresh();
                    } else {
                      setError(res?.error || "Dev login failed");
                    }
                  }}
                  className="w-full bg-accent/15 hover:bg-accent/25 border border-accent/40 text-accent font-medium text-caption py-2.5 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  ⚡ Dev 1-Click Login to Campaigns
                </button>
              )}
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

                {devOtp && (
                  <div className="bg-accent/10 border border-accent/30 text-accent p-2.5 rounded-md text-xs font-mono flex items-center justify-between">
                    <span>Dev OTP: <strong className="text-[#f2f2f2]">{devOtp}</strong></span>
                    <button
                      type="button"
                      onClick={() => setTotpToken(devOtp)}
                      className="bg-accent text-ink-inverse px-2 py-0.5 rounded text-[11px] font-sans font-bold hover:bg-accent-hover"
                    >
                      Auto-Fill
                    </button>
                  </div>
                )}

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
                  disabled={loading || resendingOtp || totpToken.length !== 6}
                  className="flex-1 bg-accent hover:bg-accent-hover disabled:bg-accent/40 text-ink-inverse font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={loading || resendingOtp}
                  onClick={handleResendOtp}
                  className="text-body-xs text-[#a6a6a6] hover:text-accent transition-colors cursor-pointer disabled:opacity-50"
                >
                  {resendingOtp ? "Sending fresh code..." : "Didn't receive code? Resend OTP"}
                </button>
              </div>
            </form>
          )
        ) : resetStep === "forgot" ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-caption text-[#a6a6a6] font-semibold uppercase flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Administrative Email
              </label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="e.g. my@email.com"
                className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-md focus:border-accent outline-none w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !resetEmail}
              className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Sending Code..." : "SEND RESET CODE"} <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setResetStep("login");
              }}
              className="w-full border border-[#262626] hover:bg-[#1a1a1a] text-[#a6a6a6] font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
          </form>
        ) : resetStep === "otp" ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-caption text-[#a6a6a6] font-semibold uppercase flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> 6-Digit Reset Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 123456"
                className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-md focus:border-accent outline-none tracking-[0.2em] font-mono text-center w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-caption text-[#a6a6a6] font-semibold uppercase flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> New Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 pr-10 rounded-md text-body-md focus:border-accent outline-none w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 text-[#a6a6a6] hover:text-[#f2f2f2] transition-colors focus:outline-none"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-caption text-[#a6a6a6] font-semibold uppercase flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Confirm New Password
              </label>
              <input
                type={showNewPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-md focus:border-accent outline-none w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !resetCode || !newPassword || !confirmPassword}
              className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Resetting..." : "RESET PASSWORD"} <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setResetStep("forgot");
              }}
              className="w-full border border-[#262626] hover:bg-[#1a1a1a] text-[#a6a6a6] font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-body-md text-[#a6a6a6]">{successMessage}</p>
            <button
              type="button"
              onClick={() => {
                setError("");
                setResetStep("login");
              }}
              className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
