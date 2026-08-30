"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Tag, BarChart2, Calendar, FileText, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { getCampaigns } from "@/app/actions/marketing";

export default function MarketingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await getCampaigns();
        if (res.success && res.campaigns) {
          setCampaigns(res.campaigns);
        }
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const getStatusColor = (campaign: any) => {
    if (!campaign.active) return "bg-red-500";
    if (campaign.validUntil && new Date(campaign.validUntil) < new Date()) return "bg-amber-500";
    return "bg-green-500";
  };

  const getStatusText = (campaign: any) => {
    if (!campaign.active) return "Inactive";
    if (campaign.validUntil && new Date(campaign.validUntil) < new Date()) return "Expired";
    return "Active";
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f2f2f2] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-semibold !text-white" style={{ color: "#ffffff" }}>Marketing Campaigns</h1>
            <p className="text-[#a6a6a6] font-body mt-1">QR codes, pamphlets & promo tracking</p>
          </div>
          <button
            onClick={() => router.push("/admin/marketing/new")}
            className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#b5952f] text-black px-4 py-2 rounded-md font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Campaign
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-[#a6a6a6]">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-[#262626] rounded-full flex items-center justify-center mb-4">
                <Tag className="w-8 h-8 text-[#a6a6a6]" />
              </div>
              <h3 className="text-xl font-display font-medium mb-2 !text-white" style={{ color: "#ffffff" }}>No campaigns yet</h3>
              <p className="text-[#a6a6a6] font-body max-w-md mx-auto mb-6">
                Create your first marketing campaign to generate QR codes, track pamphlets, and offer promotional discounts.
              </p>
              <button
                onClick={() => router.push("/admin/marketing/new")}
                className="flex items-center gap-2 bg-[#262626] hover:bg-[#333333] text-[#f2f2f2] px-4 py-2 rounded-md font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body">
                <thead className="bg-[#1a1a1a] border-b border-[#262626]">
                  <tr>
                    <th className="p-4 font-medium text-[#a6a6a6]">Name</th>
                    <th className="p-4 font-medium text-[#a6a6a6]">Code</th>
                    <th className="p-4 font-medium text-[#a6a6a6]">Discount</th>
                    <th className="p-4 font-medium text-[#a6a6a6]">Vertical</th>
                    <th className="p-4 font-medium text-[#a6a6a6]">Scans / Conv.</th>
                    <th className="p-4 font-medium text-[#a6a6a6]">Status</th>
                    <th className="p-4 font-medium text-[#a6a6a6]">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {campaigns.map((campaign) => (
                    <tr 
                      key={campaign.id} 
                      onClick={() => router.push(`/admin/marketing/${campaign.id}`)}
                      className="hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-medium">{campaign.name}</td>
                      <td className="p-4">
                        <span className="font-mono text-xs bg-[#262626] text-[#f2f2f2] px-2 py-1 rounded">
                          {campaign.code}
                        </span>
                      </td>
                      <td className="p-4">
                        {campaign.discountType === 'percentage' 
                          ? `${Number(campaign.discountValue)}%` 
                          : `CHF ${Number(campaign.discountValue).toFixed(2)}`}
                      </td>
                      <td className="p-4 capitalize text-[#a6a6a6]">
                        {campaign.vertical || 'All'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[#a6a6a6]">
                            <Search className="w-3 h-3" /> {campaign._count?.scans ?? 0}
                          </span>
                          <span className="flex items-center gap-1 text-[#a6a6a6]">
                            <BarChart2 className="w-3 h-3" /> {campaign._count?.bookings ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(campaign)}`}></span>
                          <span className="text-sm text-[#a6a6a6]">{getStatusText(campaign)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-[#a6a6a6] text-sm">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
