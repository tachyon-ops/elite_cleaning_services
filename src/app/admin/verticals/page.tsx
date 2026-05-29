"use client";

import React, { useState, useEffect } from "react";
import { getServiceCategoriesList, toggleServiceCategoryActive, getLoggedInAdmin, updateServiceCategoryPriceText } from "@/app/actions/admin";
import { Sliders, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, Plane, Ship, Building2, Home, Shield, Edit2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

// Map slugs to icons
const iconMap: Record<string, any> = {
  domestic: Sparkles,
  aviation: Plane,
  yacht: Ship,
  commercial: Building2,
  hospitality: Home,
  special: Shield
};

export default function AdminVerticalsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isRoot, setIsRoot] = useState(false);

  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [tempPriceText, setTempPriceText] = useState("");
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  const handleSavePriceText = async (slug: string) => {
    setError("");
    setSuccessMsg("");
    setSavingSlug(slug);

    const res = await updateServiceCategoryPriceText(slug, tempPriceText || null);
    setSavingSlug(null);

    if (res.success) {
      setSuccessMsg(`Price display text for "${slug}" updated successfully`);
      setEditingSlug(null);
      const reloadRes = await getServiceCategoriesList();
      if (reloadRes.success && reloadRes.categories) {
        setCategories(reloadRes.categories);
      }
    } else {
      setError(res.error || "Failed to update price display text");
    }
  };

  const verifyRoleAndLoadData = async () => {
    setLoading(true);
    setError("");
    
    // Check if the user is root/super_admin
    const admin = await getLoggedInAdmin();
    if (!admin || admin.role !== "super_admin") {
      setError("Root access required. Redirecting...");
      setTimeout(() => {
        router.push("/admin");
      }, 2000);
      return;
    }

    setIsRoot(true);

    const res = await getServiceCategoriesList();
    setLoading(false);

    if (res.success && res.categories) {
      setCategories(res.categories);
    } else {
      setError(res.error || "Failed to load service categories");
    }
  };

  useEffect(() => {
    verifyRoleAndLoadData();
  }, []);

  const handleToggleActive = async (slug: string, currentActive: boolean) => {
    setError("");
    setSuccessMsg("");
    const nextActive = !currentActive;

    // Optimistic update
    setCategories(prev =>
      prev.map(c => (c.slug === slug ? { ...c, active: nextActive } : c))
    );

    const res = await toggleServiceCategoryActive(slug, nextActive);
    
    if (res.success) {
      setSuccessMsg(`Vertical "${slug}" status updated successfully`);
      // Reload from DB to ensure state consistency
      const reloadRes = await getServiceCategoriesList();
      if (reloadRes.success && reloadRes.categories) {
        setCategories(reloadRes.categories);
      }
    } else {
      // Revert optimistic update
      setCategories(prev =>
        prev.map(c => (c.slug === slug ? { ...c, active: currentActive } : c))
      );
      setError(res.error || "Failed to update category status");
    }
  };

  return (
    <div className="p-8 md:p-12 space-y-8 max-w-7xl w-full mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <span className="text-caption text-accent uppercase tracking-widest block mb-2 font-semibold">Root Operations</span>
          <h1 className="text-display-md font-display font-medium text-[#f2f2f2] tracking-tight">
            Verticals Visibility Control
          </h1>
          <p className="text-body-sm text-[#a6a6a6] mt-1">
            Toggle the service verticals that are active and shown on the customer-facing frontend.
          </p>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md text-body-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-md text-body-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> {successMsg}
        </div>
      )}

      {/* Warning Notice */}
      <div className="border border-yellow-600/20 bg-yellow-600/5 p-6 rounded-lg flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-body-md font-semibold text-[#f2f2f2]">Impact Warning</h3>
          <p className="text-body-sm text-[#a6a6a6] max-w-[80ch]">
            Deactivating a service vertical will hide it from the homepage navigation bar, footer links, and main services grid. It will also disable client intake, pricing calculations, and bookings for that specific vertical.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#a6a6a6] text-body-sm">
          Loading verticals data...
        </div>
      ) : isRoot && (
        <div className="border border-[#262626] bg-[#141414] rounded-lg overflow-hidden">
          <div className="p-6 border-b border-[#262626]">
            <span className="text-body-md font-semibold text-[#f2f2f2] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-accent" /> Configured Service Verticals ({categories.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#262626] text-caption uppercase text-[#a6a6a6] bg-[#0d0d0d]">
                  <th className="p-4 font-semibold">Vertical Category</th>
                  <th className="p-4 font-semibold">Database Slug</th>
                  <th className="p-4 font-semibold">Pricing Model</th>
                  <th className="p-4 font-semibold">Price Display Text</th>
                  <th className="p-4 font-semibold text-center w-24">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-body-sm text-[#f2f2f2]">
                {categories.map((cat) => {
                  const IconComponent = iconMap[cat.slug] || Sliders;
                  return (
                    <tr key={cat.slug} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-4 font-medium flex items-center gap-3">
                        <div className="h-8 w-8 bg-accent-soft text-accent rounded-sm flex items-center justify-center border border-accent/15">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-body-sm font-semibold">{cat.name}</span>
                      </td>
                      <td className="p-4 font-mono text-body-xs text-[#a6a6a6]">
                        {cat.slug}
                      </td>
                      <td className="p-4">
                        <span className="text-caption uppercase px-2 py-0.5 rounded font-mono border border-border/20 bg-bg-subtle text-[#a6a6a6]">
                          {cat.pricingModel.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        {editingSlug === cat.slug ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={tempPriceText}
                              onChange={(e) => setTempPriceText(e.target.value)}
                              placeholder="e.g. FROM CHF 81 / 3h"
                              className="bg-[#1f1f1f] border border-[#333] text-[#f2f2f2] px-2 py-1 rounded text-body-xs font-sans focus:outline-none focus:border-accent w-40"
                              disabled={savingSlug === cat.slug}
                            />
                            <button
                              onClick={() => handleSavePriceText(cat.slug)}
                              disabled={savingSlug === cat.slug}
                              className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded cursor-pointer transition-colors"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingSlug(null)}
                              disabled={savingSlug === cat.slug}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded cursor-pointer transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/price font-mono text-body-xs">
                            <span className={cat.customPriceText ? "text-accent font-semibold" : "text-[#a6a6a6]"}>
                              {cat.customPriceText || "Default (Hardcoded)"}
                            </span>
                            <button
                              onClick={() => {
                                setEditingSlug(cat.slug);
                                setTempPriceText(cat.customPriceText || "");
                              }}
                              className="opacity-0 group-hover/price:opacity-100 p-1 text-[#a6a6a6] hover:text-[#f2f2f2] transition-opacity cursor-pointer"
                              title="Edit Price Display"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(cat.slug, cat.active)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out outline-none focus:ring-1 focus:ring-accent ${
                            cat.active ? "bg-accent" : "bg-[#262626]"
                          }`}
                          aria-label={`Toggle active state for ${cat.name}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#f2f2f2] shadow transition duration-300 ease-in-out ${
                              cat.active ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
