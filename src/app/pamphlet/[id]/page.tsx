"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getCampaign, updateCampaign } from "@/app/actions/marketing";
import { isAdminAuthenticated } from "@/app/actions/admin";
import QRCode from "qrcode";
import { 
  ChevronLeft, Printer, Edit3, Code2, 
  Save, Sparkles, X, RotateCcw, Layout, MapPin, 
  Smartphone, Monitor, Check
} from "lucide-react";

type Mode = "presets" | "bespoke";
type PresetTheme = "classic" | "modern" | "minimal";
export type ColorPaletteId = "gold" | "emerald" | "navy" | "burgundy" | "monochrome";
export type SegmentBucketId = "residential" | "commercial" | "specialized";

/* ── Helpers ── */
function discountLabel(type: string, value: number) {
  if (type === "percentage") return `${value}% OFF`;
  return `CHF ${Number(value).toFixed(2)} OFF`;
}

export type VerticalItem = {
  id: string;
  label: string;
  icon: string;
  desc?: string;
};

export const LOCATION_PRESETS = [
  "Zürich",
  "Zürich & Greater Area",
  "Zug",
  "Geneva",
  "St. Moritz",
  "Basel",
  "Lucerne",
  "Gstaad",
  "Switzerland",
];

export const HERO_IMAGE_PRESETS = [
  {
    id: "villa",
    bucket: "residential",
    label: "Modern Villa",
    icon: "🏡",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85&auto=format",
  },
  {
    id: "penthouse",
    bucket: "residential",
    label: "Luxury Penthouse",
    icon: "🏢",
    url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=85&auto=format",
  },
  {
    id: "chalet",
    bucket: "residential",
    label: "Alpine Chalet",
    icon: "🏔️",
    url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=85&auto=format",
  },
  {
    id: "spa",
    bucket: "residential",
    label: "Private Spa & Bath",
    icon: "🛁",
    url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=85&auto=format",
  },
  {
    id: "kitchen",
    bucket: "commercial",
    label: "Commercial Kitchen",
    icon: "🍽️",
    url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=85&auto=format",
  },
  {
    id: "office",
    bucket: "commercial",
    label: "Corporate Office",
    icon: "🏢",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85&auto=format",
  },
  {
    id: "aviation",
    bucket: "specialized",
    label: "Private Jet Cabin",
    icon: "✈️",
    url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=85&auto=format",
  },
  {
    id: "yacht",
    bucket: "specialized",
    label: "Superyacht",
    icon: "⛵",
    url: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1200&q=85&auto=format",
  },
];

export const COLOR_PALETTES = [
  {
    id: "gold" as ColorPaletteId,
    name: "Swiss Gold",
    primary: "#0f172a",
    accent: "#d4af37",
    accentHover: "#b5952f",
    accentSoft: "#fbf8eb",
    border: "#d4af37",
    badgeBg: "#0f172a",
    badgeText: "#d4af37",
    topBarGradient: "from-[#d4af37] via-[#fef3c7] to-[#d4af37]",
    chipBg: "bg-amber-50 border-amber-200 text-amber-900",
  },
  {
    id: "navy" as ColorPaletteId,
    name: "Lake Zürich Navy",
    primary: "#0f172a",
    accent: "#1e40af",
    accentHover: "#1d4ed8",
    accentSoft: "#eff6ff",
    border: "#3b82f6",
    badgeBg: "#0f172a",
    badgeText: "#93c5fd",
    topBarGradient: "from-[#1e40af] via-[#bfdbfe] to-[#1e40af]",
    chipBg: "bg-blue-50 border-blue-200 text-blue-900",
  },
  {
    id: "emerald" as ColorPaletteId,
    name: "Alpine Forest",
    primary: "#064e3b",
    accent: "#047857",
    accentHover: "#065f46",
    accentSoft: "#f0fdf4",
    border: "#059669",
    badgeBg: "#064e3b",
    badgeText: "#6ee7b7",
    topBarGradient: "from-[#064e3b] via-[#a7f3d0] to-[#064e3b]",
    chipBg: "bg-emerald-50 border-emerald-200 text-emerald-900",
  },
  {
    id: "burgundy" as ColorPaletteId,
    name: "St. Moritz Burgundy",
    primary: "#4c0519",
    accent: "#9f1239",
    accentHover: "#881337",
    accentSoft: "#fff1f2",
    border: "#be123c",
    badgeBg: "#4c0519",
    badgeText: "#fecdd3",
    topBarGradient: "from-[#881337] via-[#fecdd3] to-[#881337]",
    chipBg: "bg-rose-50 border-rose-200 text-rose-900",
  },
  {
    id: "monochrome" as ColorPaletteId,
    name: "Zurich Monochrome",
    primary: "#0f172a",
    accent: "#18181b",
    accentHover: "#27272a",
    accentSoft: "#f4f4f5",
    border: "#27272a",
    badgeBg: "#18181b",
    badgeText: "#ffffff",
    topBarGradient: "from-[#18181b] via-[#71717a] to-[#18181b]",
    chipBg: "bg-neutral-100 border-neutral-300 text-neutral-900",
  },
];

export interface SegmentBucket {
  id: SegmentBucketId;
  name: string;
  badge: string;
  tagline: string;
  defaultHeadline: string;
  defaultSubtext: string;
  verticals: VerticalItem[];
  defaultImageId: string;
}

export const SEGMENT_BUCKETS: SegmentBucket[] = [
  {
    id: "residential",
    name: "Residential & Living",
    badge: "HOMES · APARTMENTS · AIRBNB",
    tagline: "Residential Cleaning Services",
    defaultHeadline: "Your Living Space. Impeccably Maintained.",
    defaultSubtext: "Matched, not dispatched. Most services send whoever is free. We place a vetted, insured professional chosen for your home — and keep them there.",
    verticals: [
      { id: "home", label: "Home", icon: "🏠", desc: "Private residences & weekly upkeep" },
      { id: "move-out", label: "Move-Out", icon: "📦", desc: "Abnahmegarantie deep clean" },
      { id: "airbnb", label: "Airbnb Turnover", icon: "🔑", desc: "Short-let laundry & prep" },
      { id: "chalet", label: "Chalet & Holiday", icon: "🏔️", desc: "Alpine & secondary residences" },
    ],
    defaultImageId: "villa",
  },
  {
    id: "commercial",
    name: "Commercial & Dining",
    badge: "OFFICES · RESTAURANTS · RETAIL",
    tagline: "Commercial Cleaning Services",
    defaultHeadline: "Spotless Standards for Swiss Businesses.",
    defaultSubtext: "Matched, not dispatched. We assign dedicated, insured commercial specialists vetted for your exact premises — ensuring consistent, high-standard hygiene.",
    verticals: [
      { id: "commercial", label: "Commercial Office", icon: "🏢", desc: "Corporate workspaces & retail" },
      { id: "restaurant", label: "Restaurant & Kitchen", icon: "🍽️", desc: "Degreasing, hoods & dining areas" },
      { id: "hotel", label: "Hospitality & Rooms", icon: "🏨", desc: "Boutique hotels & guest suites" },
      { id: "construction", label: "Post-Construction", icon: "🔨", desc: "Handover & builder cleans" },
    ],
    defaultImageId: "office",
  },
  {
    id: "specialized",
    name: "Specialized Luxury Assets",
    badge: "AVIATION · YACHTS · FACADES",
    tagline: "Specialized Cleaning Services",
    defaultHeadline: "Discreet Care for Your Most Valued Assets.",
    defaultSubtext: "Matched, not dispatched. Discreet, insured specialists vetted specifically for aviation, marine, and luxury estates.",
    verticals: [
      { id: "aviation", label: "Aviation", icon: "✈️", desc: "Private jets & hangars" },
      { id: "yacht", label: "Yacht & Marine", icon: "⛵", desc: "Boats, cabins & marinas" },
      { id: "chalet", label: "Alpine Estate", icon: "🏔️", desc: "High-altitude chalets" },
      { id: "solar", label: "Solar & Facade", icon: "☀️", desc: "Panels & architectural glass" },
    ],
    defaultImageId: "aviation",
  },
];

