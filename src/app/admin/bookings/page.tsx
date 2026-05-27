"use client";

import React, { useState, useEffect } from "react";
import { getBookingsList, getPartnersList, assignPartnerTeam, updateBookingStatus, deleteCustomerDataGDPR } from "@/app/actions/admin";
import { BookOpen, User, MapPin, Eye, Trash2, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Details drawer
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

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
      // Extract teams
      const allTeams: any[] = [];
      resP.partners.forEach((p: any) => {
        if (p.teams) {
          p.teams.forEach((t: any) => {
            allTeams.push({
              ...t,
              partnerName: p.name
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

  const handleAssignTeam = async (bookingId: string, teamId: string) => {
    setError("");
    setSuccessMsg("");
    const res = await assignPartnerTeam(bookingId, teamId || null);
    if (res.success) {
      setSuccessMsg("Subcontractor team updated successfully");
      loadData();
    } else {
      setError(res.error || "Failed to assign partner team");
    }
  };

  const handleStatusChange = async (bookingId: string, status: string) => {
    setError("");
    setSuccessMsg("");
    const res = await updateBookingStatus(bookingId, status);
    if (res.success) {
      setSuccessMsg("Booking status updated successfully");
      loadData();
    } else {
      setError(res.error || "Failed to update status");
    }
  };

  const handleDeleteGDPR = async (email: string) => {
    if (!window.confirm(`WARNING: GDPR Request. This will permanently delete all logs, reviews, payments, and bookings associated with customer email: ${email}. Are you absolutely sure?`)) {
      return;
    }
    setError("");
    setSuccessMsg("");
    const res = await deleteCustomerDataGDPR(email);
    if (res.success) {
      setSuccessMsg(`GDPR deletion complete for ${email}`);
      loadData();
      if (selectedBooking?.guestEmail === email) {
        setSelectedBooking(null);
      }
    } else {
      setError(res.error || "Failed to execute GDPR deletion");
    }
  };

  return (
    <div className="p-8 md:p-12 space-y-8 max-w-7xl w-full mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <span className="text-caption text-accent uppercase tracking-widest block mb-2 font-semibold">Active Dispatch</span>
          <h1 className="text-display-md font-display font-medium text-[#f2f2f2] tracking-tight">
            Bookings Dashboard
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
          Loading dispatches from SQLite...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Bookings Table */}
          <div className="lg:col-span-2 border border-[#262626] bg-[#141414] rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#262626]">
              <span className="text-body-md font-semibold text-[#f2f2f2] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" /> Active Bookings List ({bookings.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#262626] text-caption uppercase text-[#a6a6a6] bg-[#0d0d0d]">
                    <th className="p-4 font-semibold">Service Date</th>
                    <th className="p-4 font-semibold">Customer</th>
                    <th className="p-4 font-semibold">Service Details</th>
                    <th className="p-4 font-semibold">Partner Assigned</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626] text-body-sm text-[#f2f2f2]">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-4 font-medium">
                        {new Date(booking.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
                          value={booking.partnerTeamId || ""}
                          onChange={(e) => handleAssignTeam(booking.id, e.target.value)}
                          className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2 rounded-md focus:border-accent outline-none text-body-xs font-semibold w-full"
                        >
                          <option value="">Unassigned</option>
                          {partners
                            .filter(t => JSON.parse(t.serviceCategories).includes(booking.categorySlug))
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.partnerName} - {t.name}
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
                              : "text-accent"
                          }`}
                        >
                          <option value="draft">Draft</option>
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
                        No active bookings logged in SQLite database yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Drawer */}
          <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-6">
            {selectedBooking ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-body-md font-semibold text-[#f2f2f2]">Intake Details</h3>
                    <span className="text-caption text-accent uppercase font-mono block">ID: {selectedBooking.id.substring(0, 8)}</span>
                  </div>
                  <span className={`text-caption uppercase px-2 py-1 rounded font-bold ${
                    selectedBooking.status === "completed" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-accent/10 text-accent border border-accent/20"
                  }`}>
                    {selectedBooking.status}
                  </span>
                </div>

                <div className="space-y-4 text-body-sm">
                  <div className="flex gap-3">
                    <User className="w-5 h-5 text-[#a6a6a6] shrink-0" />
                    <div>
                      <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">Contact Email</span>
                      <span className="font-medium text-[#f2f2f2]">{selectedBooking.guestEmail}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-[#a6a6a6] shrink-0" />
                    <div>
                      <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">Service Location</span>
                      <span className="font-medium text-[#f2f2f2]">{selectedBooking.locationAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#262626] pt-4">
                  <span className="text-caption text-[#a6a6a6] block uppercase font-semibold mb-3">Intake Schema Variables</span>
                  <pre className="bg-[#0d0d0d] p-4 rounded-md border border-[#262626] text-body-xs font-mono overflow-auto max-h-60 text-accent">
                    {JSON.stringify(JSON.parse(selectedBooking.intake), null, 2)}
                  </pre>
                </div>

                <div className="border-t border-[#262626] pt-6 flex flex-col gap-3">
                  <button
                    onClick={() => handleDeleteGDPR(selectedBooking.guestEmail)}
                    className="w-full border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 text-button font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
                  >
                    <Trash2 className="w-4 h-4" /> Permanent GDPR Deletion
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-[#a6a6a6] space-y-2">
                <AlertTriangle className="w-8 h-8 mx-auto text-[#a6a6a6]/50" />
                <p className="text-body-sm">Select a booking from the list to inspect client intake forms and perform dispatches.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
