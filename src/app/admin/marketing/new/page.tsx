"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { createCampaign } from "@/app/actions/marketing";

const PRESET_SERVICES = [
  { id: "aviation", label: "Aviation", icon: "✈️", desc: "Private jets & hangars" },
  { id: "yacht", label: "Yacht", icon: "⛵", desc: "Boats & marinas" },
  { id: "commercial", label: "Commercial", icon: "🏢", desc: "Offices & retail" },
  { id: "home", label: "Home", icon: "🏠", desc: "Residential cleaning" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️", desc: "Kitchen & dining" },
  { id: "move-out", label: "Move-Out", icon: "📦", desc: "End-of-lease" },
  { id: "hotel", label: "Hotel", icon: "🏨", desc: "Hospitality & rooms" },
  { id: "medical", label: "Medical", icon: "🏥", desc: "Clinics & practices" },
  { id: "construction", label: "Construction", icon: "🔨", desc: "Post-build cleanup" },
  { id: "chalet", label: "Chalet", icon: "🏔️", desc: "Alpine & holiday homes" },
  { id: "solar", label: "Solar & Facade", icon: "☀️", desc: "Panels & exterior glass" },
  { id: "airbnb", label: "Airbnb Turnover", icon: "🔑", desc: "Short-let laundry & prep" },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [allServices, setAllServices] = useState(PRESET_SERVICES);
  const [newCustomService, setNewCustomService] = useState({ label: "", icon: "✨", desc: "" });

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    discountType: "percentage",
    discountValue: "",
    vertical: "",
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: "",
    noExpiry: true,
    maxRedemptions: "",
    unlimitedRedemptions: true,
    pamphletHeadline: "",
    pamphletSubtext: "",
    pamphletVerticals: [
      { id: "aviation", label: "Aviation", icon: "✈️" },
      { id: "yacht", label: "Yacht", icon: "⛵" },
      { id: "commercial", label: "Commercial", icon: "🏢" },
      { id: "home", label: "Home", icon: "🏠" },
      { id: "restaurant", label: "Restaurant", icon: "🍽️" },
      { id: "move-out", label: "Move-Out", icon: "📦" }
    ] as any[],
    description: ""
  });

  const toggleService = (service: typeof PRESET_SERVICES[0]) => {
    setFormData((prev) => {
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
    setFormData((prev) => ({
      ...prev,
      pamphletVerticals: [...prev.pamphletVerticals, serviceObj],
    }));
    setNewCustomService({ label: "", icon: "✨", desc: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      if (name === 'noExpiry' && checked) {
        setFormData(prev => ({ ...prev, validUntil: '' }));
      }
      if (name === 'unlimitedRedemptions' && checked) {
        setFormData(prev => ({ ...prev, maxRedemptions: '' }));
      }
      return;
    }

    if (name === 'code') {
      const formatted = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      setFormData(prev => ({ ...prev, [name]: formatted }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        discountType: formData.discountType as "percentage" | "fixed",
        discountValue: parseFloat(formData.discountValue),
        vertical: formData.vertical || undefined,
        description: formData.description || undefined,
        pamphletHeadline: formData.pamphletHeadline || undefined,
        pamphletSubtext: formData.pamphletSubtext || undefined,
        pamphletVerticals: JSON.stringify(formData.pamphletVerticals),
        validFrom: formData.validFrom ? new Date(formData.validFrom) : undefined,
        validUntil: formData.noExpiry ? undefined : (formData.validUntil ? new Date(formData.validUntil) : undefined),
        maxRedemptions: formData.unlimitedRedemptions ? undefined : (formData.maxRedemptions ? parseInt(formData.maxRedemptions, 10) : undefined),
      };
      
      const res = await createCampaign(payload);
      if (res.success && res.campaign) {
        router.push(`/admin/marketing/${res.campaign.id}`);
      } else {
        setError(res.error || "Failed to create campaign. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create campaign. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f2f2f2] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/admin/marketing')}
            className="p-2 hover:bg-[#262626] rounded-full transition-colors text-[#a6a6a6] hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-display font-semibold !text-white" style={{ color: "#ffffff" }}>
              New Campaign
            </h1>
            <p className="text-[#a6a6a6] font-body mt-1">Create a promotional campaign and generate tracking materials</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-md flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Details */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-display font-medium border-b border-[#262626] pb-4">Campaign Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#a6a6a6]">Campaign Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                  placeholder="e.g. Summer Special 2024"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#a6a6a6]">Promo Code *</label>
                <input 
                  type="text" 
                  name="code" 
                  required
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all font-mono uppercase"
                  placeholder="SUMMER24"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#a6a6a6]">Discount Type</label>
                <div className="flex bg-[#0d0d0d] border border-[#262626] rounded-md p-1">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, discountType: 'percentage' }))}
                    className={`flex-1 py-1.5 text-sm rounded-sm transition-colors ${formData.discountType === 'percentage' ? 'bg-[#262626] text-white shadow-sm' : 'text-[#a6a6a6] hover:text-white'}`}
                  >
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, discountType: 'fixed' }))}
                    className={`flex-1 py-1.5 text-sm rounded-sm transition-colors ${formData.discountType === 'fixed' ? 'bg-[#262626] text-white shadow-sm' : 'text-[#a6a6a6] hover:text-white'}`}
                  >
                    Fixed CHF
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#a6a6a6]">Discount Value *</label>
                <div className="relative">
                  {formData.discountType === 'fixed' && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a6a6a6]">CHF</span>
                  )}
                  <input 
                    type="number" 
                    name="discountValue" 
                    required
                    min="0"
                    step={formData.discountType === 'fixed' ? "0.01" : "1"}
                    value={formData.discountValue}
                    onChange={handleChange}
                    className={`w-full bg-[#0d0d0d] border border-[#262626] rounded-md py-2 pr-4 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all ${formData.discountType === 'fixed' ? 'pl-12' : 'pl-4'}`}
                    placeholder={formData.discountType === 'percentage' ? 'e.g. 15' : 'e.g. 20.00'}
                  />
                  {formData.discountType === 'percentage' && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a6a6a6]">%</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-[#a6a6a6]">Promo Code Restriction</label>
                  <span className="text-xs text-[#d4af37] font-medium">Checkout Rule</span>
                </div>
                <select 
                  name="vertical" 
                  value={formData.vertical}
                  onChange={(e) => {
                    const newVertical = e.target.value;
                    setFormData(prev => {
                      let nextPamp = [...prev.pamphletVerticals];
                      if (newVertical) {
                        const match = allServices.find(s => s.id === newVertical);
                        if (match && !nextPamp.some((x: any) => (typeof x === "string" ? x === newVertical : x.id === newVertical))) {
                          nextPamp = [match, ...nextPamp];
                        }
                      }
                      return { ...prev, vertical: newVertical, pamphletVerticals: nextPamp };
                    });
                  }}
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all text-white"
                >
                  <option value="">All Verticals (Usable site-wide across all services)</option>
                  <option value="domestic">Domestic Cleaning Only</option>
                  <option value="commercial">Commercial Offices Only</option>
                  <option value="hospitality">Hospitality & Turnovers Only</option>
                  <option value="aviation">Aviation Detailing Only</option>
                  <option value="yacht">Yacht & Marine Only</option>
                  <option value="moveout">Move-out Cleaning Only</option>
                  <option value="building-care">Building Care Only</option>
                  <option value="restaurant">Restaurant & Kitchen Only</option>
                </select>
                <p className="text-xs text-[#777]">Controls which service booking can redeem this discount code.</p>
              </div>
            </div>
          </div>

          {/* Rules & Limits */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-display font-medium border-b border-[#262626] pb-4">Rules & Limits</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#a6a6a6]">Valid From *</label>
                  <input 
                    type="date" 
                    name="validFrom" 
                    required
                    value={formData.validFrom}
                    onChange={handleChange}
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all [color-scheme:dark]"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-[#a6a6a6]">Valid Until</label>
                    <label className="flex items-center gap-2 text-sm text-[#a6a6a6] cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="noExpiry"
                        checked={formData.noExpiry}
                        onChange={handleChange}
                        className="rounded border-[#262626] bg-[#0d0d0d] text-[#d4af37] focus:ring-[#d4af37]"
                      />
                      No expiry
                    </label>
                  </div>
                  <input 
                    type="date" 
                    name="validUntil" 
                    required={!formData.noExpiry}
                    disabled={formData.noExpiry}
                    value={formData.validUntil}
                    onChange={handleChange}
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-[#a6a6a6]">Max Redemptions</label>
                    <label className="flex items-center gap-2 text-sm text-[#a6a6a6] cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="unlimitedRedemptions"
                        checked={formData.unlimitedRedemptions}
                        onChange={handleChange}
                        className="rounded border-[#262626] bg-[#0d0d0d] text-[#d4af37] focus:ring-[#d4af37]"
                      />
                      Unlimited
                    </label>
                  </div>
                  <input 
                    type="number" 
                    name="maxRedemptions" 
                    min="1"
                    required={!formData.unlimitedRedemptions}
                    disabled={formData.unlimitedRedemptions}
                    value={formData.maxRedemptions}
                    onChange={handleChange}
                    className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g. 100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pamphlet Customization */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-display font-medium border-b border-[#262626] pb-4">Pamphlet Customization</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#a6a6a6]">Pamphlet Headline</label>
                <input 
                  type="text" 
                  name="pamphletHeadline" 
                  value={formData.pamphletHeadline}
                  onChange={handleChange}
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                  placeholder="e.g. Your Space. Flawless."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#a6a6a6]">Pamphlet Subtext</label>
                <textarea 
                  name="pamphletSubtext" 
                  rows={3}
                  value={formData.pamphletSubtext}
                  onChange={handleChange}
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all resize-y"
                  placeholder="Insured, vetted cleaning professionals across Switzerland..."
                />
              </div>

              {/* ── Vertical Selection for Pamphlet ── */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-[#a6a6a6]">Services Featured on Printed Flyer (Visual Cards)</label>
                    <p className="text-xs text-[#666]">Choose 3 to 6 services to display as featured cards on the printed A4 pamphlet</p>
                  </div>
                  <span className="text-xs text-[#d4af37] font-semibold bg-[#d4af37]/10 px-2.5 py-1 rounded-full border border-[#d4af37]/30">
                    {formData.pamphletVerticals.length} selected
                  </span>
                </div>

                {/* Grid of service cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allServices.map((v) => {
                    const isSelected = formData.pamphletVerticals.some((x: any) => (typeof x === "string" ? x === v.id : x.id === v.id));
                    return (
                      <div
                        key={v.id}
                        onClick={() => toggleService(v)}
                        className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none text-left ${
                          isSelected 
                            ? "border-[#d4af37] bg-[#d4af37]/10 shadow-sm" 
                            : "border-[#262626] bg-[#0d0d0d] opacity-40 hover:opacity-75"
                        }`}
                      >
                        <span className="text-2xl flex-shrink-0">{v.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm leading-tight text-[#f2f2f2]">{v.label}</div>
                          <div className="text-[#888] text-[11px] truncate">{v.desc}</div>
                        </div>
                        <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? "border-[#d4af37] bg-[#d4af37] text-black" : "border-[#333]"
                        }`}>
                          {isSelected ? "✓" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom Service Form */}
                <div className="bg-[#0d0d0d] border border-[#262626] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
                      <span>✨</span> Add Bespoke / Custom Service
                    </span>
                    <span className="text-[11px] text-[#666]">Add as many as you need</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Emoji"
                        value={newCustomService.icon}
                        onChange={(e) => setNewCustomService((prev) => ({ ...prev, icon: e.target.value }))}
                        className="w-full bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-center text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Service Name (e.g. Chalet Deep Clean)"
                        value={newCustomService.label}
                        onChange={(e) => setNewCustomService((prev) => ({ ...prev, label: e.target.value }))}
                        className="w-full bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Short Note (e.g. Alpine luxury)"
                        value={newCustomService.desc}
                        onChange={(e) => setNewCustomService((prev) => ({ ...prev, desc: e.target.value }))}
                        className="w-full bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddCustomService}
                        className="w-full h-full py-2 bg-[#d4af37] hover:bg-[#b5952f] text-black font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <span>+</span> Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#a6a6a6]">Internal Description / Notes</label>
                <textarea 
                  name="description" 
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all resize-y"
                  placeholder="Notes about this campaign (not visible to customers)"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-[#262626]">
            <button
              type="button"
              onClick={() => router.push('/admin/marketing')}
              className="px-6 py-2 rounded-md font-medium text-[#a6a6a6] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#b5952f] disabled:bg-[#d4af37]/50 disabled:cursor-not-allowed text-black px-8 py-2 rounded-md font-medium transition-colors shadow-lg shadow-[#d4af37]/20"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isSubmitting ? 'Saving...' : 'Save Campaign'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
