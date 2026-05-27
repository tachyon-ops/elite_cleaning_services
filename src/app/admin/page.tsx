import React from "react";
import { redirect } from "next/navigation";
import { isAdminAuthenticated, getDashboardStats } from "@/app/actions/admin";
import { Calendar, CreditCard, Star, Clock, AlertCircle } from "lucide-react";

export default async function AdminDashboardPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }

  const res = await getDashboardStats();
  const stats = res.success && res.stats ? res.stats : {
    bookingsCount: 0,
    activeBookings: 0,
    completedBookings: 0,
    revenueMTD: 0,
    avgRating: 5.0
  };

  return (
    <div className="p-8 md:p-12 space-y-8 max-w-7xl w-full mx-auto">
      <header>
        <span className="text-caption text-accent uppercase tracking-widest block mb-2">Operations Hub</span>
        <h1 className="text-display-md font-display font-medium text-[#f2f2f2] tracking-tight">
          System Overview
        </h1>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center text-[#a6a6a6]">
            <span className="text-caption font-semibold uppercase tracking-wider">Active Bookings</span>
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-display-sm font-bold text-[#f2f2f2] block">{stats.activeBookings}</span>
            <span className="text-body-xs text-[#a6a6a6]">Pending dispatcher dispatches</span>
          </div>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center text-[#a6a6a6]">
            <span className="text-caption font-semibold uppercase tracking-wider">Revenue MTD</span>
            <CreditCard className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-display-sm font-bold text-[#f2f2f2] block">CHF {stats.revenueMTD}</span>
            <span className="text-body-xs text-[#a6a6a6]">From completed deposits</span>
          </div>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center text-[#a6a6a6]">
            <span className="text-caption font-semibold uppercase tracking-wider">Total Bookings</span>
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-display-sm font-bold text-[#f2f2f2] block">{stats.bookingsCount}</span>
            <span className="text-body-xs text-[#a6a6a6]">All logged bookings</span>
          </div>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center text-[#a6a6a6]">
            <span className="text-caption font-semibold uppercase tracking-wider">Avg Rating</span>
            <Star className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-display-sm font-bold text-[#f2f2f2] block">{stats.avgRating} / 5</span>
            <span className="text-body-xs text-[#a6a6a6]">Customer satisfaction index</span>
          </div>
        </div>
      </div>

      {/* Quick Action / Notice */}
      <div className="border border-accent/20 bg-accent-soft p-6 rounded-lg flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-accent shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-body-md font-semibold text-[#f2f2f2]">Role-based Access & Dispatcher Control</h3>
          <p className="text-body-sm text-[#a6a6a6] max-w-[80ch]">
            From the sidebar menu, select **Bookings & Dispatch** to inspect client intake forms, re-assign dispatches to local subcontractor partners, process cancellations, or execute GDPR-compliant data deletions.
          </p>
        </div>
      </div>
    </div>
  );
}
