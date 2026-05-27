"use client";

import React, { useState, useEffect } from "react";
import { getPartnersList, togglePartnerStatus } from "@/app/actions/admin";
import { ShieldCheck, Mail, Phone, Users, ShieldAlert, BadgeAlert } from "lucide-react";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    const res = await getPartnersList();
    setLoading(false);
    if (res.success && res.partners) {
      setPartners(res.partners);
    } else {
      setError(res.error || "Failed to load partners");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (partnerId: string, status: string) => {
    setError("");
    setSuccessMsg("");
    const res = await togglePartnerStatus(partnerId, status);
    if (res.success) {
      setSuccessMsg("Partner subcontractor status updated");
      loadData();
    } else {
      setError(res.error || "Failed to toggle status");
    }
  };

  return (
    <div className="p-8 md:p-12 space-y-8 max-w-7xl w-full mx-auto">
      <header>
        <span className="text-caption text-accent uppercase tracking-widest block mb-2 font-semibold">Contracted Subcontractors</span>
        <h1 className="text-display-md font-display font-medium text-[#f2f2f2] tracking-tight">
          Subcontractor Management
        </h1>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md text-body-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-md text-body-sm flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" /> {successMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-[#a6a6a6] text-body-sm">
          Loading subcontractors from SQLite...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {partners.map((partner) => (
            <div key={partner.id} className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-body-md font-semibold text-[#f2f2f2]">{partner.name}</h3>
                    <span className="text-caption text-ink-subtle uppercase block mt-1">VAT: {partner.vatNumber || "N/A"}</span>
                  </div>
                  <span className={`text-caption uppercase px-2 py-1 rounded font-bold ${
                    partner.status === "active" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {partner.status}
                  </span>
                </div>

                <div className="space-y-2 text-body-sm text-[#a6a6a6]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-accent" />
                    <span>{partner.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-accent" />
                    <span>{partner.contactPhone}</span>
                  </div>
                  {partner.notes && (
                    <p className="text-body-xs italic border-l-2 border-[#262626] pl-3 mt-4 text-[#8c8c8c]">
                      {partner.notes}
                    </p>
                  )}
                </div>

                {partner.teams && partner.teams.length > 0 && (
                  <div className="pt-4 border-t border-[#262626] space-y-3">
                    <span className="text-caption text-accent uppercase font-semibold flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> CONTRACTED TEAMS ({partner.teams.length})
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {partner.teams.map((team: any) => (
                        <div key={team.id} className="bg-[#0d0d0d] p-3 border border-[#262626] rounded-md text-body-xs flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-[#f2f2f2] block">{team.name}</span>
                            <span className="text-[#a6a6a6] capitalize">Region: {team.region}</span>
                          </div>
                          <span className="text-caption text-accent font-semibold">Active Categories</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-[#262626] flex gap-3">
                <button
                  onClick={() => handleStatusChange(partner.id, "active")}
                  disabled={partner.status === "active"}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded text-body-xs transition-colors"
                >
                  ACTIVATE
                </button>
                <button
                  onClick={() => handleStatusChange(partner.id, "paused")}
                  disabled={partner.status === "paused"}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded text-body-xs transition-colors"
                >
                  PAUSE
                </button>
                <button
                  onClick={() => handleStatusChange(partner.id, "terminated")}
                  disabled={partner.status === "terminated"}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded text-body-xs transition-colors"
                >
                  TERMINATE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
