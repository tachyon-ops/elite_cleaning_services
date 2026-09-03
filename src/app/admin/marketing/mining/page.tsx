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
  Kanban,
  List,
  Phone,
  Mail,
  User,
  Globe,
  GripVertical,
  Share2,
} from "lucide-react";
import {
  getMiningLeads,
  updateMiningLead,
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

const KANBAN_COLUMNS = [
  { id: "new", label: "New Leads", color: "border-blue-500/30 bg-blue-500/5 text-blue-400" },
  { id: "qualified", label: "Qualified", color: "border-indigo-500/30 bg-indigo-500/5 text-indigo-400" },
  { id: "contacted", label: "Contacted", color: "border-amber-500/30 bg-amber-500/5 text-amber-400" },
  { id: "quoted", label: "Quoted", color: "border-purple-500/30 bg-purple-500/5 text-purple-400" },
  { id: "won", label: "Won / Client", color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" },
  { id: "dismissed", label: "Dismissed", color: "border-neutral-700 bg-neutral-900 text-neutral-400" },
];

export default function MarketingMiningPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // View mode
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

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
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [personInput, setPersonInput] = useState("");
  const [websiteInput, setWebsiteInput] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [converting, setConverting] = useState(false);

  // Drag-and-Drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Sync Modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncCantons, setSyncCantons] = useState<string[]>(["ZH", "ZG", "BE", "LU"]);
  const [syncDaysBack, setSyncDaysBack] = useState(14);

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
        pageSize: viewMode === "kanban" ? 100 : 25,
      });

      if (res.success) {
        setLeads(res.leads || []);
        setStats(res.stats || {});
        setTotalPages(res.totalPages || 1);
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
  }, [canton, status, subRubric, page, viewMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleOpenLead = (lead: any) => {
    setSelectedLead(lead);
    setNotesInput(lead.contactNotes || "");
    setPhoneInput(lead.contactPhone || "");
    setEmailInput(lead.contactEmail || "");
    setPersonInput(lead.contactPerson || "");
    setWebsiteInput(lead.website || "");
    setError("");
    setSuccessMsg("");
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    // Optimistic UI update
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev: any) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const res = await updateMiningLeadStatus(leadId, newStatus);
      if (res.success) {
        setSuccessMsg(`Moved to ${newStatus}`);
      } else {
        setError(res.error || "Failed to update status");
        fetchLeads(); // rollback
      }
    } catch (err: any) {
      setError(err.message || "Failed to update status");
      fetchLeads();
    }
  };

  const handleSaveContactDetails = async () => {
    if (!selectedLead) return;
    setSavingContact(true);
    try {
      const res = await updateMiningLead(selectedLead.id, {
        notes: notesInput,
        contactPhone: phoneInput,
        contactEmail: emailInput,
        contactPerson: personInput,
        website: websiteInput,
      });

      if (res.success && res.lead) {
        setSelectedLead(res.lead);
        setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? res.lead : l)));
        setSuccessMsg("Contact details saved successfully");
      } else {
        setError(res.error || "Failed to save contact details");
      }
    } catch (err: any) {
      setError(err.message || "Error saving contact");
    } finally {
      setSavingContact(false);
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
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {score} • High
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {score} • Med
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
        {score} • Low
      </span>
    );
  };

  // Swiss Directory Search URL builders
  const getSearchChUrl = (lead: any) => {
    const term = lead.companyName;
    const loc = lead.newSeat || lead.canton || "";
    return `https://tel.search.ch/?was=${encodeURIComponent(term)}&wo=${encodeURIComponent(loc)}`;
  };

  const getGoogleSearchUrl = (lead: any) => {
    const q = `${lead.companyName} ${lead.newSeat || lead.canton || "Schweiz"}`;
    return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  };

  const getLinkedInSearchUrl = (lead: any) => {
    return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(lead.companyName)}`;
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f2f2f2] p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
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
              Live pipeline of office relocations (HR02) and new incorporations (HR01). Drag leads across columns to advance outreach.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#1a1a1a] border border-[#262626] rounded-md p-0.5">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewMode === "kanban"
                    ? "bg-[#d4af37] text-black font-semibold shadow"
                    : "text-[#a6a6a6] hover:text-[#f2f2f2]"
                }`}
              >
                <Kanban className="w-3.5 h-3.5" /> Kanban Pipeline
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-[#d4af37] text-black font-semibold shadow"
                    : "text-[#a6a6a6] hover:text-[#f2f2f2]"
                }`}
              >
                <List className="w-3.5 h-3.5" /> Table View
              </button>
            </div>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#262626] text-[#f2f2f2] px-3.5 py-2 rounded-md font-medium text-xs transition-colors border border-[#262626]"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => setShowSyncModal(true)}
              disabled={syncing}
              className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#b5952f] text-black px-4 py-2 rounded-md font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Commercial Register"}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs flex items-center gap-2">
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
            <span className="text-[11px] text-[#737373] mt-1 block">HR02 relocations</span>
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
            <span className="text-xs text-green-400 uppercase tracking-wider block">Won Conversions</span>
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
              placeholder="Search company, UID, town, phone, email, purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#262626] rounded-md pl-9 pr-3 py-2 text-xs text-[#f2f2f2] placeholder-[#737373] focus:outline-none focus:border-[#d4af37]"
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
              className="bg-[#1a1a1a] border border-[#262626] rounded-md px-3 py-2 text-xs text-[#f2f2f2] focus:outline-none focus:border-[#d4af37]"
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
            <span className="text-xs text-[#a6a6a6]">Event:</span>
            <select
              value={subRubric}
              onChange={(e) => {
                setSubRubric(e.target.value);
                setPage(1);
              }}
              className="bg-[#1a1a1a] border border-[#262626] rounded-md px-3 py-2 text-xs text-[#f2f2f2] focus:outline-none focus:border-[#d4af37]"
            >
              <option value="all">All Events</option>
              <option value="HR02">Office Movers (HR02)</option>
              <option value="HR01">New Formations (HR01)</option>
            </select>
          </div>

          {/* Status Filter (Table view only) */}
          {viewMode === "table" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#a6a6a6]">Status:</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="bg-[#1a1a1a] border border-[#262626] rounded-md px-3 py-2 text-xs text-[#f2f2f2] focus:outline-none focus:border-[#d4af37]"
              >
                <option value="all">All Statuses</option>
                {KANBAN_COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Area (3 cols): Kanban or Table */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-16 text-center text-[#a6a6a6] flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#d4af37]" /> Loading commercial leads...
              </div>
            ) : leads.length === 0 ? (
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-16 text-center flex flex-col items-center justify-center">
                <Building2 className="w-12 h-12 text-[#404040] mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No commercial leads found</h3>
                <p className="text-xs text-[#a6a6a6] max-w-sm mb-6">
                  Try adjusting your filters, or trigger a live pull from the Swiss Commercial Register.
                </p>
                <button
                  onClick={() => setShowSyncModal(true)}
                  className="flex items-center gap-2 bg-[#d4af37] text-black px-4 py-2 rounded-md font-semibold text-xs hover:bg-[#b5952f] transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Run First Sync
                </button>
              </div>
            ) : viewMode === "kanban" ? (
              /* KANBAN BOARD */
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
                {KANBAN_COLUMNS.map((col) => {
                  const colLeads = leads.filter((l) => l.status === col.id);
                  const isOver = dragOverCol === col.id;

                  return (
                    <div
                      key={col.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setDragOverCol(col.id);
                      }}
                      onDragLeave={() => setDragOverCol(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        const id = e.dataTransfer.getData("text/plain");
                        if (id) handleStatusChange(id, col.id);
                        setDragOverCol(null);
                        setDraggedLeadId(null);
                      }}
                      className={`bg-[#141414] border rounded-xl p-3 flex flex-col min-h-[500px] transition-all ${
                        isOver
                          ? "border-[#d4af37] bg-[#1a1a1a] shadow-lg shadow-[#d4af37]/5"
                          : "border-[#262626]"
                      }`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#262626]">
                        <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${col.color}`}>
                          {col.label}
                        </span>
                        <span className="text-xs font-mono font-medium text-[#737373] bg-[#1a1a1a] px-2 py-0.5 rounded">
                          {colLeads.length}
                        </span>
                      </div>

                      {/* Column Cards */}
                      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)] pr-0.5">
                        {colLeads.map((lead) => {
                          const isSelected = selectedLead?.id === lead.id;
                          const isDragging = draggedLeadId === lead.id;

                          return (
                            <div
                              key={lead.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("text/plain", lead.id);
                                setDraggedLeadId(lead.id);
                              }}
                              onDragEnd={() => setDraggedLeadId(null)}
                              onClick={() => handleOpenLead(lead)}
                              className={`p-3 bg-[#1c1c1c] hover:bg-[#222222] border rounded-lg cursor-grab active:cursor-grabbing transition-all space-y-2 text-xs relative ${
                                isSelected
                                  ? "border-[#d4af37] shadow-sm shadow-[#d4af37]/10"
                                  : "border-[#2b2b2b]"
                              } ${isDragging ? "opacity-40 scale-95" : ""}`}
                            >
                              {/* Card Header: Score & Canton */}
                              <div className="flex items-center justify-between">
                                {getPriorityBadge(lead.priorityScore)}
                                <span className="text-[10px] font-mono text-[#a6a6a6] bg-[#262626] px-1.5 py-0.5 rounded">
                                  {lead.canton}
                                </span>
                              </div>

                              {/* Company Name */}
                              <div>
                                <h4 className="font-semibold text-[#f2f2f2] leading-snug line-clamp-2">
                                  {lead.companyName}
                                </h4>
                                <div className="text-[10px] text-[#737373] font-mono mt-0.5 truncate">
                                  {lead.legalForm || "GmbH/AG"} • {lead.uid || "Pending"}
                                </div>
                              </div>

                              {/* Relocation Diff Chip */}
                              {lead.subRubric === "HR02" ? (
                                <div className="p-1.5 bg-[#262626] rounded text-[10px] space-y-0.5">
                                  <div className="text-amber-400 font-medium truncate">
                                    🚚 Relocating: {lead.newSeat || lead.newAddress || "Office shift"}
                                  </div>
                                  {lead.oldAddress && (
                                    <div className="text-[#888888] truncate">
                                      Ex: {lead.oldAddress}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="p-1 bg-[#262626] rounded text-[10px] text-blue-400 font-medium truncate">
                                  ✨ New Setup: {lead.newSeat || lead.newAddress || lead.canton}
                                </div>
                              )}

                              {/* Direct Outreach Quick Action Buttons */}
                              <div className="pt-1.5 border-t border-[#262626] flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  {lead.contactPhone ? (
                                    <a
                                      href={`tel:${lead.contactPhone}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                      title={`Call ${lead.contactPhone}`}
                                    >
                                      <Phone className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <a
                                      href={getSearchChUrl(lead)}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-[10px] text-[#a6a6a6] hover:text-[#d4af37] flex items-center gap-0.5 underline"
                                      title="Search Swiss Phonebook (search.ch)"
                                    >
                                      <Phone className="w-2.5 h-2.5" /> Find Phone
                                    </a>
                                  )}

                                  {lead.contactEmail && (
                                    <a
                                      href={`mailto:${lead.contactEmail}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                                      title={`Email ${lead.contactEmail}`}
                                    >
                                      <Mail className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>

                                <span className="text-[10px] text-[#666666]">
                                  {new Date(lead.publicationDate).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body text-xs">
                    <thead className="bg-[#1a1a1a] border-b border-[#262626] text-[#a6a6a6]">
                      <tr>
                        <th className="p-3.5">Priority</th>
                        <th className="p-3.5">Company & UID</th>
                        <th className="p-3.5">Event Type</th>
                        <th className="p-3.5">New Address</th>
                        <th className="p-3.5">Direct Contact</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5 text-right">Inspect</th>
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
                            <td className="p-3.5 whitespace-nowrap">
                              {getPriorityBadge(lead.priorityScore)}
                            </td>
                            <td className="p-3.5">
                              <div className="font-medium text-[#f2f2f2]">{lead.companyName}</div>
                              <div className="text-[11px] font-mono text-[#737373]">
                                {lead.uid || "Pending"} • {lead.legalForm || "GmbH/AG"}
                              </div>
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              {lead.subRubric === "HR02" ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Office Mover
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  New Formation
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-xs text-[#a6a6a6] max-w-[200px] truncate">
                              <div className="flex items-center gap-1 font-medium text-[#f2f2f2]">
                                <MapPin className="w-3 h-3 text-[#d4af37] shrink-0" />
                                {lead.newSeat || lead.canton}
                              </div>
                              <div className="truncate">{lead.newAddress || "Address in extract"}</div>
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              {lead.contactPhone ? (
                                <a
                                  href={`tel:${lead.contactPhone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                                >
                                  <Phone className="w-3 h-3" /> {lead.contactPhone}
                                </a>
                              ) : (
                                <a
                                  href={getSearchChUrl(lead)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[#a6a6a6] hover:text-[#d4af37] text-[11px] flex items-center gap-1"
                                >
                                  <Search className="w-2.5 h-2.5" /> search.ch
                                </a>
                              )}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                                  KANBAN_COLUMNS.find((s) => s.id === lead.status)?.color ||
                                  "bg-neutral-800 text-neutral-400"
                                }`}
                              >
                                {KANBAN_COLUMNS.find((s) => s.id === lead.status)?.label || lead.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-xs text-[#737373] whitespace-nowrap">
                              {new Date(lead.publicationDate).toLocaleDateString()}
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenLead(lead);
                                }}
                                className="p-1.5 hover:bg-[#262626] rounded text-[#a6a6a6] hover:text-[#f2f2f2]"
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
            )}
          </div>

          {/* Master-Detail Drawer (1 col) */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 h-fit sticky top-8 space-y-5 text-xs">
            {selectedLead ? (
              <>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#262626]">
                  <div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(selectedLead.priorityScore)}
                      <span className="text-[11px] text-[#737373]">
                        Pub: {new Date(selectedLead.publicationDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="text-lg font-display font-semibold mt-1 text-white leading-tight">
                      {selectedLead.companyName}
                    </h2>
                    <div className="text-[11px] font-mono text-[#a6a6a6] mt-0.5">
                      {selectedLead.uid || "No UID"} • {selectedLead.canton} • {selectedLead.legalForm}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-1 hover:bg-[#262626] rounded text-[#a6a6a6] hover:text-[#f2f2f2]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 1-Click Swiss Intelligence Search Shortcuts */}
                <div className="p-3 bg-[#1a1a1a] border border-[#2b2b2b] rounded-lg space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d4af37] block">
                    1-Click Directory & Web Lookups
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={getSearchChUrl(selectedLead)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 p-2 bg-[#222222] hover:bg-[#2c2c2c] rounded text-[#f2f2f2] font-medium transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>search.ch (Phone)</span>
                    </a>
                    <a
                      href={getGoogleSearchUrl(selectedLead)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 p-2 bg-[#222222] hover:bg-[#2c2c2c] rounded text-[#f2f2f2] font-medium transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      <span>Google Search</span>
                    </a>
                    <a
                      href={getLinkedInSearchUrl(selectedLead)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 p-2 bg-[#222222] hover:bg-[#2c2c2c] rounded text-[#f2f2f2] font-medium transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      <span>LinkedIn People</span>
                    </a>
                    <a
                      href={selectedLead.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 p-2 bg-[#222222] hover:bg-[#2c2c2c] rounded text-[#f2f2f2] font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>SHAB Extract</span>
                    </a>
                  </div>
                </div>

                {/* The Relocation Diff */}
                {selectedLead.subRubric === "HR02" && (
                  <div className="p-3 bg-[#181818] border border-[#2b2b2b] rounded-lg space-y-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 block">
                      Relocation Commercial Opportunity
                    </span>

                    <div>
                      <span className="text-[#888888] block text-[10px]">Former Space (Move-out Cleaning):</span>
                      <span className="text-red-300 font-medium block mt-0.5">
                        {selectedLead.oldAddress || "Registered in former extract"}
                      </span>
                    </div>

                    <div className="border-t border-[#262626]" />

                    <div>
                      <span className="text-[#888888] block text-[10px]">New Space (Deep Clean + Contract):</span>
                      <span className="text-emerald-300 font-medium block mt-0.5">
                        {selectedLead.newAddress || selectedLead.newSeat || "Zürich, Switzerland"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Direct Contact Details Form */}
                <div className="space-y-3 pt-2 border-t border-[#262626]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#f2f2f2] block">
                    Direct Contact Details
                  </span>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a6a6a6] flex items-center justify-between">
                      <span>Phone Number:</span>
                      {phoneInput && (
                        <a href={`tel:${phoneInput}`} className="text-emerald-400 hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Call Now
                        </a>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="+41 44 123 45 67"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#262626] rounded p-2 text-xs text-[#f2f2f2] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a6a6a6] flex items-center justify-between">
                      <span>Email Address:</span>
                      {emailInput && (
                        <a href={`mailto:${emailInput}`} className="text-purple-400 hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Email Now
                        </a>
                      )}
                    </label>
                    <input
                      type="email"
                      placeholder="info@company.ch or name@company.ch"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#262626] rounded p-2 text-xs text-[#f2f2f2] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  {/* Contact Person */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a6a6a6]">Decision Maker / Contact Person:</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Thomas Keller (Managing Director)"
                      value={personInput}
                      onChange={(e) => setPersonInput(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#262626] rounded p-2 text-xs text-[#f2f2f2] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a6a6a6]">Outreach Log & Notes:</label>
                    <textarea
                      rows={2}
                      placeholder="Called switchboard, spoke to office manager, sending commercial quote..."
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#262626] rounded p-2 text-xs text-[#f2f2f2] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <button
                    onClick={handleSaveContactDetails}
                    disabled={savingContact}
                    className="w-full bg-[#262626] hover:bg-[#333333] text-xs font-semibold py-2 rounded transition-colors text-[#f2f2f2]"
                  >
                    {savingContact ? "Saving Contact Details..." : "Save Contact & Notes"}
                  </button>
                </div>

                {/* Pipeline Stage Buttons */}
                <div className="space-y-2 pt-3 border-t border-[#262626]">
                  <label className="text-[11px] font-semibold text-[#a6a6a6] uppercase tracking-wider block">
                    Move Pipeline Stage:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {KANBAN_COLUMNS.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => handleStatusChange(selectedLead.id, col.id)}
                        className={`text-[11px] py-1.5 px-2 rounded font-medium transition-all ${
                          selectedLead.status === col.id
                            ? "bg-[#d4af37] text-black font-semibold"
                            : "bg-[#1a1a1a] text-[#a6a6a6] hover:bg-[#262626] hover:text-[#f2f2f2]"
                        }`}
                      >
                        {col.label.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1-Click Quote Conversion */}
                <div className="pt-3 border-t border-[#262626] space-y-2">
                  {selectedLead.convertedBookingId ? (
                    <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-md text-xs text-green-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Quoted / Booking Created
                      </span>
                      <Link
                        href="/admin/bookings"
                        className="text-[#d4af37] underline font-medium hover:text-[#e6c45e]"
                      >
                        Open Bookings
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={handleConvertToBooking}
                      disabled={converting}
                      className="w-full flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#b5952f] text-black font-semibold text-xs py-2.5 rounded-md transition-colors"
                    >
                      <Briefcase className="w-4 h-4" />
                      {converting ? "Creating Draft..." : "Create Commercial Quote Draft"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-[#737373] space-y-3">
                <Briefcase className="w-8 h-8 mx-auto text-[#333333]" />
                <h3 className="text-xs font-medium text-[#a6a6a6]">No Lead Selected</h3>
                <p className="text-[11px] text-[#666666]">
                  Click on any card or row to access direct phone lookup, LinkedIn links, and log calls.
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

              <div className="space-y-2">
                <label className="text-xs font-medium text-[#f2f2f2]">Date Range:</label>
                <select
                  value={syncDaysBack}
                  onChange={(e) => setSyncDaysBack(Number(e.target.value))}
                  className="w-full bg-[#1a1a1a] border border-[#262626] rounded-md p-2 text-xs text-[#f2f2f2]"
                >
                  <option value={1}>Last 24 Hours</option>
                  <option value={3}>Last 3 Days</option>
                  <option value={7}>Last 7 Days</option>
                  <option value={14}>Last 14 Days (Recommended)</option>
                  <option value={30}>Last 30 Days (Full Month Backfill)</option>
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
