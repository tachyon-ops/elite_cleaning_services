"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getProviderPortalData,
  respondToOffer,
  uploadProviderDocument,
  toggleStripeConnectSimulation,
  updateProviderListing,
  logoutProvider,
  getProviderCompanyId,
  isProviderAuthenticated
} from "@/app/actions/provider";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Sliders,
  DollarSign,
  Briefcase,
  MapPin,
  Calendar,
  LogOut,
  Plus
} from "lucide-react";

export default function ProviderDashboardPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Document uploading states
  const [docType, setDocType] = useState("insurance");
  const [docUrl, setDocUrl] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Listing editor states
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [listingRadius, setListingRadius] = useState(50);
  const [listingCapacity, setListingCapacity] = useState(3);
  const [listingActive, setListingActive] = useState(true);

  // Offer decline states
  const [decliningOfferId, setDecliningOfferId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("capacity");

  // Load provider details
  const loadData = async (targetId: string) => {
    setLoading(true);
    const res = await getProviderPortalData(targetId);
    if (res.success) {
      setData(res.provider);
      // If offers or bookings need sorting
      setData({
        provider: res.provider,
        offers: res.offers,
        bookings: res.bookings
      });
    } else {
      setError(res.error || "Failed to load portal data");
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isProviderAuthenticated();
      if (!auth) {
        router.push("/providers/account/login");
        return;
      }
      const cid = await getProviderCompanyId();
      if (!cid) {
        setError("Account not associated with a provider company.");
        setLoading(false);
        return;
      }
      setCompanyId(cid);
      loadData(cid);
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await logoutProvider();
    router.push("/providers/account/login");
  };

  const handleOfferResponse = async (offerId: string, response: "accepted" | "declined") => {
    const payload = {
      offerId,
      response,
      declineReason: response === "declined" ? declineReason : undefined
    };

    const res = await respondToOffer(payload);
    if (res.success) {
      setDecliningOfferId(null);
      if (companyId) loadData(companyId);
    } else {
      alert("Failed to respond to offer: " + res.error);
    }
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docUrl || !companyId) return;

    setUploadingDoc(true);
    const res = await uploadProviderDocument({
      companyId,
      docType,
      fileUrl: docUrl,
      expiresAtStr: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    });
    setUploadingDoc(false);

    if (res.success) {
      setDocUrl("");
      loadData(companyId);
    } else {
      alert("Failed to upload document: " + res.error);
    }
  };

  const handleStripeToggle = async () => {
    if (!companyId) return;
    const res = await toggleStripeConnectSimulation(companyId);
    if (res.success) {
      loadData(companyId);
    }
  };

  const startEditListing = (listing: any) => {
    setEditingListingId(listing.id);
    setListingRadius(listing.serviceRadiusKm);
    setListingCapacity(listing.capacityPerDay);
    setListingActive(listing.active);
  };

  const saveListingEdit = async () => {
    if (!editingListingId || !companyId) return;
    const res = await updateProviderListing({
      listingId: editingListingId,
      active: listingActive,
      serviceRadiusKm: listingRadius,
      capacityPerDay: listingCapacity
    });

    if (res.success) {
      setEditingListingId(null);
      loadData(companyId);
    } else {
      alert("Failed to update listing: " + res.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#f2f2f2] font-body flex justify-center items-center">
        <p className="text-body-md font-mono text-accent animate-pulse">LOADING PORTAL DATA...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#f2f2f2] font-body flex flex-col justify-center items-center p-6 space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h2 className="text-display-sm font-display">{error || "Access Denied"}</h2>
        <button onClick={handleLogout} className="bg-[#141414] border border-[#262626] text-[#f2f2f2] px-4 py-2 rounded">
          Return to Login
        </button>
      </div>
    );
  }

  const { provider, offers, bookings } = data;
  const missingStripe = provider.stripeConnectStatus !== "active";
  const missingDocs = provider.documents.length === 0;

  return (
    <div className="min-h-screen bg-[#080808] text-[#f2f2f2] font-body flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-[#1f1f1f] bg-[#0d0d0d] px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display font-medium text-body-lg tracking-widest text-[#f2f2f2] hover:text-accent transition-colors">
            ELITE PARTNER HUB
          </Link>
          <span className="h-4 w-px bg-[#262626]" />
          <span className="text-body-xs font-mono text-[#a6a6a6]">{provider.name}</span>
        </div>
        <button onClick={handleLogout} className="text-[#a6a6a6] hover:text-red-400 transition-colors flex items-center gap-1.5 text-body-sm font-semibold">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </nav>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Alerts & Offers */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status Banner */}
          <div className="border border-[#262626] bg-[#141414] p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-body-lg font-bold text-[#f2f2f2]">{provider.name}</h2>
              <p className="text-body-xs text-[#a6a6a6] font-mono">UID: {provider.uidNumber} | {provider.legalEntityType.toUpperCase()}</p>
            </div>
            <div className="flex gap-2">
              <span className={`text-caption uppercase font-bold px-3 py-1 rounded ${
                provider.onboardingStatus === "active" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              }`}>
                Onboarding: {provider.onboardingStatus}
              </span>
              <span className={`text-caption uppercase font-bold px-3 py-1 rounded ${
                provider.stripeConnectStatus === "active" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              }`}>
                Stripe Connect: {provider.stripeConnectStatus}
              </span>
            </div>
          </div>

          {/* Action Warnings */}
          {(missingStripe || missingDocs) && (
            <div className="border border-[#2b2214] bg-[#1a140d] p-5 rounded-lg space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <h3 className="text-body-sm font-semibold text-accent">Action Required to Activate Direct Payouts</h3>
                  <p className="text-body-xs text-[#d8c3a5] mt-1">
                    Complete listing details and Stripe validation before receiving automated job offers.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                {missingStripe && (
                  <button
                    onClick={handleStripeToggle}
                    id="simulate-stripe-btn"
                    className="bg-accent hover:bg-accent-hover text-ink-inverse text-caption font-bold px-4 py-2 rounded transition-colors"
                  >
                    Simulate Stripe Connect Setup
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Job Offers Inbox */}
          <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
            <h3 className="text-body-md font-semibold text-[#f2f2f2] flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-accent" /> Dispatch Job Inbox
            </h3>

            {offers.filter((o: any) => o.response === "pending").length === 0 ? (
              <p className="text-body-sm text-[#737373] italic py-4">No pending job offers at this time.</p>
            ) : (
              <div className="space-y-4">
                {offers.filter((o: any) => o.response === "pending").map((offer: any) => {
                  const intake = JSON.parse(offer.booking.intake);
                  return (
                    <div key={offer.id} className="border border-[#262626] bg-[#0d0d0d] p-5 rounded-lg space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-caption font-mono uppercase bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/20">
                            {offer.booking.vertical.toUpperCase()}
                          </span>
                          <h4 className="text-body-md font-semibold text-[#f2f2f2] mt-2">
                            {offer.booking.categorySlug.replace("-", " ").toUpperCase()}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-body-md font-bold text-accent">CHF {Number(offer.booking.totalAmountChf).toFixed(2)}</span>
                          <p className="text-body-xs text-[#737373] mt-0.5">Payout (85%): CHF {(Number(offer.booking.totalAmountChf) * 0.85).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-body-xs text-[#a6a6a6]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-[#737373]" />
                          <span>{new Date(offer.booking.scheduledAt).toLocaleDateString()} ({offer.booking.scheduledWindow})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#737373]" />
                          <span>{offer.booking.locationAddress}</span>
                        </div>
                      </div>

                      <div className="bg-[#141414] p-3 rounded text-body-xs text-[#a6a6a6] space-y-1">
                        <span className="font-semibold text-[#f2f2f2]">Intake specifications:</span>
                        {Object.entries(intake).map(([k, v]: any) => (
                          <div key={k} className="flex justify-between">
                            <span className="capitalize">{k}:</span>
                            <span className="text-[#f2f2f2]">{String(v)}</span>
                          </div>
                        ))}
                      </div>

                      {decliningOfferId === offer.id ? (
                        <div className="bg-[#141414] p-4 rounded border border-[#262626] space-y-3">
                          <label className="text-caption text-[#a6a6a6] font-semibold uppercase block">Reason for declining</label>
                          <select
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-xs outline-none focus:border-accent"
                          >
                            <option value="capacity">No availability / Fully booked</option>
                            <option value="region_too_far">Outside of operations radius</option>
                            <option value="price_too_low">Price is too low</option>
                            <option value="other">Other reason</option>
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOfferResponse(offer.id, "declined")}
                              className="bg-red-600 hover:bg-red-700 text-white text-caption font-bold px-3 py-1.5 rounded transition-colors"
                            >
                              Confirm Decline
                            </button>
                            <button
                              onClick={() => setDecliningOfferId(null)}
                              className="bg-[#262626] hover:bg-[#333] text-[#f2f2f2] text-caption font-bold px-3 py-1.5 rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleOfferResponse(offer.id, "accepted")}
                            id="accept-offer-btn"
                            className="bg-green-600 hover:bg-green-700 text-white text-caption font-bold px-4 py-2.5 rounded transition-colors"
                          >
                            Accept Job
                          </button>
                          <button
                            onClick={() => setDecliningOfferId(offer.id)}
                            className="border border-[#262626] bg-transparent hover:bg-red-950/20 text-[#a6a6a6] hover:text-red-400 text-caption font-bold px-4 py-2.5 rounded transition-colors"
                          >
                            Decline Job
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Assigned Jobs */}
          <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
            <h3 className="text-body-md font-semibold text-[#f2f2f2] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" /> Active Schedules
            </h3>

            {bookings.length === 0 ? (
              <p className="text-body-sm text-[#737373] italic py-4">No active cleaning schedules assigned.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#262626] text-[#737373] text-caption uppercase font-semibold">
                      <th className="py-3 px-2">Job ID</th>
                      <th className="py-3 px-2">Scheduled At</th>
                      <th className="py-3 px-2">Vertical / Category</th>
                      <th className="py-3 px-2">Address</th>
                      <th className="py-3 px-2">Amount</th>
                      <th className="py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking: any) => (
                      <tr key={booking.id} className="border-b border-[#1f1f1f] text-[#a6a6a6] hover:bg-[#1a1a1a]">
                        <td className="py-4 px-2 font-mono text-body-xs">{booking.id.substr(0, 8)}</td>
                        <td className="py-4 px-2 font-semibold text-[#f2f2f2]">
                          {new Date(booking.scheduledAt).toLocaleDateString()} ({booking.scheduledWindow})
                        </td>
                        <td className="py-4 px-2 capitalize">{booking.categorySlug.replace("-", " ")}</td>
                        <td className="py-4 px-2 truncate max-w-[200px]">{booking.locationAddress}</td>
                        <td className="py-4 px-2 text-[#f2f2f2] font-semibold">CHF {Number(booking.totalAmountChf).toFixed(2)}</td>
                        <td className="py-4 px-2">
                          <span className="text-caption uppercase bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-bold border border-green-500/20">
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Settings & Documents */}
        <div className="space-y-6">
          
          {/* Listings & Capabilities */}
          <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
            <h3 className="text-body-md font-semibold text-[#f2f2f2] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-accent" /> Active Listings
            </h3>

            <div className="space-y-4">
              {provider.listings.map((listing: any) => (
                <div key={listing.id} className="border border-[#262626] bg-[#0d0d0d] p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-body-xs uppercase text-[#f2f2f2]">
                      {listing.categorySlug.replace("-", " ")}
                    </span>
                    <span className={`text-caption uppercase font-bold ${
                      listing.active ? "text-green-400" : "text-yellow-400"
                    }`}>
                      {listing.active ? "Active" : "Paused"}
                    </span>
                  </div>

                  {editingListingId === listing.id ? (
                    <div className="space-y-3 pt-2 border-t border-[#262626]">
                      <div className="flex flex-col gap-1">
                        <label className="text-caption text-[#a6a6a6] uppercase font-semibold">Service Radius (km)</label>
                        <input
                          type="number"
                          value={listingRadius}
                          onChange={(e) => setListingRadius(Number(e.target.value))}
                          className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2 rounded text-body-xs outline-none focus:border-accent"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-caption text-[#a6a6a6] uppercase font-semibold">Capacity (jobs/day)</label>
                        <input
                          type="number"
                          value={listingCapacity}
                          onChange={(e) => setListingCapacity(Number(e.target.value))}
                          className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2 rounded text-body-xs outline-none focus:border-accent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={listingActive}
                          onChange={(e) => setListingActive(e.target.checked)}
                          className="rounded border-[#262626] accent-accent"
                        />
                        <span className="text-caption text-[#a6a6a6] uppercase">Active on marketplace</span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={saveListingEdit}
                          className="bg-accent hover:bg-accent-hover text-ink-inverse text-caption font-bold px-3 py-1.5 rounded transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingListingId(null)}
                          className="bg-[#262626] text-[#f2f2f2] text-caption font-bold px-3 py-1.5 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center pt-1">
                      <div className="text-body-xs text-[#a6a6a6] space-y-0.5">
                        <p>Radius: {listing.serviceRadiusKm} km</p>
                        <p>Capacity: {listing.capacityPerDay} jobs/day</p>
                      </div>
                      <button
                        onClick={() => startEditListing(listing)}
                        className="border border-[#262626] hover:bg-[#1a1a1a] text-[#f2f2f2] text-caption px-3 py-1.5 rounded transition-colors"
                      >
                        Adjust
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Compliance & KYC Documents */}
          <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
            <h3 className="text-body-md font-semibold text-[#f2f2f2] flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-accent" /> KYC Compliance
            </h3>

            {/* Upload form */}
            <form onSubmit={handleDocUpload} className="space-y-3 bg-[#0d0d0d] p-4 rounded-lg border border-[#262626]">
              <div className="flex flex-col gap-1">
                <label className="text-caption text-[#a6a6a6] uppercase font-semibold">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2 rounded text-body-xs outline-none focus:border-accent"
                >
                  <option value="insurance">Liability Insurance Certificate</option>
                  <option value="criminal_record">Criminal Record Extract</option>
                  <option value="vat_cert">VAT Certificate</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-caption text-[#a6a6a6] uppercase font-semibold">Mock Document URL</label>
                <input
                  type="text"
                  required
                  placeholder="/uploads/my-doc.pdf"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2 rounded text-body-xs outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingDoc}
                className="w-full bg-[#1c1c1c] hover:bg-[#262626] border border-[#262626] text-[#f2f2f2] text-caption font-bold py-2 rounded transition-colors"
              >
                {uploadingDoc ? "UPLOADING..." : "UPLOAD COMPLIANCE FILE"}
              </button>
            </form>

            {/* List of uploaded documents */}
            <div className="space-y-2">
              {provider.documents.length === 0 ? (
                <p className="text-body-xs text-[#737373] italic">No KYC documents uploaded yet.</p>
              ) : (
                provider.documents.map((doc: any) => (
                  <div key={doc.id} className="flex justify-between items-center bg-[#0d0d0d] p-3 rounded border border-[#1f1f1f] text-body-xs">
                    <div>
                      <span className="font-semibold capitalize text-[#f2f2f2]">{doc.docType.replace("_", " ")}</span>
                      <p className="text-[#737373] font-mono text-[10px] mt-0.5">{doc.fileUrl}</p>
                    </div>
                    {doc.verified ? (
                      <span className="text-green-400 font-bold text-caption flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-yellow-400 font-bold text-caption">Pending</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