export const PRESET_VERTICALS: VerticalItem[] = [
  { id: "home", label: "Home", icon: "🏠", desc: "Residential cleaning" },
  { id: "move-out", label: "Move-Out", icon: "📦", desc: "End-of-lease deep clean" },
  { id: "airbnb", label: "Airbnb Turnover", icon: "🔑", desc: "Short-let laundry & prep" },
  { id: "commercial", label: "Commercial", icon: "🏢", desc: "Offices & retail" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️", desc: "Kitchen & dining" },
  { id: "chalet", label: "Chalet", icon: "🏔️", desc: "Alpine & holiday homes" },
  { id: "aviation", label: "Aviation", icon: "✈️", desc: "Private jets & hangars" },
  { id: "yacht", label: "Yacht", icon: "⛵", desc: "Boats & marinas" },
  { id: "hotel", label: "Hotel", icon: "🏨", desc: "Hospitality & rooms" },
  { id: "medical", label: "Medical", icon: "🏥", desc: "Clinics & practices" },
  { id: "construction", label: "Construction", icon: "🔨", desc: "Post-build cleanup" },
  { id: "solar", label: "Solar & Facade", icon: "☀️", desc: "Panels & exterior glass" },
];

function parseVerticals(verticalsJson: any): VerticalItem[] {
  if (!verticalsJson) return SEGMENT_BUCKETS[0].verticals;
  try {
    const raw = typeof verticalsJson === "string" ? JSON.parse(verticalsJson) : verticalsJson;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((item) => {
        if (typeof item === "string") {
          const match = PRESET_VERTICALS.find(p => p.id === item);
          return match || { id: item, label: item, icon: "✨" };
        }
        return item;
      });
    }
  } catch {}
  return SEGMENT_BUCKETS[0].verticals;
}

/* ────────────────────────────────────────────────────────
   THEME 1: CLASSIC — White Swiss Editorial Luxury (Print-Ready)
   ──────────────────────────────────────────────────────── */
