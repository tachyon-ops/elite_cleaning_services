"use client";

import React, { useState, useEffect } from "react";
import { 
  getBookingsList, 
  getPartnersList, 
  assignPartnerTeam, 
  assignPartnerTeamWithBudget,
  finalizeServiceCostAndSettle,
  updateBookingStatus, 
  deleteCustomerDataGDPR, 
  createQuote 
} from "@/app/actions/admin";
import { 
  BookOpen, User, MapPin, Eye, Trash2, CheckCircle2, 
  AlertTriangle, ShieldAlert, DollarSign, Calculator, Percent, Check 
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function AdminBookingsPage() {
  const { locale, t } = useLanguage();
  const [bookings, setBookings] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Details drawer
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  // Quote form state
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteValidity, setQuoteValidity] = useState("7");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Supplier Budget form state
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [supplierBudget, setSupplierBudget] = useState("");
  const [submittingBudget, setSubmittingBudget] = useState(false);

  // Post-service settlement state
  const [supplierActualCost, setSupplierActualCost] = useState("");
  const [submittingSettlement, setSubmittingSettlement] = useState(false);

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    const price = parseFloat(quotePrice);
    if (isNaN(price) || price <= 0) {
      setError(t("admin.bookings.invalidPrice"));
      return;
    }
    const days = parseInt(quoteValidity);
    if (isNaN(days) || days <= 0) {
      setError(t("admin.bookings.invalidValidity"));
      return;
    }

    setSubmittingQuote(true);
    setError("");
    setSuccessMsg("");

    const res = await createQuote({
      bookingId: selectedBooking.id,
      amountChf: price,
      validUntilDays: days,
      notes: quoteNotes
    });

    setSubmittingQuote(false);

    if (res.success) {
      setSuccessMsg(t("admin.bookings.quoteCreated"));
      setQuotePrice("");
      setQuoteValidity("7");
      setQuoteNotes("");
      loadData();
      setSelectedBooking((prev: any) => ({
        ...prev,
        status: "quote_sent",
        totalAmountChf: price,
        depositAmountChf: Math.round(price * 0.3 * 100) / 100
      }));
    } else {
      setError(res.error || t("admin.bookings.quoteError"));
    }
  };

  const handleAssignWithBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    const budgetVal = supplierBudget ? parseFloat(supplierBudget) : undefined;

    setSubmittingBudget(true);
    setError("");
    setSuccessMsg("");

    const res = await assignPartnerTeamWithBudget(
      selectedBooking.id, 
      selectedTeamId || null, 
      budgetVal
    );
    setSubmittingBudget(false);

    if (res.success && res.booking) {
      setSuccessMsg(t("admin.bookings.details.budgetSaved") || "Supplier team and budget assigned successfully");
      loadData();
      setSelectedBooking(res.booking);
    } else {
      setError(res.error || "Failed to assign supplier team");
    }
  };

  const handleFinalizeSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    const actualCost = parseFloat(supplierActualCost);
    if (isNaN(actualCost) || actualCost <= 0) {
      setError("Please enter a valid supplier actual cost");
      return;
    }

    setSubmittingSettlement(true);
    setError("");
    setSuccessMsg("");

    const res = await finalizeServiceCostAndSettle(selectedBooking.id, actualCost, 15);
    setSubmittingSettlement(false);

    if (res.success && res.booking) {
      setSuccessMsg(t("admin.bookings.details.settlementSuccess") || "Service completed and remaining balance settled.");
      loadData();
      setSelectedBooking(res.booking);
    } else {
      setError(res.error || "Failed to finalize settlement");
    }
  };

  const loadData = async () => {
    setLoading(true);
    const resB = await getBookingsList();
    const resP = await getPartnersList();
    setLoading(false);

    if (resB.success && resB.bookings) {
      setBookings(resB.bookings);
    } else {
      setError(resB.error || "Failed to load bookings");
    }

    if (resP.success && resP.partners) {
      const allTeams: any[] = [];
      resP.partners.forEach((p: any) => {
        if (p.teams) {
          p.teams.forEach((t: any) => {
            allTeams.push({
              ...t,
              providerName: p.name
            });
          });
        }
      });
      setPartners(allTeams);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBooking) {
      setSelectedTeamId(selectedBooking.providerTeamId || "");
      setSupplierBudget(selectedBooking.providerPayoutAmountChf ? String(selectedBooking.providerPayoutAmountChf) : "");
      setSupplierActualCost(selectedBooking.providerPayoutAmountChf ? String(selectedBooking.providerPayoutAmountChf) : "");
    }
  }, [selectedBooking]);

  const handleAssignTeam = async (bookingId: string, teamId: string) => {
    setError("");
    setSuccessMsg("");
    const res = await assignPartnerTeam(bookingId, teamId || null);
    if (res.success) {
      setSuccessMsg(t("admin.bookings.teamUpdated"));
      loadData();
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev: any) => ({ ...prev, providerTeamId: teamId || null }));
      }
    } else {
      setError(res.error || "Failed to assign partner team");
    }
  };

  const handleStatusChange = async (bookingId: string, status: string) => {
    setError("");
    setSuccessMsg("");
    const res = await updateBookingStatus(bookingId, status);
    if (res.success) {
      setSuccessMsg(t("admin.bookings.statusUpdated"));
      loadData();
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev: any) => ({ ...prev, status }));
      }
    } else {
      setError(res.error || "Failed to update status");
    }
  };

  const handleDeleteGDPR = async (email: string) => {
    if (!window.confirm(t("admin.bookings.gdprConfirm").replace("{email}", email))) {
      return;
    }
    setError("");
    setSuccessMsg("");
    const res = await deleteCustomerDataGDPR(email);
    if (res.success) {
      setSuccessMsg(t("admin.bookings.gdprSuccess").replace("{email}", email));
      loadData();
      if (selectedBooking?.guestEmail === email) {
        setSelectedBooking(null);
      }
    } else {
      setError(res.error || t("admin.bookings.gdprError"));
    }
  };

  // Real-time preview calculations for 15% margin settlement
  const previewCost = parseFloat(supplierActualCost) || 0;
  const previewMargin = Math.round(previewCost * 0.15 * 100) / 100;
  const previewPromo = selectedBooking?.promoDiscountChf || 0;
  const previewClientTotal = Math.max(0, Math.round((previewCost + previewMargin - previewPromo) * 100) / 100);
  const previewDeposit = selectedBooking?.depositAmountChf || 0;
  const previewBalance = Math.max(0, Math.round((previewClientTotal - previewDeposit) * 100) / 100);

  return (
    <div className="p-8 md:p-12 space-y-8 max-w-7xl w-full mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <span className="text-caption text-accent uppercase tracking-widest block mb-2 font-semibold">
            {t("admin.bookings.activeDispatch")}
          </span>
          <h1 className="text-display-md font-display font-medium text-[#f2f2f2] tracking-tight">
            {t("admin.bookings.dashboardTitle")}
          </h1>
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

      {loading ? (
        <div className="text-center py-12 text-[#a6a6a6] text-body-sm">
          {t("admin.bookings.loading")}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Bookings Table */}
          <div className="lg:col-span-2 border border-[#262626] bg-[#141414] rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#262626]">
              <span className="text-body-md font-semibold text-[#f2f2f2] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />{" "}
                {t("admin.bookings.listTitle").replace("{count}", bookings.length.toString())}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#262626] text-caption uppercase text-[#a6a6a6] bg-[#0d0d0d]">
                    <th className="p-4 font-semibold">{t("admin.bookings.table.date")}</th>
                    <th className="p-4 font-semibold">{t("admin.bookings.table.customer")}</th>
                    <th className="p-4 font-semibold">{t("admin.bookings.table.details")}</th>
                    <th className="p-4 font-semibold">{t("admin.bookings.table.partner")}</th>
                    <th className="p-4 font-semibold">{t("admin.bookings.table.status")}</th>
                    <th className="p-4 font-semibold">{t("admin.bookings.table.inspect")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626] text-body-sm text-[#f2f2f2]">
                  {bookings.map((booking) => (
                    <tr 
                      key={booking.id} 
                      className={`hover:bg-[#1a1a1a] transition-colors ${selectedBooking?.id === booking.id ? "bg-[#1f1f1f]" : ""}`}
                    >
                      <td className="p-4 font-medium">
                        {new Date(booking.scheduledAt).toLocaleDateString(locale, { month: "short", day: "numeric" })}
                        <span className="block text-caption text-[#a6a6a6] capitalize">{booking.scheduledWindow}</span>
                      </td>
                      <td className="p-4">
                        <span className="block font-medium">{booking.guestEmail}</span>
                      </td>
                      <td className="p-4 font-medium capitalize">
                        {booking.vertical}
                        <span className="block text-caption text-accent font-semibold">CHF {booking.totalAmountChf}</span>
                      </td>
                      <td className="p-4">
                        <select
                          value={booking.providerTeamId || ""}
                          onChange={(e) => handleAssignTeam(booking.id, e.target.value)}
                          className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2 rounded-md focus:border-accent outline-none text-body-xs font-semibold w-full"
                        >
                          <option value="">{t("admin.bookings.unassigned")}</option>
                          {partners
                            .filter(t => {
                              try {
                                return JSON.parse(t.serviceCategories).includes(booking.categorySlug);
                              } catch {
                                return true;
                              }
                            })
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.providerName} - {t.name}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                          className={`border border-[#262626] bg-[#0d0d0d] p-2 rounded-md focus:border-accent outline-none text-body-xs font-bold w-full uppercase ${
                            booking.status === "completed"
                              ? "text-green-400"
                              : booking.status === "cancelled"
                              ? "text-red-400"
                              : booking.status === "quote_pending"
                              ? "text-yellow-400"
                              : "text-accent"
                          }`}
                        >
                          <option value="draft">Draft</option>
                          <option value="quote_pending">Quote Pending</option>
                          <option value="quote_sent">Quote Sent</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="assigned">Assigned</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="text-accent hover:text-accent-hover p-2 hover:bg-accent/10 rounded-md transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#a6a6a6]">
                        {t("admin.bookings.empty")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details & Assignment / Settlement Drawer */}
          <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-6">
            {selectedBooking ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-body-md font-semibold text-[#f2f2f2]">
                      {t("admin.bookings.details.intakeDetails")}
                    </h3>
                    <span className="text-caption text-accent uppercase font-mono block">ID: {selectedBooking.id.substring(0, 8)}</span>
                  </div>
                  <span className={`text-caption uppercase px-2 py-1 rounded font-bold ${
                    selectedBooking.status === "completed" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-accent/10 text-accent border border-accent/20"
                  }`}>
                    {selectedBooking.status}
                  </span>
                </div>

                {/* Financial Ledger Overview */}
                <div className="bg-[#0d0d0d] p-4 rounded-md border border-[#262626] space-y-2 text-body-xs">
                  <div className="flex justify-between">
                    <span className="text-[#a6a6a6]">Client Quote / Total:</span>
                    <span className="font-bold text-[#f2f2f2]">CHF {selectedBooking.totalAmountChf.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a6a6a6]">Retainer Deposit Paid:</span>
                    <span className="font-semibold text-accent">CHF {selectedBooking.depositAmountChf.toFixed(2)}</span>
                  </div>
                  {selectedBooking.promoDiscountChf > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Promo Discount:</span>
                      <span>-CHF {selectedBooking.promoDiscountChf.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedBooking.providerPayoutAmountChf && (
                    <div className="flex justify-between pt-2 border-t border-[#262626]">
                      <span className="text-[#a6a6a6]">Supplier Cost:</span>
                      <span className="font-semibold text-yellow-400">CHF {selectedBooking.providerPayoutAmountChf.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedBooking.commissionAmountChf && (
                    <div className="flex justify-between">
                      <span className="text-[#a6a6a6]">Platform Margin (+15%):</span>
                      <span className="font-semibold text-green-400">+CHF {selectedBooking.commissionAmountChf.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 text-body-sm">
                  <div className="flex gap-3">
                    <User className="w-5 h-5 text-[#a6a6a6] shrink-0" />
                    <div>
                      <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">
                        {t("admin.bookings.details.contactEmail")}
                      </span>
                      <span className="font-medium text-[#f2f2f2]">{selectedBooking.guestEmail}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-[#a6a6a6] shrink-0" />
                    <div>
                      <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">
                        {t("admin.bookings.details.serviceLocation")}
                      </span>
                      <span className="font-medium text-[#f2f2f2]">{selectedBooking.locationAddress}</span>
                    </div>
                  </div>
                </div>

                {/* 1. Supplier Assignment & Budget Setup (5-Day Matching Phase) */}
                <form onSubmit={handleAssignWithBudget} className="border-t border-[#262626] pt-4 space-y-4">
                  <span className="text-caption text-accent block uppercase font-semibold flex items-center gap-1.5">
                    <Calculator className="w-4 h-4" /> 5-Day Supplier Matching & Budget
                  </span>

                  <div className="space-y-3">
                    <div>
                      <label className="text-caption text-[#a6a6a6] block mb-1 font-semibold">
                        Assign Certified Subcontractor
                      </label>
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded-md focus:border-accent outline-none text-body-xs font-semibold"
                      >
                        <option value="">{t("admin.bookings.unassigned")}</option>
                        {partners.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.providerName} - {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-caption text-[#a6a6a6] block mb-1 font-semibold">
                        {t("admin.bookings.details.supplierBudget") || "Supplier Cost Budget (CHF)"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={supplierBudget}
                        onChange={(e) => setSupplierBudget(e.target.value)}
                        placeholder="e.g. 350.00"
                        className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded-md focus:border-accent outline-none text-body-sm font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingBudget}
                    className="w-full border border-accent bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-50 text-button font-semibold py-2.5 rounded-md transition-colors uppercase tracking-wide text-xs flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {submittingBudget ? "Saving..." : (t("admin.bookings.details.assignWithBudget") || "Assign & Set Budget")}
                  </button>
                </form>

                {/* 2. Post-Service Fine-Tuning & 15% Margin Settlement */}
                {selectedBooking.status !== "cancelled" && (
                  <form onSubmit={handleFinalizeSettlement} className="border-t border-[#262626] pt-4 space-y-4">
                    <span className="text-caption text-green-400 block uppercase font-semibold flex items-center gap-1.5">
                      <Percent className="w-4 h-4" /> {t("admin.bookings.details.settlementPrompt") || "Fine-Tune Cost & Settle +15% Margin"}
                    </span>

                    <div>
                      <label className="text-caption text-[#a6a6a6] block mb-1 font-semibold">
                        {t("admin.bookings.details.supplierActualCost") || "Supplier Final Cost (CHF)"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={supplierActualCost}
                        onChange={(e) => setSupplierActualCost(e.target.value)}
                        placeholder="e.g. 400.00"
                        className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded-md focus:border-accent outline-none text-body-sm font-semibold"
                      />
                    </div>

                    {previewCost > 0 && (
                      <div className="p-3 bg-[#0d0d0d] border border-green-500/30 rounded-md text-body-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-[#a6a6a6]">Supplier Actual Cost:</span>
                          <span className="text-[#f2f2f2]">CHF {previewCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-400">
                          <span>+15% Platform Margin:</span>
                          <span>+CHF {previewMargin.toFixed(2)}</span>
                        </div>
                        {previewPromo > 0 && (
                          <div className="flex justify-between text-accent">
                            <span>Promo Discount:</span>
                            <span>-CHF {previewPromo.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold pt-1.5 border-t border-[#262626] text-[#f2f2f2]">
                          <span>New Client Total:</span>
                          <span>CHF {previewClientTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-accent">
                          <span>Retainer Deposit Paid:</span>
                          <span>-CHF {previewDeposit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-yellow-400 font-bold pt-1 border-t border-[#262626]">
                          <span>Remaining Balance to Charge:</span>
                          <span>CHF {previewBalance.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submittingSettlement || !supplierActualCost}
                      className="w-full border border-green-500 bg-green-500/20 text-green-300 hover:bg-green-500/30 disabled:opacity-50 text-button font-semibold py-3 rounded-md transition-colors uppercase tracking-wide text-xs flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      {submittingSettlement 
                        ? "Settling..." 
                        : (t("admin.bookings.details.settleAndComplete") || "Settle Balance & Complete Job")}
                    </button>
                  </form>
                )}

                {/* Intake Schema Inspector */}
                <div className="border-t border-[#262626] pt-4">
                  <span className="text-caption text-[#a6a6a6] block uppercase font-semibold mb-3">
                    {t("admin.bookings.details.intakeSchema")}
                  </span>
                  <pre className="bg-[#0d0d0d] p-4 rounded-md border border-[#262626] text-body-xs font-mono overflow-auto max-h-48 text-accent">
                    {JSON.stringify(JSON.parse(selectedBooking.intake), null, 2)}
                  </pre>
                </div>

                {selectedBooking.status === "quote_pending" && (
                  <form onSubmit={handleSendQuote} className="border-t border-[#262626] pt-4 space-y-4">
                    <span className="text-caption text-accent block uppercase font-semibold">
                      {t("admin.bookings.details.generateQuote")}
                    </span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-caption text-[#a6a6a6] block mb-1 font-semibold">
                          {t("admin.bookings.details.priceLabel")}
                        </label>
                        <input
                          type="number"
                          value={quotePrice}
                          onChange={(e) => setQuotePrice(e.target.value)}
                          placeholder="e.g. 750"
                          min="1"
                          required
                          className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded-md focus:border-accent outline-none text-body-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-caption text-[#a6a6a6] block mb-1 font-semibold">
                          {t("admin.bookings.details.validityLabel")}
                        </label>
                        <input
                          type="number"
                          value={quoteValidity}
                          onChange={(e) => setQuoteValidity(e.target.value)}
                          placeholder="e.g. 7"
                          min="1"
                          required
                          className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded-md focus:border-accent outline-none text-body-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-caption text-[#a6a6a6] block mb-1 font-semibold">
                        {t("admin.bookings.details.notesLabel")}
                      </label>
                      <textarea
                        value={quoteNotes}
                        onChange={(e) => setQuoteNotes(e.target.value)}
                        placeholder="e.g. Exterior hand wash, gelcoat sealant, and interior cabin detail."
                        rows={3}
                        className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded-md focus:border-accent outline-none text-body-sm font-medium resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingQuote}
                      className="w-full border border-accent bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-50 text-button font-semibold py-3 rounded-md transition-colors uppercase tracking-wide text-xs"
                    >
                      {submittingQuote ? t("admin.bookings.details.sendingQuote") : (t("admin.bookings.details.sendQuote") || "Send Bespoke Quote")}
                    </button>
                  </form>
                )}

                <div className="border-t border-[#262626] pt-6 flex flex-col gap-3">
                  <button
                    onClick={() => handleDeleteGDPR(selectedBooking.guestEmail)}
                    className="w-full border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 text-button font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
                  >
                    <Trash2 className="w-4 h-4" /> {t("admin.bookings.details.deleteGdpr") || "Permanent GDPR Deletion"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-[#a6a6a6] space-y-2">
                <AlertTriangle className="w-8 h-8 mx-auto text-[#a6a6a6]/50" />
                <p className="text-body-sm">{t("admin.bookings.details.placeholder")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
