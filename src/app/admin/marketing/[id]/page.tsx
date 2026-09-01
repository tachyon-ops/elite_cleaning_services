"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, QrCode, Printer, Download, Eye, EyeOff, 
  BarChart3, MousePointerClick, ShoppingCart, TrendingUp, 
  Globe, Clock, Edit3, X, Save, CheckCircle2, Sparkles 
} from "lucide-react";
import { getCampaign, toggleCampaign, updateCampaign } from "@/app/actions/marketing";
import QRCode from "qrcode";

const PRESET_SERVICES = [
  { id: "aviation", label: "Aviation", icon: "✈️", desc: "Private jets & hangars" },
  { id: "yacht", label: "Yacht", icon: "⛵", desc: "Boats & marinas" },
  { id: "commercial", label: "Commercial", icon: "🏢", desc: "Offices & retail" },
  { id: "home", label: "Home", icon: "🏠", desc: "Residential cleaning" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️", desc: "Kitchen & dining" },
  { id: "move-out", label: "Move-Out", icon: "📦", desc: "End-of-lease deep clean" },
  { id: "hotel", label: "Hotel", icon: "🏨", desc: "Hospitality & rooms" },
  { id: "medical", label: "Medical", icon: "🏥", desc: "Clinics & practices" },
  { id: "construction", label: "Construction", icon: "🔨", desc: "Post-build cleanup" },
  { id: "chalet", label: "Chalet", icon: "🏔️", desc: "Alpine & holiday homes" },
  { id: "solar", label: "Solar & Facade", icon: "☀️", desc: "Panels & exterior glass" },
  { id: "airbnb", label: "Airbnb Turnover", icon: "🔑", desc: "Short-let laundry & prep" },
];

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [toggling, setToggling] = useState(false);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  const [allServices, setAllServices] = useState(PRESET_SERVICES);
  const [newCustomService, setNewCustomService] = useState({ label: "", icon: "✨", desc: "" });

  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    discountType: "percentage",
    discountValue: "",
    vertical: "",
    validFrom: "",
    validUntil: "",
    noExpiry: true,
    maxRedemptions: "",
    unlimitedRedemptions: true,
    pamphletHeadline: "",
    pamphletSubtext: "",
    pamphletVerticals: [] as any[],
    description: ""
  });

  const loadCampaign = useCallback(async () => {
    try {
      let camp: any = null;
      let statsObj: any = null;
      let scans: any[] = [];

      try {
        const apiRes = await fetch(`/api/campaigns/${id}`, { cache: "no-store" });
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (data.success && data.campaign) {
            camp = data.campaign;
            statsObj = {
              totalScans: camp._count?.scans || 0,
              uniqueScans: camp._count?.scans || 0,
              totalConversions: camp._count?.bookings || 0,
            };
          }
        }
      } catch (apiErr) {
        console.warn("API fetch error, using server action fallback:", apiErr);
      }

      if (!camp) {
        const res = await getCampaign(id);
        if (res.success && res.campaign) {
          camp = res.campaign;
          statsObj = res.stats;
          scans = res.recentScans || [];
        }
      }

      if (camp) {
        setCampaign(camp);
        setStats(statsObj);
        setRecentScans(scans);

        // Populate edit form
        let parsedVerticals: any[] = [];
        if (camp.pamphletVerticals) {
          try {
            parsedVerticals = JSON.parse(camp.pamphletVerticals);
          } catch {
            parsedVerticals = [];
          }
        }

        setEditForm({
          name: camp.name || "",
          code: camp.code || "",
          discountType: camp.discountType || "percentage",
          discountValue: camp.discountValue ? Number(camp.discountValue).toString() : "",
          vertical: camp.vertical || "",
          validFrom: camp.validFrom ? new Date(camp.validFrom).toISOString().split('T')[0] : "",
          validUntil: camp.validUntil ? new Date(camp.validUntil).toISOString().split('T')[0] : "",
          noExpiry: !camp.validUntil,
          maxRedemptions: camp.maxRedemptions ? camp.maxRedemptions.toString() : "",
          unlimitedRedemptions: !camp.maxRedemptions,
          pamphletHeadline: camp.pamphletHeadline || "",
          pamphletSubtext: camp.pamphletSubtext || "",
          pamphletVerticals: parsedVerticals,
          description: camp.description || ""
        });

        // Generate QR code
        const origin = typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "https://mondar.ch";
        const url = `${origin}/r/${camp.code}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        setQrDataUrl(dataUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  const handleToggle = async () => {
    setToggling(true);
    const res = await toggleCampaign(id);
    if (res.success) {
      setCampaign((prev: any) => ({ ...prev, active: res.active }));
    }
    setToggling(false);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !campaign) return;
    const link = document.createElement("a");
    link.download = `mondar-qr-${campaign.code}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const toggleService = (service: typeof PRESET_SERVICES[0]) => {
    setEditForm((prev) => {
      const exists = prev.pamphletVerticals.some((x: any) => (typeof x === "string" ? x === service.id : x.id === service.id));
      const next = exists
        ? prev.pamphletVerticals.filter((x: any) => (typeof x === "string" ? x !== service.id : x.id !== service.id))
        : [...prev.pamphletVerticals, { id: service.id, label: service.label, icon: service.icon, desc: service.desc }];
      return { ...prev, pamphletVerticals: next };
    });
  };

  const handleAddCustomService = () => {
    if (!newCustomService.label.trim()) return;
    const customId = "custom-" + Date.now();
    const serviceObj = {
      id: customId,
      label: newCustomService.label.trim(),
      icon: newCustomService.icon.trim() || "✨",
      desc: newCustomService.desc.trim() || "Bespoke service",
    };
    setAllServices((prev) => [...prev, serviceObj]);
    setEditForm((prev) => ({
      ...prev,
      pamphletVerticals: [...prev.pamphletVerticals, serviceObj],
    }));
    setNewCustomService({ label: "", icon: "✨", desc: "" });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setEditError(null);

    try {
      const payload = {
        name: editForm.name,
        code: editForm.code,
        discountType: editForm.discountType as "percentage" | "fixed",
        discountValue: parseFloat(editForm.discountValue),
        vertical: editForm.vertical || null,
        description: editForm.description || null,
        pamphletHeadline: editForm.pamphletHeadline || null,
        pamphletSubtext: editForm.pamphletSubtext || null,
        pamphletVerticals: JSON.stringify(editForm.pamphletVerticals),
        validFrom: editForm.validFrom ? new Date(editForm.validFrom) : null,
        validUntil: editForm.noExpiry ? null : (editForm.validUntil ? new Date(editForm.validUntil) : null),
        maxRedemptions: editForm.unlimitedRedemptions ? null : (editForm.maxRedemptions ? parseInt(editForm.maxRedemptions, 10) : null),
      };

      let saved = false;
      try {
        const apiRes = await fetch(`/api/campaigns/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (data.success) saved = true;
        }
      } catch (e) {
        console.warn("API patch failed, falling back to server action", e);
      }

      if (!saved) {
        const res = await updateCampaign(id, payload);
        if (res && res.success) saved = true;
        else setEditError(res?.error || "Failed to update campaign");
      }

      if (saved) {
        setEditSuccess(true);
        setTimeout(() => setEditSuccess(false), 2000);
        setIsEditing(false);
        await loadCampaign();
      }
    } catch (err: any) {
      setEditError(err.message || "Failed to update campaign");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatus = () => {
    if (!campaign) return "inactive";
    if (!campaign.active) return "inactive";
    if (campaign.validUntil && new Date(campaign.validUntil) < new Date()) return "expired";
    return "active";
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-[#0d0d0d] min-h-screen">
        <div className="text-[#a6a6a6] text-sm">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-[#0d0d0d] min-h-screen">
        <div className="text-red-400 text-sm">Campaign not found.</div>
      </div>
    );
  }

  const status = getStatus();
  const discountDisplay = campaign.discountType === "percentage"
    ? `${Number(campaign.discountValue)}%`
    : `CHF ${Number(campaign.discountValue).toFixed(2)}`;

  const conversionRate = stats?.totalScans > 0
    ? ((stats.conversions / stats.totalScans) * 100).toFixed(1)
    : "0.0";

  // Parse verticals for display
  let displayVerticals: any[] = [];
  if (campaign.pamphletVerticals) {
    try {
      const parsed = JSON.parse(campaign.pamphletVerticals);
      displayVerticals = parsed.map((item: any) => {
        if (typeof item === "string") {
          const match = PRESET_SERVICES.find(p => p.id === item);
          return match || { id: item, label: item, icon: "✨" };
        }
        return item;
      });
    } catch {}
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#0d0d0d] text-[#f2f2f2] min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/marketing")}
            className="p-2 rounded-md hover:bg-[#1f1f1f] transition-colors text-[#a6a6a6] hover:text-[#f2f2f2]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-display font-semibold !text-white" style={{ color: "#ffffff" }}>
              {campaign.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-[#d4af37] text-xs bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/20 font-bold">
                {campaign.code}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs uppercase font-semibold ${
                status === "active" ? "text-green-400" : status === "expired" ? "text-amber-400" : "text-red-400"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  status === "active" ? "bg-green-400" : status === "expired" ? "bg-amber-400" : "bg-red-400"
                }`} />
                {status === "active" ? "Active" : status === "expired" ? "Expired" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#d4af37] hover:bg-[#b5952f] text-black font-semibold text-sm transition-all shadow-md shadow-[#d4af37]/10"
          >
            <Edit3 className="w-4 h-4" />
            Edit Campaign
          </button>

          <button
            onClick={handleToggle}
            disabled={toggling}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-[#262626] text-sm font-medium text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1f1f1f] transition-all"
          >
            {campaign.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {campaign.active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {editSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <p className="text-sm font-medium">Campaign updated successfully!</p>
        </div>
      )}

      {/* Top row: Campaign Info + QR Code */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Campaign Info Card */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#262626] pb-4">
            <h2 className="text-lg font-semibold !text-white flex items-center gap-2" style={{ color: "#ffffff" }}>
              <BarChart3 className="w-5 h-5 text-[#d4af37]" /> Campaign Details
            </h2>
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-[#d4af37] hover:underline font-medium flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="text-[#666] uppercase text-xs font-semibold">Discount</span>
              <p className="text-white font-semibold mt-1 text-base">{discountDisplay} off</p>
            </div>
            <div>
              <span className="text-[#666] uppercase text-xs font-semibold">Vertical Filter</span>
              <p className="text-white font-medium mt-1 capitalize">{campaign.vertical || "All Verticals"}</p>
            </div>
            <div>
              <span className="text-[#666] uppercase text-xs font-semibold">Valid From</span>
              <p className="text-white font-medium mt-1">
                {new Date(campaign.validFrom).toLocaleDateString("en-CH", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <div>
              <span className="text-[#666] uppercase text-xs font-semibold">Valid Until</span>
              <p className="text-white font-medium mt-1">
                {campaign.validUntil
                  ? new Date(campaign.validUntil).toLocaleDateString("en-CH", { day: "2-digit", month: "short", year: "numeric" })
                  : "No expiry"}
              </p>
            </div>
            <div>
              <span className="text-[#666] uppercase text-xs font-semibold">Redemptions</span>
              <p className="text-white font-medium mt-1">
                {campaign.totalRedemptions}{campaign.maxRedemptions ? ` / ${campaign.maxRedemptions}` : " (unlimited)"}
              </p>
            </div>
            <div>
              <span className="text-[#666] uppercase text-xs font-semibold">Created</span>
              <p className="text-white font-medium mt-1">
                {new Date(campaign.createdAt).toLocaleDateString("en-CH", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Pamphlet Configuration Box */}
          <div className="bg-[#0d0d0d] border border-[#262626] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Pamphlet Configuration
              </span>
              <button
                onClick={() => router.push(`/pamphlet/${id}`)}
                className="text-xs text-[#d4af37] hover:underline font-semibold flex items-center gap-1"
              >
                View Live Flyer →
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-[#888]">
                <strong>Headline:</strong> <span className="text-white font-medium">"{campaign.pamphletHeadline || "Your Space. Flawless."}"</span>
              </div>
              <div className="text-xs text-[#888]">
                <strong>Body:</strong> <span className="text-white/80">"{campaign.pamphletSubtext || "Insured, vetted cleaning professionals across Switzerland..."}"</span>
              </div>
            </div>

            {/* Selected Services Tags */}
            <div className="pt-2 border-t border-[#262626]/60">
              <span className="text-xs text-[#666] block mb-2 font-medium">Services Featured on Flyer:</span>
              <div className="flex flex-wrap gap-2">
                {displayVerticals.length > 0 ? (
                  displayVerticals.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#141414] border border-[#d4af37]/30 text-white"
                    >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#666] italic">Default services (Aviation, Yacht, Commercial, Home, Restaurant, Move-Out)</span>
                )}
              </div>
            </div>
          </div>

          {campaign.description && (
            <div className="pt-4 border-t border-[#262626]">
              <span className="text-[#666] uppercase text-xs font-semibold">Notes</span>
              <p className="text-[#a6a6a6] text-sm mt-1">{campaign.description}</p>
            </div>
          )}
        </div>

        {/* QR Code Card */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
          <h2 className="text-lg font-semibold !text-white flex items-center gap-2" style={{ color: "#ffffff" }}>
            <QrCode className="w-5 h-5 text-[#d4af37]" /> QR Code & Flyer
          </h2>
          {qrDataUrl && (
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <img src={qrDataUrl} alt={`QR Code for ${campaign.code}`} className="w-48 h-48" />
            </div>
          )}
          <p className="text-xs font-mono text-[#a6a6a6] text-center">
            mondar.ch/r/{campaign.code}
          </p>
          <div className="flex gap-2 w-full pt-2">
            <button
              onClick={handleDownloadQr}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-[#262626] text-xs font-medium text-[#a6a6a6] hover:text-[#f2f2f2] hover:bg-[#1f1f1f] transition-all"
            >
              <Download className="w-4 h-4" /> Download QR
            </button>
            <button
              onClick={() => router.push(`/pamphlet/${id}`)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#d4af37] hover:bg-[#b5952f] text-black text-xs font-bold transition-colors shadow-md shadow-[#d4af37]/10"
            >
              <Printer className="w-4 h-4" /> Open Pamphlet
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
          <div className="flex items-center gap-2 text-[#666] text-xs uppercase font-semibold mb-2">
            <MousePointerClick className="w-4 h-4" /> Total Scans
          </div>
          <p className="text-3xl font-display font-medium text-white">
            {stats?.totalScans ?? 0}
          </p>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
          <div className="flex items-center gap-2 text-[#666] text-xs uppercase font-semibold mb-2">
            <Globe className="w-4 h-4" /> Unique Scans
          </div>
          <p className="text-3xl font-display font-medium text-white">
            {stats?.uniqueScans ?? 0}
          </p>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
          <div className="flex items-center gap-2 text-[#666] text-xs uppercase font-semibold mb-2">
            <ShoppingCart className="w-4 h-4" /> Conversions
          </div>
          <p className="text-3xl font-display font-medium text-white">
            {stats?.conversions ?? 0}
          </p>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
          <div className="flex items-center gap-2 text-[#666] text-xs uppercase font-semibold mb-2">
            <TrendingUp className="w-4 h-4" /> Conversion Rate
          </div>
          <p className="text-3xl font-display font-medium text-white">
            {conversionRate}%
          </p>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
        <h2 className="text-lg font-semibold !text-white flex items-center gap-2 mb-4" style={{ color: "#ffffff" }}>
          <Clock className="w-5 h-5 text-[#d4af37]" /> Recent Scans
        </h2>
        {recentScans.length === 0 ? (
          <p className="text-sm text-[#666] text-center py-8">
            No scans recorded yet. Share or print the QR code to start tracking.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#666] text-xs uppercase border-b border-[#262626]">
                  <th className="text-left py-2 pr-4 font-semibold">Time</th>
                  <th className="text-left py-2 pr-4 font-semibold">IP Address</th>
                  <th className="text-left py-2 font-semibold">Device</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan: any) => (
                  <tr key={scan.id} className="border-b border-[#1f1f1f] hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-2.5 pr-4 text-[#a6a6a6]">
                      {new Date(scan.scannedAt).toLocaleString("en-CH", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[#a6a6a6] text-xs">
                      {scan.ipAddress || "—"}
                    </td>
                    <td className="py-2.5 text-[#666] text-xs truncate max-w-[300px]">
                      {scan.userAgent
                        ? scan.userAgent.length > 60
                          ? scan.userAgent.substring(0, 60) + "..."
                          : scan.userAgent
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── EDIT CAMPAIGN MODAL ── */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div>
                <h2 className="text-2xl font-display font-semibold !text-white" style={{ color: "#ffffff" }}>
                  Edit Campaign
                </h2>
                <p className="text-xs text-[#a6a6a6] mt-0.5">Update campaign parameters & bespoke pamphlet services</p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-full hover:bg-[#262626] text-[#888] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg text-sm">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-6">
              
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#a6a6a6] uppercase">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#a6a6a6] uppercase">Promo Code *</label>
                  <input
                    type="text"
                    required
                    value={editForm.code}
                    onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') }))}
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-3.5 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#a6a6a6] uppercase">Discount</label>
                  <div className="flex gap-2">
                    <select
                      value={editForm.discountType}
                      onChange={(e) => setEditForm(prev => ({ ...prev, discountType: e.target.value }))}
                      className="bg-[#0d0d0d] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      <option value="percentage">% Percentage</option>
                      <option value="fixed">Fixed CHF</option>
                    </select>
                    <input
                      type="number"
                      required
                      min="0"
                      step={editForm.discountType === "fixed" ? "0.01" : "1"}
                      value={editForm.discountValue}
                      onChange={(e) => setEditForm(prev => ({ ...prev, discountValue: e.target.value }))}
                      className="flex-1 bg-[#0d0d0d] border border-[#262626] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#a6a6a6] uppercase">Vertical Filter</label>
                  <select
                    value={editForm.vertical}
                    onChange={(e) => setEditForm(prev => ({ ...prev, vertical: e.target.value }))}
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="">All Verticals</option>
                    <option value="domestic">Domestic</option>
                    <option value="commercial">Commercial</option>
                    <option value="hospitality">Hospitality</option>
                    <option value="aviation">Aviation</option>
                    <option value="yacht">Yacht</option>
                    <option value="moveout">Move-out</option>
                    <option value="restaurant">Restaurant</option>
                  </select>
                </div>
              </div>

              {/* Pamphlet Customization */}
              <div className="bg-[#0d0d0d] border border-[#262626] rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Pamphlet Copy & Verticals
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#a6a6a6] mb-1">Pamphlet Headline</label>
                    <input
                      type="text"
                      value={editForm.pamphletHeadline}
                      onChange={(e) => setEditForm(prev => ({ ...prev, pamphletHeadline: e.target.value }))}
                      placeholder="e.g. Your Space. Flawless."
                      className="w-full bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#a6a6a6] mb-1">Pamphlet Subtext</label>
                    <textarea
                      rows={2}
                      value={editForm.pamphletSubtext}
                      onChange={(e) => setEditForm(prev => ({ ...prev, pamphletSubtext: e.target.value }))}
                      placeholder="Insured, vetted cleaning professionals across Switzerland..."
                      className="w-full bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  {/* Vertical Selectors */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-[#a6a6a6] uppercase">
                        Services on Pamphlet ({editForm.pamphletVerticals.length} selected)
                      </label>
                      <span className="text-[11px] text-[#666]">Click to toggle on/off</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                      {allServices.map((v) => {
                        const isSelected = editForm.pamphletVerticals.some((x: any) => (typeof x === "string" ? x === v.id : x.id === v.id));
                        return (
                          <div
                            key={v.id}
                            onClick={() => toggleService(v)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 cursor-pointer select-none transition-all ${
                              isSelected
                                ? "border-[#d4af37] bg-[#d4af37]/15 shadow-sm"
                                : "border-[#262626] bg-[#141414] opacity-40 hover:opacity-75"
                            }`}
                          >
                            <span className="text-xl flex-shrink-0">{v.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-xs text-white leading-tight truncate">{v.label}</div>
                              <div className="text-[#777] text-[10px] truncate">{v.desc}</div>
                            </div>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] font-bold ${
                              isSelected ? "border-[#d4af37] bg-[#d4af37] text-black" : "border-[#444]"
                            }`}>
                              {isSelected ? "✓" : ""}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Custom / Bespoke Service */}
                    <div className="bg-[#141414] border border-[#262626] rounded-lg p-3 space-y-2">
                      <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider block">
                        + Add Bespoke Service (As many as you want)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Emoji"
                            value={newCustomService.icon}
                            onChange={(e) => setNewCustomService(p => ({ ...p, icon: e.target.value }))}
                            className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-2 py-1.5 text-center text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            placeholder="Service Name (e.g. Chalet)"
                            value={newCustomService.label}
                            onChange={(e) => setNewCustomService(p => ({ ...p, label: e.target.value }))}
                            className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Short note"
                            value={newCustomService.desc}
                            onChange={(e) => setNewCustomService(p => ({ ...p, desc: e.target.value }))}
                            className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            type="button"
                            onClick={handleAddCustomService}
                            className="w-full py-1.5 bg-[#d4af37] hover:bg-[#b5952f] text-black font-bold text-xs rounded-md transition-colors"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-lg text-sm text-[#a6a6a6] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#b5952f] disabled:bg-[#d4af37]/50 text-black px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-[#d4af37]/20"
                >
                  {isSaving ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