function ClassicTheme({ 
  headline, 
  subtext, 
  discountType, 
  discountValue, 
  code, 
  verticals, 
  qrCodeUrl,
  heroImage,
  palette,
  location,
  segmentBadge,
  segmentTagline,
}: { 
  headline: string;
  subtext: string;
  discountType: string;
  discountValue: number;
  code: string;
  verticals: VerticalItem[];
  qrCodeUrl: string;
  heroImage: string;
  palette: typeof COLOR_PALETTES[0];
  location: string;
  segmentBadge?: string;
  segmentTagline?: string;
}) {
  const dv = Number(discountValue);
  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none flex flex-col mx-auto overflow-hidden relative border border-slate-200 print:border-none">
      {/* Top Accent Strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${palette.topBarGradient}`} />

      {/* Header: Logo with explicit WHAT WE DO descriptor + Swiss Trust & Website */}
      <div className="px-10 pt-7 pb-4 flex items-center justify-between border-b border-slate-100 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl tracking-[0.25em] font-normal text-[#0f172a]" style={{ fontFamily: "'Playfair Display', serif" }}>
              M<span style={{ color: palette.accent }}>O</span>NDAR
            </h1>
            <span className="text-xs text-[#d4af37]">✨</span>
          </div>
          <p className="text-slate-500 text-[10px] tracking-[0.25em] uppercase font-bold mt-0.5">
            {segmentTagline || "Premium Cleaning Services"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1 shadow-2xs">
            <span className="text-xs">🇨🇭</span>
            <span className="text-[10px] text-slate-800 font-bold tracking-wider uppercase">
              Vetted & Insured · {location || "Zürich"}
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-slate-400 tracking-wider">
            mondar.ch
          </span>
        </div>
      </div>

      {/* Hero Visual Section ("This fits me") with Contrast Scrim & Category Badges */}
      <div className="px-10 pt-5">
        <div 
          className="relative rounded-2xl overflow-hidden border-2 shadow-sm" 
          style={{ height: "230px", borderColor: palette.accent }}
        >
          <img
            src={heroImage}
            alt="Luxury interior"
            className="w-full h-full object-cover"
          />
          {/* Heavy gradient scrim to ensure text legibility regardless of image brightness */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />
          
          {/* Top Right: Swiss Standard Tag */}
          <div className="absolute top-3.5 right-4">
            <span className="bg-black/85 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-md">
              🇨🇭 {location || "Zürich"} Bespoke
            </span>
          </div>

          {/* Bottom Left: Segment Cluster Badge */}
          <div className="absolute bottom-3.5 left-4 bg-black/85 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 shadow-xl max-w-[280px]">
            <p className="text-[10px] uppercase tracking-widest font-extrabold" style={{ color: palette.badgeText }}>
              {segmentBadge || "BESPOKE MATCHING"}
            </p>
            <p className="text-xs font-serif font-medium text-white tracking-wide mt-0.5 truncate">
              {verticals.map(v => v.label).slice(0, 4).join(" · ")}
            </p>
          </div>
        </div>
      </div>

      {/* Headline & 1-Liner USP Subtext */}
      <div className="px-10 py-4 text-center">
        <h2 className="text-2xl font-bold text-[#0f172a] tracking-tight leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          {headline || "Your Living Space. Impeccably Maintained."}
        </h2>
        <p className="text-slate-600 text-xs mt-1.5 max-w-xl mx-auto leading-relaxed">
          {subtext || "Matched, not dispatched. Most services send whoever is free. We place a vetted, insured professional chosen for your home — and keep them there."}
        </p>
      </div>

      {/* Specialised Services Badges */}
      <div className="px-10 py-1">
        <div className="border-t border-b border-slate-100 py-3">
          <p className="text-center text-[9px] text-[#94a3b8] tracking-[0.2em] uppercase font-bold mb-2.5">
            Specialised Verticals
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {verticals.map((s) => (
              <div key={s.id || s.label} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg shadow-2xs">
                <span className="text-sm">{s.icon}</span>
                <span className="text-[11px] text-slate-800 font-semibold tracking-wide">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Swiss Luxury Pillars (1-Liner Benefits) */}
      <div className="px-10 py-2">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { num: "01", title: "Vetted Professionals", desc: "Rigorous Swiss background checks, bonded & insured." },
            { num: "02", title: "Tailored Matching", desc: "Matched to your specific property and surface requirements." },
            { num: "03", title: "Guaranteed Delivery", desc: "5 business days advance notice ensures seamless fulfillment." },
          ].map((p) => (
            <div key={p.num} className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-2.5 text-left shadow-2xs">
              <span className="text-[10px] font-mono font-bold tracking-widest block mb-0.5" style={{ color: palette.accent }}>
                {p.num}
              </span>
              <p className="text-[11px] font-bold text-slate-900 tracking-tight leading-tight">{p.title}</p>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The Offer -> CTA (QR Code is the direct actionable CTA after Offer) */}
      <div className="mx-10 my-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
        <div 
          className="absolute left-0 top-0 bottom-0 w-1.5" 
          style={{ backgroundColor: palette.accent }} 
        />

        <div className="flex items-center justify-between gap-6 pl-2">
          {/* Left Column: The Promotional Offer & Details */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] tracking-[0.2em] uppercase font-extrabold text-slate-500">
                EXCLUSIVE INVITATION
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-[9px] font-bold text-slate-700">{location || "Zürich"}</span>
            </div>

            {/* Prominent Discount Announcement */}
            <div className="flex items-center gap-3">
              <div 
                className="px-3.5 py-1 rounded-lg text-white font-extrabold text-base shadow-sm"
                style={{ backgroundColor: palette.badgeBg, color: palette.badgeText, border: `1px solid ${palette.border}` }}
              >
                {discountLabel(discountType, dv)}
              </div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                On Your First Booking
              </span>
            </div>

            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
              <div 
                className="bg-white border-2 rounded-lg px-3 py-1 inline-flex items-center gap-1.5 shadow-2xs"
                style={{ borderColor: palette.accent }}
              >
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Promo Code:</span>
                <span className="font-mono font-extrabold text-xs text-slate-900 tracking-wider">{code}</span>
              </div>

              {/* Direct Clickable Booking Link for Web & Mobile */}
              <a
                href={`/book/${(verticals && verticals[0]?.id) || "home"}?promo=${code}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs hover:opacity-95 hover:scale-[1.02] active:scale-95"
                style={{ backgroundColor: palette.badgeBg, color: palette.badgeText, border: `1px solid ${palette.border}` }}
              >
                <span>Book Online</span>
                <span>→</span>
              </a>
            </div>

            <p className="text-[10px] text-slate-500 font-medium pt-0.5 flex items-center gap-1 leading-snug">
              <span>⏳</span>
              <span>5 business days advance notice for concierge matching (only while starting)</span>
            </p>
          </div>

          {/* Right Column: QR Code as CTA */}
          <div className="flex flex-col items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
            {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />}
            <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-800 mt-1">
              SCAN TO BOOK
            </span>
            <span className="text-[8px] font-mono text-slate-400">
              mondar.ch
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto px-10 py-3 border-t border-slate-100 text-center bg-slate-50/50">
        <p className="text-[9px] text-slate-400 tracking-widest uppercase font-medium">
          mondar.ch · Swiss Quality Guaranteed · Vetted & Insured Cleaning Partners · {location || "Zürich"}
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   THEME 2: MODERN — High-Fashion Swiss Concierge
   ──────────────────────────────────────────────────────── */
function ModernTheme({ 
  headline, 
  subtext, 
  discountType, 
  discountValue, 
  code, 
  verticals, 
  qrCodeUrl,
  heroImage,
  palette,
  location,
  segmentBadge,
  segmentTagline,
}: { 
  headline: string;
  subtext: string;
  discountType: string;
  discountValue: number;
  code: string;
  verticals: VerticalItem[];
  qrCodeUrl: string;
  heroImage: string;
  palette: typeof COLOR_PALETTES[0];
  location: string;
  segmentBadge?: string;
  segmentTagline?: string;
}) {
  const dv = Number(discountValue);
  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none flex flex-col mx-auto overflow-hidden border border-slate-200 print:border-none">
      {/* Top Accent Strip */}
      <div className="h-1 w-full" style={{ backgroundColor: palette.accent }} />

      {/* Modern Header */}
      <div className="px-10 pt-7 pb-4 flex items-center justify-between border-b border-slate-100 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl tracking-[0.3em] font-light text-[#0f172a]" style={{ fontFamily: "'Playfair Display', serif" }}>
              M<span style={{ color: palette.accent }}>O</span>NDAR
            </h1>
            <span className="text-xs text-[#d4af37]">✨</span>
          </div>
          <p className="text-slate-500 text-[10px] tracking-[0.3em] uppercase font-bold mt-0.5">
            {segmentTagline || "Premium Cleaning Services"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase">
              🇨🇭 {location || "Zürich"}
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-slate-400 tracking-wider">
            mondar.ch
          </span>
        </div>
      </div>

      {/* Hero Visual Banner */}
      <div className="px-10 pt-5">
        <div 
          className="relative rounded-2xl overflow-hidden border shadow-sm" 
          style={{ height: "220px", borderColor: palette.accent + "60" }}
        >
          <img 
            src={heroImage} 
            alt="Luxury interior" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

          {/* Floating Pill on Top Left */}
          <div className="absolute top-3.5 left-4">
            <span className="bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-md">
              🇨🇭 Vetted · Insured · Bonded
            </span>
          </div>

          {/* Bottom Left Badge */}
          <div className="absolute bottom-3.5 left-4 bg-black/80 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-white max-w-[280px]">
            <p className="text-[10px] uppercase tracking-widest font-extrabold" style={{ color: palette.accent }}>
              {segmentBadge || "PRIVATE RESIDENCES & ASSETS"}
            </p>
            <p className="text-xs font-serif text-slate-200 mt-0.5 truncate">
              {verticals.map(v => v.label).slice(0, 4).join(" · ")}
            </p>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="px-10 pt-4 pb-4 flex-1 flex flex-col justify-between">
        <div className="text-center">
          <h2 className="text-2xl font-light text-slate-900 leading-tight tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {headline || "Your Living Space. Impeccably Maintained."}
          </h2>
          <p className="text-slate-600 text-xs mt-1.5 max-w-xl mx-auto leading-relaxed">
            {subtext || "Matched, not dispatched. Most services send whoever is free. We place a vetted, insured professional chosen for your home — and keep them there."}
          </p>
        </div>

        {/* 3 Luxury Pillars */}
        <div className="grid grid-cols-3 gap-2.5 my-2">
          {[
            { num: "01", title: "Discreet Concierge", desc: "Tailored matching for your exact property specifications." },
            { num: "02", title: "Vetted Professionals", desc: "Rigorous background checks, bonded & insured in Switzerland." },
            { num: "03", title: "Flawless Execution", desc: "High-spec cleaning for sensitive surfaces & fine materials." },
          ].map((p) => (
            <div key={p.num} className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-left shadow-2xs relative">
              <span className="text-[10px] font-mono font-bold tracking-widest block mb-0.5" style={{ color: palette.accent }}>
                {p.num}
              </span>
              <p className="text-xs font-bold text-slate-900 tracking-tight">{p.title}</p>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Service Verticals Badges */}
        <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-2">
          <div className="flex flex-wrap justify-center gap-1.5">
            {verticals.map((s) => (
              <span key={s.id || s.label} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-700 shadow-2xs">
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Swiss Luxury Voucher & QR Card: Offer first, QR CTA next */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden my-1">
          <div 
            className="absolute left-0 top-0 bottom-0 w-1.5" 
            style={{ backgroundColor: palette.accent }} 
          />

          <div className="flex items-center justify-between gap-5 pl-2">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-slate-500">
                  SPECIAL INTRODUCTORY OFFER
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-[9px] font-bold text-slate-700">{location || "Zürich"}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <div 
                  className="px-3 py-1 rounded-lg font-black text-sm shadow-sm text-slate-900 border"
                  style={{ backgroundColor: palette.accent, borderColor: palette.border }}
                >
                  {discountLabel(discountType, dv)}
                </div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                  First Clean Voucher
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                <div 
                  className="bg-white border-2 rounded-lg px-3 py-1 inline-flex items-center gap-1.5 shadow-2xs"
                  style={{ borderColor: palette.accent }}
                >
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Promo Code:</span>
                  <span className="font-mono font-extrabold text-xs text-slate-900 tracking-wider">{code}</span>
                </div>

                <a
                  href={`/book/${(verticals && verticals[0]?.id) || "home"}?promo=${code}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs hover:opacity-95 hover:scale-[1.02] active:scale-95"
                  style={{ backgroundColor: palette.badgeBg, color: palette.badgeText, border: `1px solid ${palette.border}` }}
                >
                  <span>Book Online</span>
                  <span>→</span>
                </a>
              </div>

              <p className="text-[9px] text-slate-500 font-medium pt-0.5 flex items-center gap-1 leading-tight">
                <span>⏳</span>
                <span>5 business days advance notice for tailored matching (only while starting)</span>
              </p>
            </div>

            {/* QR CTA */}
            <div className="flex flex-col items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex-shrink-0">
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-22 h-22" />}
              <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-900 mt-1">
                SCAN TO BOOK
              </span>
              <span className="text-[8px] font-mono text-slate-400">mondar.ch</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-2.5 flex justify-between text-[9px] text-slate-400 uppercase tracking-wider">
          <span>🇨🇭 {location || "Zürich"}</span>
          <span>🛡️ Vetted & Insured</span>
          <span>mondar.ch</span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   THEME 3: MINIMAL — Clean Swiss Typographic Grid
   ──────────────────────────────────────────────────────── */
function MinimalTheme({ 
  headline, 
  subtext, 
  discountType, 
  discountValue, 
  code, 
  verticals, 
  qrCodeUrl, 
  heroImage,
  palette,
  location,
  segmentBadge,
  segmentTagline,
}: { 
  headline: string;
  subtext: string;
  discountType: string;
  discountValue: number;
  code: string;
  verticals: VerticalItem[];
  qrCodeUrl: string;
  heroImage: string;
  palette: typeof COLOR_PALETTES[0];
  location: string;
  segmentBadge?: string;
  segmentTagline?: string;
}) {
  const dv = Number(discountValue);
  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none p-10 flex flex-col mx-auto border border-slate-200 print:border-none">
      <div className="flex justify-between items-center border-b-2 pb-4 mb-5" style={{ borderColor: palette.accent }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-[0.2em]" style={{ fontFamily: "'Playfair Display', serif" }}>
              M<span style={{ color: palette.accent }}>O</span>NDAR
            </h1>
            <span className="text-xs text-[#d4af37]">✨</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mt-0.5">
            {segmentTagline || "Premium Cleaning Services"}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono tracking-widest text-slate-800 uppercase font-bold block">
            🇨🇭 {location || "Zürich"}
          </span>
          <span className="text-[10px] font-mono text-slate-400">mondar.ch</span>
        </div>
      </div>

      {/* Optional Photo Thumbnail */}
      {heroImage && (
        <div className="w-full h-36 rounded-xl overflow-hidden mb-5 border border-slate-200 relative">
          <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute bottom-2 left-3 bg-black/80 px-2.5 py-0.5 rounded text-[9px] text-white uppercase tracking-wider font-bold">
            {segmentBadge || "SWISS BESPOKE CLEANING"}
          </div>
        </div>
      )}

      <div className="mb-4">
        <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold block mb-1">Special Voucher Offer</span>
        <h2 className="text-4xl font-extrabold tracking-tight leading-none" style={{ color: palette.primary }}>
          {discountLabel(discountType, dv)}
        </h2>
        <h3 className="text-lg font-light text-slate-800 mt-1.5">
          {headline || "Your Living Space. Impeccably Maintained."}
        </h3>
      </div>

      <div className="mb-4 max-w-lg">
        <p className="text-slate-600 text-xs leading-relaxed">
          {subtext || "Matched, not dispatched. Most services send whoever is free. We place a vetted, insured professional chosen for your home — and keep them there."}
        </p>
      </div>

      {/* Verticals Tags */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {verticals.map((s) => (
          <span key={s.id || s.label} className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-xs text-slate-800 font-medium">
            {s.icon} {s.label}
          </span>
        ))}
      </div>

      {/* Offer -> CTA QR */}
      <div className="flex items-center justify-between gap-6 mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 relative overflow-hidden">
        <div 
          className="absolute left-0 top-0 bottom-0 w-1.5" 
          style={{ backgroundColor: palette.accent }} 
        />
        <div className="space-y-1.5 flex-1 min-w-0 pl-2">
          <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500">
            Concierge Booking · {location || "Zürich"}
          </p>
          <div className="flex items-center gap-2 pt-0.5 flex-wrap">
            <div 
              className="bg-white border-2 rounded-md px-3 py-1 inline-flex items-center gap-2"
              style={{ borderColor: palette.accent }}
            >
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Promo Code:</span>
              <span className="font-mono font-bold text-xs text-slate-900">{code}</span>
            </div>

            <a
              href={`/book/${(verticals && verticals[0]?.id) || "home"}?promo=${code}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all shadow-2xs hover:opacity-95 hover:scale-[1.02] active:scale-95"
              style={{ backgroundColor: palette.badgeBg, color: palette.badgeText, border: `1px solid ${palette.border}` }}
            >
              <span>Book Online</span>
              <span>→</span>
            </a>
          </div>
          <p className="text-[10px] text-slate-500 font-medium pt-0.5 flex items-center gap-1">
            <span>⏳</span>
            <span>5 business days advance notice for concierge matching (only while starting)</span>
          </p>
        </div>

        <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex-shrink-0">
          {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-22 h-22" />}
          <span className="text-[8px] uppercase tracking-widest font-bold text-slate-900 mt-0.5">SCAN TO BOOK</span>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-200 text-xs text-slate-400 flex justify-between">
        <span>mondar.ch · Swiss Quality Guaranteed</span>
        <span>Fully Insured · {location || "Zürich"}</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   THEME 4: BESPOKE RAW HTML RENDERER
   ──────────────────────────────────────────────────────── */
function BespokeHtmlTheme({ 
  customHtml, 
  variables 
}: { 
  customHtml: string;
  variables: Record<string, string>;
}) {
  const renderedHtml = useMemo(() => {
    let output = customHtml || "";
    Object.entries(variables).forEach(([key, val]) => {
      const reg = new RegExp(`{{${key}}}`, "g");
      output = output.replace(reg, val || "");
    });
    return output;
  }, [customHtml, variables]);

  return (
    <div 
      className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none mx-auto overflow-hidden"
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

/* ────────────────────────────────────────────────────────
   STARTER HTML TEMPLATES (Award-Winning Swiss Editorial)
   ──────────────────────────────────────────────────────── */
const STARTER_CLASSIC_HTML = `
<div class="w-full min-h-[297mm] bg-white flex flex-col justify-between text-slate-900 font-sans border border-slate-200">
  <div class="h-1.5 w-full bg-gradient-to-r from-[#d4af37] via-[#fef3c7] to-[#d4af37]"></div>
  
  <div class="px-10 pt-7 pb-4 flex items-center justify-between border-b border-slate-100">
    <div>
      <div class="flex items-center gap-2">
        <h1 class="text-3xl tracking-[0.25em] font-normal text-[#0f172a] font-serif">M<span class="text-[#d4af37]">O</span>NDAR</h1>
        <span class="text-xs text-[#d4af37]">✨</span>
      </div>
      <p class="text-slate-500 text-[10px] tracking-[0.25em] uppercase font-bold mt-0.5">{{segmentTagline}}</p>
    </div>
    <div class="flex flex-col items-end gap-1">
      <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1 shadow-xs">
        <span class="text-xs">🇨🇭</span>
        <span class="text-[10px] text-slate-800 font-bold tracking-wider uppercase">Swiss Vetted & Insured · {{location}}</span>
      </div>
      <span class="text-[10px] font-mono font-semibold text-slate-400">mondar.ch</span>
    </div>
  </div>

  <div class="px-10 pt-5">
    <div class="relative rounded-2xl overflow-hidden border-2 border-[#d4af37]/60 shadow-sm" style="height: 230px;">
      <img src="{{heroImage}}" alt="Luxury interior" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20"></div>
      <div class="absolute top-3.5 right-4">
        <span class="bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-md">
          🇨🇭 {{location}} Bespoke
        </span>
      </div>
      <div class="absolute bottom-3.5 left-4 bg-black/85 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 shadow-xl max-w-[280px]">
        <p class="text-[10px] uppercase tracking-widest font-extrabold text-[#d4af37]">{{segmentBadge}}</p>
        <p class="text-xs font-serif font-medium text-white tracking-wide mt-0.5">Tailored Matching Service</p>
      </div>
    </div>
  </div>

  <div class="px-10 py-4 text-center">
    <h2 class="text-2xl font-bold text-[#0f172a] tracking-tight leading-tight font-serif">{{headline}}</h2>
    <p class="text-slate-600 text-xs mt-1.5 max-w-xl mx-auto leading-relaxed">{{subtext}}</p>
  </div>

  <div class="px-10 py-1">
    <div class="border-t border-b border-slate-100 py-3">
      <p class="text-center text-[9px] text-[#94a3b8] tracking-[0.2em] uppercase font-bold mb-2.5">Specialised Verticals</p>
      <div class="flex justify-center gap-3 flex-wrap">
        {{verticalsHtml}}
      </div>
    </div>
  </div>

  <div class="mx-10 my-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
    <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#d4af37]"></div>
    <div class="flex items-center justify-between gap-6 pl-2">
      <div class="space-y-1.5 flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="text-[9px] tracking-[0.2em] uppercase font-extrabold text-slate-500">EXCLUSIVE INVITATION</span>
          <span class="text-slate-300">·</span>
          <span class="text-[9px] font-bold text-slate-700">{{location}}</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-[#0f172a] text-[#d4af37] border border-[#d4af37] px-3.5 py-1 rounded-lg font-extrabold text-base">
            {{discount}}
          </div>
          <span class="text-xs font-bold text-slate-900 uppercase tracking-wide">First Clean Voucher</span>
        </div>
        <div class="flex items-center gap-2 pt-0.5">
          <div class="bg-white border-2 border-[#d4af37] rounded-lg px-3 py-0.5 inline-flex items-center gap-1.5 shadow-2xs">
            <span class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Promo Code:</span>
            <span class="font-mono font-extrabold text-xs text-slate-900 tracking-wider">{{code}}</span>
          </div>
        </div>
        <p class="text-[10px] text-slate-500 font-medium pt-0.5 flex items-center gap-1 leading-snug">
          <span>⏳</span>
          <span>5 business days advance notice for concierge matching (only while starting)</span>
        </p>
      </div>
      <div class="flex flex-col items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
        <img src="{{qrCode}}" alt="QR Code" class="w-24 h-24" />
        <span class="text-[8px] uppercase tracking-widest font-extrabold text-slate-800 mt-1">SCAN TO BOOK</span>
        <span class="text-[8px] font-mono text-slate-400">mondar.ch</span>
      </div>
    </div>
  </div>

  <div class="mt-auto px-10 py-3 border-t border-slate-100 text-center bg-slate-50/50">
    <p class="text-[9px] text-slate-400 tracking-widest uppercase font-medium">
      mondar.ch · Swiss Quality · Insured Partners · MONDAR · {{location}}
    </p>
  </div>
</div>
`.trim();

const STARTER_MODERN_HTML = `
<div class="w-full min-h-[297mm] bg-white flex flex-col justify-between text-slate-900 font-sans border border-slate-200">
  <div class="h-1 w-full bg-[#d4af37]"></div>
  <div class="px-10 pt-7 pb-4 flex items-center justify-between border-b border-slate-100 bg-white">
    <div>
      <div class="flex items-center gap-2">
        <h1 class="text-3xl tracking-[0.25em] font-normal text-[#0f172a] font-serif">M<span class="text-[#d4af37]">O</span>NDAR</h1>
        <span class="text-xs text-[#d4af37]">✨</span>
      </div>
      <p class="text-slate-500 text-[10px] tracking-[0.25em] uppercase font-bold mt-0.5">{{segmentTagline}}</p>
    </div>
    <div class="flex flex-col items-end gap-1">
      <div class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1 shadow-xs">
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span class="text-[10px] font-bold text-slate-800 tracking-wider uppercase">{{location}}</span>
      </div>
      <span class="text-[10px] font-mono text-slate-400">mondar.ch</span>
    </div>
  </div>

  <div class="px-10 pt-5">
    <div class="relative rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-sm" style="height: 220px;">
      <img src="{{heroImage}}" alt="Hero" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10"></div>
      <div class="absolute bottom-3.5 left-4">
        <span class="bg-black/85 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-md">
          🇨🇭 Vetted & Insured
        </span>
      </div>
    </div>
  </div>

  <div class="px-10 pt-4 pb-4 flex-1 flex flex-col justify-between space-y-3">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-slate-900 font-serif">{{headline}}</h2>
      <p class="text-slate-600 text-xs mt-1.5 max-w-xl mx-auto">{{subtext}}</p>
    </div>

    <div class="grid grid-cols-3 gap-2.5">
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
        <div class="w-7 h-7 rounded-full bg-white border border-[#d4af37] flex items-center justify-center mx-auto mb-1 text-xs">📱</div>
        <p class="text-[10px] font-bold text-slate-900 uppercase tracking-wider">1. Scan & Redeem</p>
        <p class="text-[9px] text-slate-500">Point phone at QR code</p>
      </div>
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
        <div class="w-7 h-7 rounded-full bg-white border border-[#d4af37] flex items-center justify-center mx-auto mb-1 text-xs">📅</div>
        <p class="text-[10px] font-bold text-slate-900 uppercase tracking-wider">2. Tailored Request</p>
        <p class="text-[9px] text-slate-500">5 business days notice</p>
      </div>
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
        <div class="w-7 h-7 rounded-full bg-white border border-[#d4af37] flex items-center justify-center mx-auto mb-1 text-xs">✨</div>
        <p class="text-[10px] font-bold text-slate-900 uppercase tracking-wider">3. Vetted Pro</p>
        <p class="text-[9px] text-slate-500">Insured specialist matched</p>
      </div>
    </div>

    <div class="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
      <div class="flex flex-wrap justify-center gap-2">
        {{verticalsHtml}}
      </div>
    </div>

    <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 relative overflow-hidden">
      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#d4af37]"></div>
      <div class="flex items-center justify-between gap-5 pl-1.5">
        <div class="space-y-1 flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="bg-[#d4af37] text-slate-900 font-extrabold px-3 py-1 rounded text-sm">{{discount}}</span>
            <span class="text-xs font-bold text-slate-900">FIRST BOOKING VOUCHER</span>
          </div>
          <div class="bg-white border-2 border-[#d4af37] rounded-lg px-3 py-0.5 inline-flex items-center gap-1.5 shadow-2xs">
            <span class="text-[10px] text-slate-500 font-semibold uppercase">Code:</span>
            <span class="font-mono font-bold text-xs text-slate-900">{{code}}</span>
          </div>
          <p class="text-[9px] text-slate-500 font-medium">⏳ 5 business days advance notice (only while starting)</p>
        </div>
        <div class="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex-shrink-0">
          <img src="{{qrCode}}" alt="QR Code" class="w-22 h-22" />
          <span class="text-[8px] font-bold text-slate-900 mt-1">SCAN TO BOOK</span>
        </div>
      </div>
    </div>

    <div class="border-t border-slate-100 pt-2 flex justify-between text-[9px] text-slate-400 uppercase tracking-wider">
      <span>🇨🇭 {{location}} Based</span>
      <span>🛡️ Fully Insured</span>
      <span>⭐ 5-Star Matching</span>
    </div>
  </div>
</div>
`.trim();

/* ── MAIN PAGE ── */
export default function PamphletPage() {
  const params = useParams();
  const router = useRouter();
  const id = ((params?.id || params?.code) as string) || "";

  const [isAdmin, setIsAdmin] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Segment Bucket
  const [selectedBucketId, setSelectedBucketId] = useState<SegmentBucketId>("residential");

  // Mode & Theme selection
  const [mode, setMode] = useState<Mode>("presets");
  const [presetTheme, setPresetTheme] = useState<PresetTheme>("classic");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<"visual" | "html">("visual");

  // Visual Customization: Image, Palette & Location
  const [heroImage, setHeroImage] = useState(HERO_IMAGE_PRESETS[0].url);
  const [paletteId, setPaletteId] = useState<ColorPaletteId>("gold");
  const [location, setLocation] = useState("Zürich");

  // Zoom / Viewport scale controls (Mobile & Print testing)
  const [canvasZoom, setCanvasZoom] = useState<number>(100);
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">("desktop");

  // Form State
  const [headline, setHeadline] = useState(SEGMENT_BUCKETS[0].defaultHeadline);
  const [subtext, setSubtext] = useState(SEGMENT_BUCKETS[0].defaultSubtext);
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(15);
  const [promoCode, setPromoCode] = useState("");
  const [selectedVerticals, setSelectedVerticals] = useState<VerticalItem[]>(SEGMENT_BUCKETS[0].verticals);
  const [allAvailableVerticals, setAllAvailableVerticals] = useState<VerticalItem[]>(PRESET_VERTICALS);
  const [newService, setNewService] = useState({ label: "", icon: "✨" });

  const [customHtml, setCustomHtml] = useState(STARTER_CLASSIC_HTML);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentBucket = useMemo(() => {
    return SEGMENT_BUCKETS.find(b => b.id === selectedBucketId) || SEGMENT_BUCKETS[0];
  }, [selectedBucketId]);

  const currentPalette = useMemo(() => {
    return COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];
  }, [paletteId]);

  // Apply Segment Bucket Preset helper
  const applySegmentBucket = (bucketId: SegmentBucketId) => {
    const bucket = SEGMENT_BUCKETS.find(b => b.id === bucketId);
    if (!bucket) return;
    setSelectedBucketId(bucketId);
    setSelectedVerticals(bucket.verticals);
    setHeadline(bucket.defaultHeadline);
    setSubtext(bucket.defaultSubtext);
    const imgPreset = HERO_IMAGE_PRESETS.find(p => p.id === bucket.defaultImageId);
    if (imgPreset) setHeroImage(imgPreset.url);
  };

  useEffect(() => {
    async function loadCampaign() {
      try {
        const auth = await isAdminAuthenticated();
        setIsAdmin(!!auth);

        let camp: any = null;
        
        try {
          const apiRes = await fetch(`/api/campaigns/${id}`, { cache: "no-store" });
          if (apiRes.ok) {
            const data = await apiRes.json();
            if (data.success && data.campaign) {
              camp = data.campaign;
            }
          }
        } catch (apiErr) {
          console.warn("API fetch failed, falling back to server action:", apiErr);
        }

        if (!camp) {
          const res = await getCampaign(id);
          if (res && res.success && res.campaign) {
            camp = res.campaign;
          }
        }

        if (camp) {
          setCampaign(camp);
          setHeadline(camp.pamphletHeadline || SEGMENT_BUCKETS[0].defaultHeadline);
          setSubtext(camp.pamphletSubtext || SEGMENT_BUCKETS[0].defaultSubtext);
          setDiscountType(camp.discountType || "percentage");
          setDiscountValue(camp.discountValue ? Number(camp.discountValue) : 15);
          setPromoCode(camp.code || "");
          
          if (camp.pamphletLocation) {
            setLocation(camp.pamphletLocation);
          }

          if (camp.pamphletTheme === "bespoke") {
            setMode("bespoke");
            setEditorTab("html");
          } else if (camp.pamphletTheme && ["classic", "modern", "minimal"].includes(camp.pamphletTheme)) {
            setPresetTheme(camp.pamphletTheme as PresetTheme);
            setMode("presets");
          }

          if (camp.pamphletImage) {
            setHeroImage(camp.pamphletImage);
          }

          if (camp.pamphletPalette && COLOR_PALETTES.some(p => p.id === camp.pamphletPalette)) {
            setPaletteId(camp.pamphletPalette as ColorPaletteId);
          }

          if (camp.pamphletHtml) {
            setCustomHtml(camp.pamphletHtml);
          }

          const parsed = parseVerticals(camp.pamphletVerticals);
          setSelectedVerticals(parsed);

          // Detect initial segment bucket based on verticals or campaign.vertical
          if (camp.vertical === "commercial" || camp.vertical === "restaurant" || parsed.some(v => v.id === "restaurant" || v.id === "commercial")) {
            setSelectedBucketId("commercial");
          } else if (camp.vertical === "aviation" || camp.vertical === "yacht" || parsed.some(v => v.id === "aviation" || v.id === "yacht")) {
            setSelectedBucketId("specialized");
          } else {
            setSelectedBucketId("residential");
          }

          const customItems = parsed.filter((p: any) => !PRESET_VERTICALS.some(preset => preset.id === p.id));
          if (customItems.length > 0) {
            setAllAvailableVerticals(prev => [...prev, ...customItems]);
          }

          // Build dynamic origin URL for QR code (works in dev, staging & production)
          const origin = typeof window !== "undefined" && window.location.origin
            ? window.location.origin
            : "https://mondar.ch";
          const qrUrl = `${origin}/r/${camp.code}`;

          const qrDataUrl = await QRCode.toDataURL(qrUrl, {
            width: 320,
            margin: 2,
            color: { dark: "#0f172a", light: "#ffffff" },
          });
          setQrCodeUrl(qrDataUrl);
        } else {
          setError("Campaign not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load campaign");
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadCampaign();
    } else {
      setLoading(false);
    }
  }, [id, router]);

  const toggleVertical = (item: VerticalItem) => {
    setSelectedVerticals(prev => {
      const exists = prev.some(p => p.id === item.id);
      return exists ? prev.filter(p => p.id !== item.id) : [...prev, item];
    });
  };

  const handleAddCustomVertical = () => {
    if (!newService.label.trim()) return;
    const customId = "custom-" + Date.now();
    const item: VerticalItem = {
      id: customId,
      label: newService.label.trim(),
      icon: newService.icon.trim() || "✨",
    };
    setAllAvailableVerticals(prev => [...prev, item]);
    setSelectedVerticals(prev => [...prev, item]);
    setNewService({ label: "", icon: "✨" });
  };

  const handleSaveToCampaign = async () => {
    setIsSaving(true);
    try {
      const payload = {
        pamphletHeadline: headline,
        pamphletSubtext: subtext,
        pamphletVerticals: JSON.stringify(selectedVerticals),
        pamphletHtml: customHtml,
        pamphletTheme: mode === "bespoke" || editorTab === "html" ? "bespoke" : presetTheme,
        pamphletImage: heroImage,
        pamphletPalette: paletteId,
        pamphletLocation: location,
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
      }

      if (saved) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Variables for custom HTML replacement
  const variables = useMemo(() => {
    const dv = Number(discountValue);
    const dLabel = discountLabel(discountType, dv);
    const vHtml = selectedVerticals.map(v => `
      <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:11px;font-weight:600;color:#1e293b;">
        <span>${v.icon}</span> <span>${v.label}</span>
      </div>
    `).join("");

    const origin = typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://mondar.ch";

    return {
      code: promoCode,
      qrCode: qrCodeUrl,
      headline,
      subtext,
      discount: dLabel,
      verticalsHtml: vHtml,
      heroImage,
      location,
      segmentBadge: currentBucket.badge,
      segmentTagline: currentBucket.tagline,
      url: `${origin}/r/${promoCode}`,
    };
  }, [promoCode, qrCodeUrl, headline, subtext, discountType, discountValue, selectedVerticals, heroImage, location, currentBucket]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-800 rounded-full" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <p className="text-red-600 mb-4">{error || "Campaign not found"}</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { background-color: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-hide { display: none !important; }
        }
      `}} />

      {/* ── TOP NAVIGATION BAR (Admin Toolbar vs Public Visitor Header) ── */}
      {isAdmin ? (
        <div className="print-hide fixed top-4 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
          <div className="bg-[#0f172a] text-white shadow-2xl rounded-full px-4 py-2 flex items-center gap-2.5 pointer-events-auto border border-slate-700 max-w-[98vw] overflow-x-auto">
            
            <button
              onClick={() => router.push(`/admin/marketing/${id}`)}
              className="flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="w-px h-5 bg-slate-700 shrink-0" />

            {/* MODE & THEME SELECTOR */}
            {mode === "presets" ? (
              <>
                {/* Presets Theme Pills */}
                <div className="flex items-center gap-1 shrink-0">
                  {(["classic", "modern", "minimal"] as PresetTheme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setPresetTheme(t);
                        if (t === "classic") setCustomHtml(STARTER_CLASSIC_HTML);
                        if (t === "modern") setCustomHtml(STARTER_MODERN_HTML);
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-full capitalize transition-all ${
                        presetTheme === t
                          ? "bg-[#d4af37] text-black shadow-sm font-bold"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-1.5 ml-1 border-l border-slate-700 pl-2 shrink-0">
                  {COLOR_PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      onClick={() => setPaletteId(pal.id)}
                      title={pal.name}
                      className={`w-4 h-4 rounded-full border transition-all ${
                        paletteId === pal.id ? "scale-125 ring-2 ring-white" : "opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: pal.accent, borderColor: pal.border }}
                    />
                  ))}
                </div>

                {/* Location Badge */}
                <div className="hidden sm:flex items-center gap-1 ml-1 border-l border-slate-700 pl-2 text-xs text-slate-300 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span className="font-semibold text-white truncate max-w-[90px]">{location}</span>
                </div>

                {/* Switch to Full Bespoke Mode */}
                <button
                  onClick={() => {
                    setMode("bespoke");
                    setIsEditorOpen(true);
                    setEditorTab("html");
                  }}
                  className="hidden md:flex items-center gap-1 text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2.5 py-1 rounded-full border border-amber-500/40 transition-all shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" /> HTML Mode
                </button>
              </>
            ) : (
              /* BESPOKE ACTIVE */
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#d4af37] bg-[#d4af37]/10 px-3 py-1 rounded-full border border-[#d4af37]/30">
                  <Sparkles className="w-3.5 h-3.5" /> Bespoke Mode
                </span>

                <button
                  onClick={() => setMode("presets")}
                  className="text-xs text-slate-300 hover:text-white underline px-2 transition-colors"
                >
                  Standard Presets
                </button>
              </div>
            )}

            <div className="w-px h-5 bg-slate-700 shrink-0" />

            {/* Viewport & Zoom controls */}
            <div className="hidden lg:flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  setViewportMode("desktop");
                  setCanvasZoom(100);
                }}
                title="Full A4 View"
                className={`p-1.5 rounded-lg text-xs ${viewportMode === "desktop" ? "bg-slate-800 text-[#d4af37]" : "text-slate-400 hover:text-white"}`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setViewportMode("mobile");
                  setCanvasZoom(65);
                }}
                title="Mobile Preview Fit"
                className={`p-1.5 rounded-lg text-xs ${viewportMode === "mobile" ? "bg-slate-800 text-[#d4af37]" : "text-slate-400 hover:text-white"}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-px h-5 bg-slate-700 shrink-0" />

            {/* Customizer Drawer Toggle */}
            <button
              onClick={() => setIsEditorOpen(!isEditorOpen)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all shrink-0 ${
                isEditorOpen ? "bg-[#d4af37] text-black" : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
            >
              {editorTab === "html" ? <Code2 className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>{isEditorOpen ? "Close" : "Customize"}</span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveToCampaign}
              disabled={isSaving}
              className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 transition-colors shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save"}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 text-xs font-bold bg-white text-black px-3 py-1 rounded-full hover:bg-slate-200 transition-colors shadow-sm shrink-0"
            >
              <Printer className="w-3.5 h-3.5" /> Print A4
            </button>
          </div>
        </div>
      ) : (
        /* PUBLIC VISITOR LUXURY HEADER */
        <div className="print-hide fixed top-3 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
          <div className="bg-[#0f172a]/95 backdrop-blur-md text-white shadow-2xl rounded-full px-5 py-2 flex items-center justify-between gap-4 pointer-events-auto border border-slate-700 max-w-xl w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs font-serif font-bold tracking-widest text-[#d4af37]">MONDAR ✨</span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-xs text-slate-300 font-medium">{location} Client Invitation</span>
            </div>
            <a
              href={`/book/${(selectedVerticals && selectedVerticals[0]?.id) || "home"}?promo=${promoCode}`}
              className="text-xs font-bold bg-[#d4af37] hover:bg-amber-400 text-black px-4 py-1.5 rounded-full transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <span>Book Online</span>
              <span>→</span>
            </a>
          </div>
        </div>
      )}

      {/* ── CANVAS CONTAINER (Responsive scaling & zoom) ── */}
      <div className="min-h-screen bg-slate-200 flex justify-center items-start pt-20 pb-16 px-2 sm:px-4 print:p-0 print:bg-white overflow-x-auto">
        
        {/* Flyer Canvas Wrapper */}
        <div 
          className="transition-transform duration-200 origin-top flex justify-center"
          style={{ 
            transform: canvasZoom !== 100 ? `scale(${canvasZoom / 100})` : undefined,
            marginBottom: canvasZoom < 100 ? `-${(100 - canvasZoom) * 4}px` : undefined,
          }}
        >
          {(mode === "bespoke" || editorTab === "html") ? (
            <BespokeHtmlTheme 
              customHtml={customHtml} 
              variables={variables} 
            />
          ) : (
            <>
              {presetTheme === "classic" && (
                <ClassicTheme 
                  headline={headline} 
                  subtext={subtext} 
                  discountType={discountType} 
                  discountValue={discountValue} 
                  code={promoCode} 
                  verticals={selectedVerticals} 
                  qrCodeUrl={qrCodeUrl}
                  heroImage={heroImage}
                  palette={currentPalette}
                  location={location}
                  segmentBadge={currentBucket.badge}
                  segmentTagline={currentBucket.tagline}
                />
              )}

              {presetTheme === "modern" && (
                <ModernTheme 
                  headline={headline} 
                  subtext={subtext} 
                  discountType={discountType} 
                  discountValue={discountValue} 
                  code={promoCode} 
                  verticals={selectedVerticals} 
                  qrCodeUrl={qrCodeUrl}
                  heroImage={heroImage}
                  palette={currentPalette}
                  location={location}
                  segmentBadge={currentBucket.badge}
                  segmentTagline={currentBucket.tagline}
                />
              )}

              {presetTheme === "minimal" && (
                <MinimalTheme 
                  headline={headline} 
                  subtext={subtext} 
                  discountType={discountType} 
                  discountValue={discountValue} 
                  code={promoCode} 
                  verticals={selectedVerticals} 
                  qrCodeUrl={qrCodeUrl}
                  heroImage={heroImage}
                  palette={currentPalette}
                  location={location}
                  segmentBadge={currentBucket.badge}
                  segmentTagline={currentBucket.tagline}
                />
              )}
            </>
          )}
        </div>

        {/* ── LIVE CUSTOMIZER DRAWER ── */}
        {isEditorOpen && (
          <div className="print-hide fixed top-16 right-2 sm:right-4 bottom-4 w-[430px] max-w-[94vw] bg-[#0f172a] text-white rounded-2xl shadow-2xl border border-slate-700 z-50 flex flex-col overflow-hidden animate-in slide-in-from-right">
            
            {/* Drawer Header */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-[#d4af37] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Flyer Blueprint Customizer
              </span>
              <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB SWITCHER */}
            <div className="flex border-b border-slate-800 p-1.5 bg-slate-950/60 gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditorTab("visual");
                  if (mode === "bespoke") setMode("presets");
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  editorTab === "visual" && mode !== "bespoke"
                    ? "bg-[#d4af37] text-black shadow-md" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Layout className="w-3.5 h-3.5" /> Visual Blueprint
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditorTab("html");
                  setMode("bespoke");
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  editorTab === "html" || mode === "bespoke"
                    ? "bg-[#d4af37] text-black shadow-md" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" /> Raw HTML Editor
              </button>
            </div>

            {/* TAB 1: VISUAL CONTROLS */}
            {editorTab === "visual" && mode !== "bespoke" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                
                {/* 0. STRATEGIC SEGMENT BUCKETS */}
                <div className="space-y-2 bg-slate-900/90 p-3 rounded-xl border border-[#d4af37]/40 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold uppercase tracking-wider text-[#d4af37] block">
                      Target Segment Bucket
                    </span>
                    <span className="text-[9px] text-slate-400">Select cluster</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {SEGMENT_BUCKETS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => applySegmentBucket(b.id)}
                        className={`p-2 rounded-lg border text-left flex items-start justify-between transition-all ${
                          selectedBucketId === b.id
                            ? "border-[#d4af37] bg-[#d4af37]/20 text-white font-bold"
                            : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700"
                        }`}
                      >
                        <div>
                          <div className="text-xs text-white">{b.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">{b.badge}</div>
                        </div>
                        {selectedBucketId === b.id && (
                          <Check className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. Theme Style Selector */}
                <div className="space-y-2 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold uppercase tracking-wider text-slate-300 block">
                    1. Layout Theme ({presetTheme})
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "classic" as PresetTheme, label: "Classic", desc: "Swiss Luxury" },
                      { id: "modern" as PresetTheme, label: "Modern", desc: "3-Step Flow" },
                      { id: "minimal" as PresetTheme, label: "Minimal", desc: "Bold Swiss Type" },
                    ].map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setPresetTheme(th.id)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          presetTheme === th.id
                            ? "border-[#d4af37] bg-[#d4af37]/20 text-white font-bold"
                            : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                        }`}
                      >
                        <div className="text-xs">{th.label}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{th.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Color Palette Selector */}
                <div className="space-y-2 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold uppercase tracking-wider text-slate-300 block">
                    2. Swiss Luxury Palette ({currentPalette.name})
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {COLOR_PALETTES.map((pal) => (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => setPaletteId(pal.id)}
                        className={`p-1.5 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                          paletteId === pal.id
                            ? "border-white bg-slate-800 ring-2 ring-[#d4af37]"
                            : "border-slate-800 bg-slate-950 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: pal.accent, borderColor: pal.border }} />
                        <span className="text-[9px] truncate w-full text-center text-slate-300">{pal.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Location & Canton */}
                <div className="space-y-2 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#d4af37]" /> 3. Target City / Region ({location})
                    </span>
                    <span className="text-[10px] text-slate-400">Select or type</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {LOCATION_PRESETS.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setLocation(loc)}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all ${
                          location === loc
                            ? "border-[#d4af37] bg-[#d4af37] text-black shadow-xs font-bold"
                            : "border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700"
                        }`}
                      >
                        🇨🇭 {loc}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1.5 border-t border-slate-800">
                    <label className="block text-[10px] text-slate-400 mb-1">Custom Location Name:</label>
                    <input
                      type="text"
                      placeholder="e.g. Zürich, Seefeld, Zug, Engadin..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                {/* 4. Curated Hero Image */}
                <div className="space-y-2 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase tracking-wider text-slate-300">
                      4. Curated Hero Imagery
                    </span>
                    <span className="text-[10px] text-slate-400">Fits your segment</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                    {HERO_IMAGE_PRESETS.map((img) => {
                      const isSelected = heroImage === img.url;
                      return (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setHeroImage(img.url)}
                          className={`group relative rounded-lg overflow-hidden border text-left transition-all ${
                            isSelected
                              ? "border-[#d4af37] ring-2 ring-[#d4af37]"
                              : "border-slate-800 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img src={img.url} alt={img.label} className="w-full h-12 object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-1">
                            <span className="text-[9px] font-semibold text-white truncate">{img.icon} {img.label}</span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-[#d4af37] text-black w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold">
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-[10px] text-slate-400 mb-1">Or paste custom image URL:</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={heroImage}
                      onChange={(e) => setHeroImage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                {/* 5. 1-Liner Headline & USP Offer */}
                <div className="space-y-3 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold uppercase tracking-wider text-slate-300 block">5. Headline & 1-Liner USP</span>
                  
                  <div>
                    <label className="block text-slate-400 mb-1">Headline (Punchy 1-Liner)</label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">USP Copy (5 business days notice - while starting)</label>
                    <textarea
                      rows={3}
                      value={subtext}
                      onChange={(e) => setSubtext(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Discount Value</label>
                      <input
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Promo Code</label>
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono uppercase focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Verticals */}
                <div className="space-y-3 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase tracking-wider text-slate-300">
                      6. Featured Verticals ({selectedVerticals.length})
                    </span>
                    <span className="text-[10px] text-slate-400">Toggle services</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-1">
                    {allAvailableVerticals.map((v) => {
                      const isSelected = selectedVerticals.some(s => s.id === v.id);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => toggleVertical(v)}
                          className={`flex items-center gap-1.5 p-2 rounded-lg border text-left transition-all ${
                            isSelected
                              ? "border-[#d4af37] bg-[#d4af37]/20 text-white font-semibold"
                              : "border-slate-800 bg-slate-950 text-slate-400 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <span>{v.icon}</span>
                          <span className="truncate">{v.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Add custom service */}
                  <div className="pt-2 border-t border-slate-800 flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Emoji"
                      value={newService.icon}
                      onChange={(e) => setNewService(p => ({ ...p, icon: e.target.value }))}
                      className="w-12 bg-slate-950 border border-slate-700 rounded-md px-1 py-1 text-center text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Add custom service..."
                      value={newService.label}
                      onChange={(e) => setNewService(p => ({ ...p, label: e.target.value }))}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomVertical}
                      className="bg-[#d4af37] hover:bg-[#b5952f] text-black px-2.5 py-1 rounded-md font-bold text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveToCampaign}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-[#d4af37] hover:bg-[#b5952f] text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : saveSuccess ? "Saved to Campaign!" : "Save Changes to Campaign"}
                </button>

              </div>
            )}

            {/* TAB 2: RAW HTML CODE EDITOR */}
            {(editorTab === "html" || mode === "bespoke") && (
              <div className="flex-1 flex flex-col p-3 space-y-2.5 overflow-hidden text-xs">
                
                {/* Template Loaders */}
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Load Template:</span>
                    <button
                      onClick={() => setCustomHtml(STARTER_CLASSIC_HTML)}
                      className="text-[#d4af37] hover:underline text-[10px] flex items-center gap-1"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Reset Starter
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCustomHtml(STARTER_CLASSIC_HTML)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 py-1 rounded border border-slate-700 font-medium"
                    >
                      Classic
                    </button>
                    <button
                      onClick={() => setCustomHtml(STARTER_MODERN_HTML)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 py-1 rounded border border-slate-700 font-medium"
                    >
                      Modern
                    </button>
                  </div>
                </div>

                {/* Quick Variable Tag Chips */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Click to insert placeholder tag:</span>
                  <div className="flex flex-wrap gap-1">
                    {["{{headline}}", "{{subtext}}", "{{discount}}", "{{code}}", "{{qrCode}}", "{{heroImage}}", "{{location}}", "{{verticalsHtml}}", "{{segmentBadge}}", "{{segmentTagline}}"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setCustomHtml(prev => prev + " " + tag)}
                        className="bg-slate-800 hover:bg-slate-700 text-[#d4af37] px-1.5 py-0.5 rounded font-mono text-[10px] border border-slate-700"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* HTML Code Editor Textarea */}
                <div className="flex-1 flex flex-col min-h-0">
                  <textarea
                    value={customHtml}
                    onChange={(e) => setCustomHtml(e.target.value)}
                    className="flex-1 w-full bg-[#050914] text-emerald-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-[#d4af37] resize-none leading-relaxed overflow-y-auto"
                    spellCheck={false}
                    placeholder="Type or paste custom HTML/CSS here..."
                  />
                </div>

                <button
                  onClick={handleSaveToCampaign}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-[#d4af37] hover:bg-[#b5952f] text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving Bespoke HTML..." : saveSuccess ? "Saved to Campaign!" : "Save Bespoke Flyer to Database"}
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </>
  );
}

