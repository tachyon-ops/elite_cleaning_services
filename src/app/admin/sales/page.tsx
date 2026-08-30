"use client";

import { TrendingUp } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function SalesPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f2f2f2] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-semibold">Sales & Leads</h1>
          <p className="text-[#a6a6a6] font-body mt-1">Pipeline management & outreach tools</p>
        </div>

        {/* Placeholder Content */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-[#262626] rounded-full flex items-center justify-center mb-6">
            <TrendingUp className="w-10 h-10 text-[#a6a6a6]" />
          </div>
          <h2 className="text-2xl font-display font-medium mb-3">Coming Soon</h2>
          <p className="text-[#a6a6a6] font-body max-w-md mx-auto leading-relaxed">
            Lead management, pipeline tracking, and outreach tools are planned for a future release.
          </p>
        </div>

      </div>
    </div>
  );
}
