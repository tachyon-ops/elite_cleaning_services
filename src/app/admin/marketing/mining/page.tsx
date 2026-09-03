"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Eye,
  X,
  FileCheck,
  Tag,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  getMiningLeads,
  updateMiningLeadStatus,
  triggerMiningSync,
  convertLeadToDraftBooking,
  exportMiningLeadsCsv,
} from "@/app/actions/mining";

const CANTONS = [
  { code: "all", label: "All Cantons" },
  { code: "ZH", label: "ZH - Zürich" },
  { code: "ZG", label: "ZG - Zug" },
  { code: "BE", label: "BE - Bern" },
  { code: "LU", label: "LU - Luzern" },
  { code: "AG", label: "AG - Aargau" },
  { code: "BS", label: "BS - Basel-Stadt" },
  { code: "SG", label: "SG - St. Gallen" },
  { code: "GE", label: "GE - Geneva" },
  { code: "VD", label: "VD - Vaud" },
];

const STATUS_LIST = [
  { id: "all", label: "All Statuses" },
  { id: "new", label: "New", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { id: "qualified", label: "Qualified", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  { id: "contacted", label: "Contacted", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { id: "quoted", label: "Quoted", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { id: "won", label: "Won", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  { id: "dismissed", label: "Dismissed", color: "bg-neutral-800 text-neutral-400 border-neutral-700" },
];

export default function MarketingMiningPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [canton, setCanton] = useState("all");
  const [status, setStatus] = useState("all");
  const [subRubric, setSubRubric] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected lead for Master-Detail Drawer
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [converting, setConverting] = useState(false);

  // Sync Modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncCantons, setSyncCantons] = useState<string[]>(["ZH", "ZG", "BE", "LU"]);
  const [syncDaysBack, setSyncDaysBack] = useState(3);

  const fetchLeads = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMiningLeads({
        canton,
        status,
        subRubric,
        search,
        page,
        pageSize: 25,
      });

      if (res.success) {
        setLeads(res.leads || []);
        setStats(res.stats || {});
        setTotalPages(res.totalPages || 1);
        // keep selectedLead updated if open
        if (selectedLead) {
          const updated = (res.leads || []).find((l: any) => l.id === selectedLead.id);
          if (updated) setSelectedLead(updated);
        }
      } else {
        setError(res.error || "Failed to load leads");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [canton, status, subRubric, page]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleOpenLead = (lead: any) => {
    setSelectedLead(lead);
    setNotesInput(lead.contactNotes || "");
    setError("");
    setSuccessMsg("");
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const res = await updateMiningLeadStatus(leadId, newStatus);
      if (res.success && res.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
        if (selectedLead?.id === leadId) {
          setSelectedLead({ ...selectedLead, status: newStatus });
        }
        setSuccessMsg(`Status updated to ${newStatus}`);
      } else {
        setError(res.error || "Failed to update status");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      const res = await updateMiningLeadStatus(selectedLead.id, selectedLead.status, notesInput);
      if (res.success) {
        setSelectedLead({ ...selectedLead, contactNotes: notesInput });
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLead.id ? { ...l, contactNotes: notesInput } : l))
        );
        setSuccessMsg("Notes saved successfully");
      } else {
        setError(res.error || "Failed to save notes");
      }
    } catch (err: any) {
      setError(err.message || "Error saving notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleConvertToBooking = async () => {
    if (!selectedLead) return;
    setConverting(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await convertLeadToDraftBooking(selectedLead.id);
      if (res.success) {
        setSuccessMsg(`Booking draft #${res.bookingId.slice(0, 8)} created! Status set to Quoted.`);
        setSelectedLead({ ...selectedLead, status: "quoted", convertedBookingId: res.bookingId });
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id ? { ...l, status: "quoted", convertedBookingId: res.bookingId } : l
          )
        );
      } else {
        setError(res.error || "Failed to convert lead");
      }
    } catch (err: any) {
      setError(err.message || "Error converting lead");
    } finally {
      setConverting(false);
    }
  };

  const handleRunSync = async () => {
    setSyncing(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await triggerMiningSync({
        cantons: syncCantons,
        daysBack: syncDaysBack,
        subRubrics: ["HR02", "HR01"],
        maxPublications: 60,
      });

      if (res.success) {
        setSuccessMsg(res.message || "Synchronization completed successfully");
        setShowSyncModal(false);
        fetchLeads();
      } else {
        setError(res.error || "Sync failed");
      }
    } catch (err: any) {
      setError(err.message || "Error running sync");
    } finally {
      setSyncing(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await exportMiningLeadsCsv({ canton, status, subRubric });
      if (res.success && res.csv) {
        const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `shab_leads_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  const getPriorityBadge = (score: number) => {
    if (score >= 80) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {score} • High
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {score} • Medium
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
        {score} • Low
      </span>
    );
  };

  const getRubricBadge = (rubric?: string, changeType?: string) => {
    if (rubric === "HR02") {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Office Mover (HR02)
        </span>
      );
    }
    if (rubric === "HR01") {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          New Formation (HR01)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-800 text-neutral-300">
        {changeType || "Mutation"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f2f2f2] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 border-b border-[#262626] pb-4">
          <Link
            href="/admin/marketing"
            className="text-sm font-medium text-[#a6a6a6] hover:text-[#f2f2f2] transition-colors"
          >
            Campaigns & Pamphlets
          </Link>
          <span className="text-sm font-medium text-[#d4af37] border-b-2 border-[#d4af37] pb-4 -mb-4">
            Commercial Lead Mining (SHAB)
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-display font-semibold !text-white">Marketing Mining</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Swiss Register Intelligence
              </span>
            </div>
            <p className="text-[#a6a6a6] font-body mt-1">
              Mining Swiss Commercial Register (SHAB) publications for high-intent office relocations & new premises.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#262626] text-[#f2f2f2] px-3.5 py-2 rounded-md font-medium text-sm transition-colors border border-[#262626]"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => setShowSyncModal(true)}
              disabled={syncing}
              className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#b5952f] text-black px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing Register..." : "Sync Commercial Register"}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl">
            <span className="text-xs text-[#a6a6a6] uppercase tracking-wider block">Total Mined</span>
            <span className="text-2xl font-display font-semibold mt-1 block">
              {stats.totalAllTime ?? 0}
            </span>
            <span className="text-[11px] text-[#737373] mt-1 block">Commercial entities</span>
          </div>

          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl">
            <span className="text-xs text-amber-400 uppercase tracking-wider block">Office Movers</span>
            <span className="text-2xl font-display font-semibold mt-1 block text-amber-300">
              {stats.totalMovers ?? 0}
            </span>
            <span className="text-[11px] text-[#737373] mt-1 block">HR02 seat/domicile shifts</span>
          </div>

          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl">
            <span className="text-xs text-blue-400 uppercase tracking-wider block">New Formations</span>
            <span className="text-2xl font-display font-semibold mt-1 block text-blue-300">
              {stats.totalIncorporations ?? 0}
            </span>
            <span className="text-[11px] text-[#737373] mt-1 block">HR01 new setups</span>
          </div>

          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl">
            <span className="text-xs text-purple-400 uppercase tracking-wider block">In Outreach</span>
            <span className="text-2xl font-display font-semibold mt-1 block text-purple-300">
              {stats.inOutreach ?? 0}
            </span>
            <span className="text-[11px] text-[#737373] mt-1 block">Contacted or Quoted</span>
          </div>

          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl">
            <span className="text-xs text-green-400 uppercase tracking-wider block">Won / Converted</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-display font-semibold text-green-400">
                {stats.totalWon ?? 0}
              </span>
              <span className="text-xs text-[#a6a6a6]">({stats.conversionRate || "0%"})</span>
            </div>
            <span className="text-[11px] text-[#737373] mt-1 block">Closed contracts</span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl flex flex-wrap items-center gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, UID, town, or purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#262626] rounded-md pl-9 pr-3 py-2 text-sm text-[#f2f2f2] placeholder-[#737373] focus:outline-none focus:border-[#d4af37]"
            />
          </form>

          {/* Canton Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#a6a6a6]">Canton:</span>
            <select
              value={canton}
              onChange={(e) => {
                setCanton(e.target.value);
                setPage(1);
              }}
              className="bg-[#1a1a1a] border border-[#262626] rounded-md px-3 py-2 text-sm text-[#f2f2f2] focus:outline-none focus:border-[#d4af37]"
            >
              {CANTONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* SubRubric Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#a6a6a6]">Type:</span>
            <select
              value={subRubric}
              onChange={(e) => {
                setSubRubric(e.target.value);
                setPage(1);
              }}
              className="bg-[#1a1a1a] border border-[#262626] rounded-md px-3 py-2 text-sm text-[#f2f2f2] focus:outline-none focus:border-[#d4af37]"
            >
              <option value="all">All Events</option>
              <option value="HR02">Office Movers (HR02)</option>
              <option value="HR01">New Formations (HR01)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#a6a6a6]">Status:</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-[#1a1a1a] border border-[#262626] rounded-md px-3 py-2 text-sm text-[#f2f2f2] focus:outline-none focus:border-[#d4af37]"
            >
              {STATUS_LIST.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Master-Detail Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Table (2 cols) */}
          <div className="lg:col-span-2 bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-[#a6a6a6] flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" /> Loading mined leads...
              </div>
            ) : leads.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <Building2 className="w-12 h-12 text-[#404040] mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No commercial leads found</h3>
                <p className="text-sm text-[#a6a6a6] max-w-sm mb-6">
                  Try adjusting your search filters, or trigger a new sync from the Swiss Commercial Register.
                </p>
                <button
                  onClick={() => setShowSyncModal(true)}
                  className="flex items-center gap-2 bg-[#d4af37] text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-[#b5952f] transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Run First Sync
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body text-sm">
                  <thead className="bg-[#1a1a1a] border-b border-[#262626] text-[#a6a6a6]">
                    <tr>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Company & UID</th>
                      <th className="p-4">Event Type</th>
                      <th className="p-4">New Address</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {leads.map((lead) => {
                      const isSelected = selectedLead?.id === lead.id;
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => handleOpenLead(lead)}
                          className={`hover:bg-[#1a1a1a] transition-colors cursor-pointer ${
                            isSelected ? "bg-[#1c1c1c] border-l-2 border-l-[#d4af37]" : ""
                          }`}
                        >
                          <td className="p-4 whitespace-nowrap">
                            {getPriorityBadge(lead.priorityScore)}
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-[#f2f2f2]">{lead.companyName}</div>
                            <div className="text-xs font-mono text-[#737373]">
                              {lead.uid || "Pending UID"} • {lead.legalForm || "GmbH/AG"}
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            {getRubricBadge(lead.subRubric, lead.changeType)}
                          </td>
                          <td className="p-4 text-xs text-[#a6a6a6] max-w-[200px] truncate">
                            <div className="flex items-center gap-1 font-medium text-[#f2f2f2]">
                              <MapPin className="w-3 h-3 text-[#d4af37] shrink-0" />
                              {lead.newSeat || lead.canton}
                            </div>
                            <div className="truncate">{lead.newAddress || "Address in extract"}</div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                STATUS_LIST.find((s) => s.id === lead.status)?.color ||
                                "bg-neutral-800 text-neutral-400"
                              }`}
                            >
                              {STATUS_LIST.find((s) => s.id === lead.status)?.label || lead.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-[#737373] whitespace-nowrap">
                            {new Date(lead.publicationDate).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenLead(lead);
                              }}
                              className="p-1.5 hover:bg-[#262626] rounded text-[#a6a6a6] hover:text-[#f2f2f2] transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#262626] flex items-center justify-between text-xs text-[#a6a6a6]">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-[#1a1a1a] rounded hover:bg-[#262626] disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-[#1a1a1a] rounded hover:bg-[#262626] disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Master-Detail Drawer (1 col) */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 h-fit sticky top-8 space-y-6">
            {selectedLead ? (
              <>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#262626]">
                  <div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(selectedLead.priorityScore)}
                      <span className="text-xs text-[#737373]">
                        Pub: {new Date(selectedLead.publicationDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="text-xl font-display font-semibold mt-1 text-white">
                      {selectedLead.companyName}
                    </h2>
                    <div className="text-xs font-mono text-[#a6a6a6] mt-0.5">
                      {selectedLead.uid || "No UID"} • {selectedLead.canton} • {selectedLead.legalForm}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-1 hover:bg-[#262626] rounded text-[#a6a6a6] hover:text-[#f2f2f2]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Double Cleaning Hook: The Move Diff */}
                {selectedLead.subRubric === "HR02" && (
                  <div className="p-4 bg-[#1a1a1a] border border-[#333333] rounded-lg space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#d4af37] block">
                      Office Relocation Intelligence
                    </span>

                    {/* Former Location */}
                    <div className="text-xs">
                      <span className="text-[#a6a6a6] block">Former Address / Seat:</span>
                      <span className="text-red-300 font-medium block mt-0.5">
                        {selectedLead.oldAddress || "Listed in previous register extract"}
                      </span>
                      <span className="text-[11px] text-[#737373] italic">
                        → Target: Move-out handover cleaning (*Abnahmegarantie*)
                      </span>
                    </div>

                    <div className="border-t border-[#262626] my-2" />

                    {/* New Location */}
                    <div className="text-xs">
                      <span className="text-[#a6a6a6] block">New Office Address:</span>
                      <span className="text-emerald-300 font-medium block mt-0.5">
                        {selectedLead.newAddress || selectedLead.newSeat || "Zürich, Switzerland"}
                      </span>
                      <span className="text-[11px] text-[#737373] italic">
                        → Target: Pre-move-in deep clean & recurring commercial contract
                      </span>
                    </div>
                  </div>
                )}

                {/* Company Purpose */}
                {selectedLead.purpose && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#a6a6a6] block">
                      Registered Purpose (Zweck):
                    </span>
                    <p className="text-xs text-[#d1d1d1] bg-[#1a1a1a] p-3 rounded-md max-h-32 overflow-y-auto leading-relaxed border border-[#262626]">
                      {selectedLead.purpose}
                    </p>
                  </div>
                )}

                {/* Official SHAB Link */}
                <div>
                  <a
                    href={selectedLead.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#d4af37] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Official SHAB Publication
                  </a>
                </div>

                {/* CRM Status Changer */}
                <div className="space-y-2 pt-2 border-t border-[#262626]">
                  <label className="text-xs font-medium text-[#a6a6a6] block">Pipeline Status:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {STATUS_LIST.filter((s) => s.id !== "all").map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleStatusChange(selectedLead.id, s.id)}
                        className={`text-xs py-1.5 px-2 rounded font-medium transition-all ${
                          selectedLead.status === s.id
                            ? "bg-[#d4af37] text-black font-semibold"
                            : "bg-[#1a1a1a] text-[#a6a6a6] hover:bg-[#262626] hover:text-[#f2f2f2]"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Notes */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#a6a6a6] block">Outreach Notes:</label>
                  <textarea
                    rows={3}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Log calls, decision-maker email, or cleaning quotes sent..."
                    className="w-full bg-[#1a1a1a] border border-[#262626] rounded-md p-2.5 text-xs text-[#f2f2f2] focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="w-full bg-[#262626] hover:bg-[#333333] text-xs font-medium py-1.5 rounded transition-colors"
                  >
                    {savingNotes ? "Saving..." : "Save Notes"}
                  </button>
                </div>

                {/* Convert to Quote Action */}
                <div className="pt-4 border-t border-[#262626] space-y-2">
                  {selectedLead.convertedBookingId ? (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-xs text-green-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Converted to Booking
                      </span>
                      <Link
                        href="/admin/bookings"
                        className="text-[#d4af37] underline font-medium hover:text-[#e6c45e]"
                      >
                        View in Bookings
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={handleConvertToBooking}
                      disabled={converting}
                      className="w-full flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#b5952f] text-black font-semibold text-xs py-2.5 rounded-md transition-colors"
                    >
                      <Briefcase className="w-4 h-4" />
                      {converting ? "Creating Draft Booking..." : "Create Commercial Quote Draft"}
                    </button>
                  )}
                  <p className="text-[11px] text-[#737373] text-center">
                    Pre-fills a quote with company details, relocation address & notes.
                  </p>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-[#737373] space-y-3">
                <Briefcase className="w-10 h-10 mx-auto text-[#333333]" />
                <h3 className="text-sm font-medium text-[#a6a6a6]">No Lead Selected</h3>
                <p className="text-xs text-[#666666]">
                  Click on any row in the table to inspect the office relocation diff, official register extract, and initiate outreach.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sync Modal */}
        {showSyncModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-[#141414] border border-[#262626] rounded-xl max-w-md w-full p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-semibold text-white">
                  Sync Commercial Register (SHAB)
                </h3>
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="p-1 text-[#737373] hover:text-[#f2f2f2]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#a6a6a6]">
                Pull live commercial publications directly from the official Swiss Federal Gazette (shab.ch).
              </p>

              {/* Cantons */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#f2f2f2]">Target Cantons:</label>
                <div className="grid grid-cols-4 gap-2">
                  {["ZH", "ZG", "BE", "LU", "AG", "BS", "SG", "GE"].map((code) => {
                    const active = syncCantons.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          if (active) {
                            setSyncCantons(syncCantons.filter((c) => c !== code));
                          } else {
                            setSyncCantons([...syncCantons, code]);
                          }
                        }}
                        className={`text-xs py-1.5 rounded font-medium border transition-colors ${
                          active
                            ? "bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]"
                            : "bg-[#1a1a1a] text-[#a6a6a6] border-[#262626]"
                        }`}
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Days Back */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#f2f2f2]">Date Range:</label>
                <select
                  value={syncDaysBack}
                  onChange={(e) => setSyncDaysBack(Number(e.target.value))}
                  className="w-full bg-[#1a1a1a] border border-[#262626] rounded-md p-2 text-xs text-[#f2f2f2]"
                >
                  <option value={1}>Last 24 Hours</option>
                  <option value={3}>Last 3 Days (Recommended)</option>
                  <option value={7}>Last 7 Days</option>
                  <option value={14}>Last 14 Days</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowSyncModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#a6a6a6] hover:text-[#f2f2f2]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRunSync}
                  disabled={syncing || syncCantons.length === 0}
                  className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#b5952f] text-black px-4 py-2 rounded-md font-semibold text-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Synchronizing..." : "Start Ingestion"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
