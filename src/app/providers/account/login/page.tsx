"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginProvider, loginProvider2FA } from "@/app/actions/provider";
import { ShieldAlert, KeyRound, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function ProviderLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // 2FA Verification Flow State
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState("");
  const [totpToken, setTotpToken] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await loginProvider(email, password);
    setLoading(false);

    if (res.success) {
      if (res.requires2FA && res.userId) {
        setRequires2FA(true);
        setUserId(res.userId);
      } else {
        router.push("/providers/account");
        router.refresh();
      }
    } else {
      setError(res.error || "Invalid provider credentials.");
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpToken.length !== 6) return;

    setError("");
    setLoading(true);
    const res = await loginProvider2FA(userId, totpToken);
    setLoading(false);

    if (res.success) {
      router.push("/providers/account");
      router.refresh();
    } else {
      setError(res.error || "Invalid 2FA token");
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#f2f2f2] font-body flex flex-col justify-between">
      {/* Header */}
      <nav className="max-w-7xl mx-auto w-full px-6 py-6 border-b border-[#1f1f1f] flex justify-between items-center shrink-0">
        <Link href="/providers" className="font-display font-medium text-body-lg tracking-widest text-[#f2f2f2] hover:text-accent transition-colors">
          ELITE PARTNER HUB
        </Link>
      </nav>

      {/* Login Box */}
      <div className="flex-1 flex justify-center items-center p-6">
        <div className="max-w-md w-full border border-[#262626] bg-[#141414] p-8 rounded-lg space-y-6">
          <div className="flex flex-col gap-2 text-center">
            <div className="h-12 w-12 bg-accent/10 text-accent rounded-full flex items-center justify-center border border-accent/25 mx-auto">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 className="text-display-sm font-display font-medium text-[#f2f2f2] tracking-tight">
              {requires2FA ? "Multi-Factor Authentication" : "Partner Log In"}
            </h2>
            <p className="text-body-xs text-[#a6a6a6]">
              {requires2FA ? "Enter verification token to authorize access" : "Access your marketplace dispatch control panel"}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md text-body-sm flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!requires2FA ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-caption text-[#a6a6a6] font-semibold uppercase">Partner Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@alpineclean.ch"
                  className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-sm focus:border-accent outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-caption text-[#a6a6a6] font-semibold uppercase">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 pr-10 rounded-md text-body-sm focus:border-accent outline-none w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a6a6a6] hover:text-[#f2f2f2] focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3.5 rounded-md transition-colors cursor-pointer"
              >
                {loading ? "LOGGING IN..." : "SECURE ENTER"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-caption text-[#a6a6a6] font-semibold uppercase flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> 6-Digit Authenticator Code
                </label>
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
                  className="flex-1 border border-[#262626] hover:bg-[#1a1a1a] text-[#a6a6a6] font-semibold py-3.5 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading || totpToken.length !== 6}
                  className="flex-1 bg-accent hover:bg-accent-hover disabled:bg-accent/40 text-ink-inverse font-semibold py-3.5 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Verify Code
                </button>
              </div>
            </form>
          )}

          <div className="text-center text-body-xs text-[#595959] pt-4">
            Not yet registered?{" "}
            <Link href="/providers/apply" className="text-accent hover:underline font-semibold">
              Submit Application
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1f1f1f] bg-[#0d0d0d] py-6 text-center text-[#595959] text-body-xs font-mono">
        &copy; {new Date().getFullYear()} Elite Cleaning Platform AG. Secure dispatcher access.
      </footer>
    </div>
  );
}
