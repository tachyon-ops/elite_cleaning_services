"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock } from "lucide-react";
import { loginAdmin } from "@/app/actions/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setError("");
    setLoading(true);
    const res = await loginAdmin(password);
    setLoading(false);

    if (res.success) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(res.error || "Invalid passphrase");
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex justify-center items-center px-6">
      <div className="max-w-md w-full border border-[#262626] bg-[#141414] p-8 rounded-lg space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 bg-accent/10 text-accent rounded-full flex items-center justify-center border border-accent/25">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-display-sm font-display font-medium text-[#f2f2f2] tracking-tight">ELITE CONTROL</h2>
          <p className="text-body-xs text-[#a6a6a6] uppercase tracking-widest">Administrative Access Only</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md text-body-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[#a6a6a6] font-semibold uppercase flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Administrative Passphrase
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-3 rounded-md text-body-md focus:border-accent outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 rounded-md transition-colors"
          >
            {loading ? "Authenticating..." : "AUTHORIZE ACCESS"}
          </button>
        </form>
      </div>
    </div>
  );
}
