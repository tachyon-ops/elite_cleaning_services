"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPartnersList, togglePartnerStatus, isAdminAuthenticated } from "@/app/actions/admin";
import { ShieldCheck, UserCheck, ShieldAlert, CheckCircle2, AlertTriangle, Users, Sliders, DollarSign } from "lucide-react";

export default function AdminProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const checkAuthAndLoad = async () => {
    setLoading(true);
    const auth = await isAdminAuthenticated();
    if (!auth) {
      router.push("/admin/login");
      return;
    }

    const res = await getPartnersList();
    if (res.success) {
      setProviders(res.partners);
    } else {
      setError(res.error || "Failed to load providers list");
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const handleToggleStatus = async (providerId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    const res = await togglePartnerStatus(providerId, nextStatus);
    if (res.success) {
      checkAuthAndLoad();
    } else {
      alert("Failed to update status: " + res.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#f2f2f2] font-body flex justify-center items-center">
        <p className="text-body-md font-mono text-accent animate-pulse">LOADING PROVIDERS DIRECTORY...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <span className="text-caption text-accent uppercase tracking-widest font-semibold">Super-Admin Backoffice</span>
        <h1 className="text-display-md font-display font-medium text-[#f2f2f2] tracking-tight font-body">
          Marketplace Providers Registry
        </h1>
        <p className="text-body-xs text-[#a6a6a6]">Supervise active cleaning contractors, check Stripe Connect setup, and modify commissions.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md text-body-sm">
          {error}
        </div>
      )}

      {providers.length === 0 ? (
        <div className="border border-[#262626] bg-[#141414] p-12 text-center rounded-lg space-y-2">
          <Users className="w-12 h-12 text-[#595959] mx-auto animate-pulse" />
          <h3 className="text-body-md font-semibold text-[#f2f2f2]">No providers registered</h3>
          <p className="text-body-xs text-[#a6a6a6]">Approved applications will create active provider companies.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providers.map((p) => (
            <div key={p.id} className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-body-md font-semibold text-[#f2f2f2]">{p.name}</h3>
                  <p className="text-body-xs text-[#a6a6a6] font-mono">slug: {p.slug}</p>
                </div>
                <button
                  onClick={() => handleToggleStatus(p.id, p.onboardingStatus)}
                  className={`text-caption uppercase font-bold px-3 py-1 rounded border transition-colors ${
                    p.onboardingStatus === "active"
                      ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/25"
                      : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/25"
                  }`}
                >
                  {p.onboardingStatus === "active" ? "Active (Suspend)" : "Suspended (Activate)"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-body-xs text-[#a6a6a6] border-t border-b border-[#1f1f1f] py-3">
                <div>
                  <span className="text-[#737373] uppercase font-bold text-[10px] block">Contact Details</span>
                  <p className="mt-1 text-[#f2f2f2]">{p.contactEmail}</p>
                  <p className="text-[#a6a6a6]">{p.contactPhone}</p>
                  <p className="text-[#737373] mt-1">{p.address}</p>
                </div>
                <div>
                  <span className="text-[#737373] uppercase font-bold text-[10px] block">KYC & Financials</span>
                  <div className="mt-1 space-y-1">
                    <p className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> UID Verified
                    </p>
                    <p className="flex items-center gap-1">
                      {p.stripeConnectStatus === "active" ? (
                        <span className="text-green-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Stripe Connect Link
                        </span>
                      ) : (
                        <span className="text-yellow-400 flex items-center gap-1 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Stripe Connect Pending
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-caption text-[#737373] uppercase font-bold block mb-2">Marketplace Listings</span>
                {p.listings.length === 0 ? (
                  <p className="text-body-xs text-[#737373] italic">No active listings configured.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {p.listings.map((l: any) => (
                      <div key={l.id} className="bg-[#0d0d0d] p-3 rounded border border-[#1f1f1f] text-body-xs space-y-1">
                        <span className="font-semibold text-accent uppercase font-mono block">
                          {l.categorySlug.replace("-", " ")}
                        </span>
                        <p className="text-[#a6a6a6]">Radius: {l.serviceRadiusKm} km</p>
                        <p className="text-[#737373]">Capacity: {l.capacityPerDay} jobs/day</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
