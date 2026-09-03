"use client";

import React, { useState, useEffect } from "react";
import { 
  getMonthlyInvoices, 
  updateInvoiceStatus, 
  generateMonthlyInvoice 
} from "@/app/actions/materials";
import { 
  RefreshCw, ShieldAlert, CheckCircle2, FileText, 
  Send, CheckCircle, Plus, X 
} from "lucide-react";

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState(currentDate.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear());
  const [filterStatus, setFilterStatus] = useState("all");

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genTargetId, setGenTargetId] = useState("");
  const [genTargetType, setGenTargetType] = useState<"customer" | "organization">("customer");
  const [genMonth, setGenMonth] = useState(currentDate.getMonth() + 1);
  const [genYear, setGenYear] = useState(currentDate.getFullYear());
  const [genLoading, setGenLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await getMonthlyInvoices();
    setLoading(false);
    if (res.success && res.invoices) {
      setInvoices(res.invoices);
    } else {
      setError(res.error || "Failed to load invoices");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (invoiceId: string, newStatus: "sent" | "paid") => {
    setError("");
    setSuccess("");
    setActionLoadingId(invoiceId);
    
    const res = await updateInvoiceStatus(invoiceId, newStatus);
    setActionLoadingId(null);

    if (res.success) {
      setSuccess(`Invoice status updated to ${newStatus} successfully.`);
      loadData();
    } else {
      setError(res.error || "Failed to update status");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTargetId) {
      setError("Please provide a target ID");
      return;
    }

    setGenLoading(true);
    setError("");
    setSuccess("");

    const targetArgs = genTargetType === "customer" 
      ? { customerId: genTargetId } 
      : { organizationId: genTargetId };

    const res = await generateMonthlyInvoice({
      ...targetArgs,
      billingPeriodMonth: genMonth,
      billingPeriodYear: genYear
    });

    setGenLoading(false);

    if (res.success) {
      setSuccess("Invoice generated successfully.");
      setShowGenerateModal(false);
      loadData();
    } else {
      setError(res.error || "Failed to generate invoice");
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (filterMonth && inv.billingPeriodMonth !== filterMonth) return false;
    if (filterYear && inv.billingPeriodYear !== filterYear) return false;
    if (filterStatus !== "all" && inv.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
      case "sent":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "paid":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "overdue":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "bg-accent/10 text-accent border border-accent/20";
    }
  };

  return (
    <div className="p-8 md:p-12 space-y-8 max-w-7xl w-full mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <span className="text-caption text-accent uppercase tracking-widest block mb-2 font-semibold">Billing</span>
          <h1 className="text-display-md font-display font-medium text-[#f2f2f2] tracking-tight">
            Monthly Invoices
          </h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-accent hover:bg-[#a3850e] text-[#080808] px-4 py-2.5 rounded-md text-caption uppercase font-semibold transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Generate Invoice
          </button>
          <button
            onClick={loadData}
            className="border border-[#262626] bg-[#141414] hover:bg-[#1f1f1f] text-[#f2f2f2] px-4 py-2.5 rounded-md text-caption uppercase font-semibold transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md text-body-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-md text-body-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> {success}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center bg-[#141414] p-4 rounded-lg border border-[#262626]">
        <div className="flex flex-col gap-1">
          <label className="text-caption text-[#a6a6a6]">Month</label>
          <select 
            value={filterMonth} 
            onChange={e => setFilterMonth(parseInt(e.target.value))}
            className="bg-[#080808] border border-[#262626] text-[#f2f2f2] rounded p-2 text-sm"
          >
            <option value={0}>All Months</option>
            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-caption text-[#a6a6a6]">Year</label>
          <select 
            value={filterYear} 
            onChange={e => setFilterYear(parseInt(e.target.value))}
            className="bg-[#080808] border border-[#262626] text-[#f2f2f2] rounded p-2 text-sm"
          >
            <option value={0}>All Years</option>
            {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-caption text-[#a6a6a6]">Status</label>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#080808] border border-[#262626] text-[#f2f2f2] rounded p-2 text-sm"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#a6a6a6] text-body-sm flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span>Loading invoices...</span>
        </div>
      ) : (
        <div className="border border-[#262626] bg-[#141414] rounded-lg overflow-hidden">
          <div className="p-6 border-b border-[#262626]">
            <span className="text-body-md font-semibold text-[#f2f2f2]">
              Invoices ({filteredInvoices.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#262626] text-caption uppercase text-[#a6a6a6] bg-[#0d0d0d]">
                  <th className="p-4 font-semibold">Customer / Org</th>
                  <th className="p-4 font-semibold">Period</th>
                  <th className="p-4 font-semibold">Service CHF</th>
                  <th className="p-4 font-semibold">Materials CHF</th>
                  <th className="p-4 font-semibold">Total CHF</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-body-sm text-[#f2f2f2]">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-[#f2f2f2]">
                        {inv.customer ? inv.customer.name : (inv.organization ? inv.organization.name : "Unknown")}
                      </div>
                      <div className="text-caption text-[#a6a6a6]">
                        {inv.customer ? "Customer" : "Organization"}
                      </div>
                    </td>
                    <td className="p-4">
                      {inv.billingPeriodMonth}/{inv.billingPeriodYear}
                    </td>
                    <td className="p-4 font-mono">
                      {Number(inv.serviceAmountChf).toFixed(2)}
                    </td>
                    <td className="p-4 font-mono">
                      {Number(inv.materialsAmountChf).toFixed(2)}
                    </td>
                    <td className="p-4 font-mono font-bold text-accent">
                      {Number(inv.totalAmountChf).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className={`text-caption uppercase px-2 py-1.5 rounded font-bold ${getStatusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {inv.status === "draft" && (
                          <button
                            onClick={() => handleStatusChange(inv.id, "sent")}
                            disabled={actionLoadingId === inv.id}
                            className="border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 disabled:opacity-50 text-blue-400 p-2 rounded transition-colors flex items-center gap-2"
                            title="Send Invoice"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {(inv.status === "sent" || inv.status === "overdue") && (
                          <button
                            onClick={() => handleStatusChange(inv.id, "paid")}
                            disabled={actionLoadingId === inv.id}
                            className="border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 disabled:opacity-50 text-green-400 p-2 rounded transition-colors flex items-center gap-2"
                            title="Mark as Paid"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#a6a6a6]">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-xl max-w-md w-full p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-body-lg font-semibold text-[#f2f2f2]">Generate Invoice</h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-[#a6a6a6] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-caption text-[#a6a6a6] mb-1">Target Type</label>
                <select 
                  value={genTargetType}
                  onChange={e => setGenTargetType(e.target.value as "customer" | "organization")}
                  className="w-full bg-[#080808] border border-[#262626] text-[#f2f2f2] rounded p-2 text-sm"
                >
                  <option value="customer">Customer</option>
                  <option value="organization">Organization</option>
                </select>
              </div>

              <div>
                <label className="block text-caption text-[#a6a6a6] mb-1">Target ID</label>
                <input 
                  type="text" 
                  value={genTargetId}
                  onChange={e => setGenTargetId(e.target.value)}
                  className="w-full bg-[#080808] border border-[#262626] text-[#f2f2f2] rounded p-2 text-sm"
                  placeholder="Enter ID..."
                  required
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-caption text-[#a6a6a6] mb-1">Month</label>
                  <select 
                    value={genMonth} 
                    onChange={e => setGenMonth(parseInt(e.target.value))}
                    className="w-full bg-[#080808] border border-[#262626] text-[#f2f2f2] rounded p-2 text-sm"
                  >
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-caption text-[#a6a6a6] mb-1">Year</label>
                  <select 
                    value={genYear} 
                    onChange={e => setGenYear(parseInt(e.target.value))}
                    className="w-full bg-[#080808] border border-[#262626] text-[#f2f2f2] rounded p-2 text-sm"
                  >
                    {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded text-sm text-[#a6a6a6] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={genLoading}
                  className="bg-accent hover:bg-[#a3850e] text-[#080808] px-4 py-2 rounded font-semibold text-sm disabled:opacity-50"
                >
                  {genLoading ? "Generating..." : "Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
