"use client";

import React, { useState, useEffect } from "react";
import { getRecurringSchedulesList, updateRecurringScheduleStatus } from "@/app/actions/admin";
import { RefreshCw, Play, Pause, XCircle, User, Calendar, CreditCard, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function RecurringSchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    const res = await getRecurringSchedulesList();
    setLoading(false);
    if (res.success && res.schedules) {
      setSchedules(res.schedules);
    } else {
      setError(res.error || "Failed to load recurring schedules");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (scheduleId: string, newStatus: string) => {
    setError("");
    setSuccess("");
    setActionLoadingId(scheduleId);
    
    const res = await updateRecurringScheduleStatus(scheduleId, newStatus);
    setActionLoadingId(null);

    if (res.success) {
      setSuccess(`Recurring schedule status updated to ${newStatus} successfully.`);
      // Refresh local list
      setSchedules(prev => prev.map(item => {
        if (item.id === scheduleId) {
          return { ...item, status: newStatus };
        }
        return item;
      }));
    } else {
      setError(res.error || "Failed to update status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "paused":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "bg-accent/10 text-accent border border-accent/20";
    }
  };

  return (
    <div className="p-8 md:p-12 space-y-8 max-w-7xl w-full mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <span className="text-caption text-accent uppercase tracking-widest block mb-2 font-semibold">Subscription Engine</span>
          <h1 className="text-display-md font-display font-medium text-[#f2f2f2] tracking-tight">
            Recurring Schedules
          </h1>
        </div>
        <button
          onClick={loadData}
          className="border border-[#262626] bg-[#141414] hover:bg-[#1f1f1f] text-[#f2f2f2] px-4 py-2.5 rounded-md text-caption uppercase font-semibold transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
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

      {loading ? (
        <div className="text-center py-12 text-[#a6a6a6] text-body-sm flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span>Loading schedules database...</span>
        </div>
      ) : (
        <div className="border border-[#262626] bg-[#141414] rounded-lg overflow-hidden">
          <div className="p-6 border-b border-[#262626]">
            <span className="text-body-md font-semibold text-[#f2f2f2]">
              Active Subscriptions ({schedules.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#262626] text-caption uppercase text-[#a6a6a6] bg-[#0d0d0d]">
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Service Vertical</th>
                  <th className="p-4 font-semibold">Frequency & Time</th>
                  <th className="p-4 font-semibold">Next Scheduled Run</th>
                  <th className="p-4 font-semibold">Simulated Stripe Sub</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-center">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-body-sm text-[#f2f2f2]">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-accent shrink-0" />
                        <div>
                          <span className="block font-semibold text-[#f2f2f2]">{schedule.customer?.name || "Customer"}</span>
                          <span className="block text-caption text-[#a6a6a6]">{schedule.customer?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium capitalize">
                      {schedule.categorySlug} cleaning
                    </td>
                    <td className="p-4">
                      <span className="block font-medium capitalize text-accent">{schedule.frequency}</span>
                      <span className="block text-caption text-[#a6a6a6] capitalize">
                        Day {schedule.dayOfWeek} • {schedule.timeWindow}
                      </span>
                    </td>
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#a6a6a6] shrink-0" />
                        <span>
                          {new Date(schedule.nextRunAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-caption text-[#a6a6a6]">
                      <div className="flex items-center gap-1.5 bg-[#0d0d0d] px-2 py-1.5 rounded border border-[#262626] w-max">
                        <CreditCard className="w-3.5 h-3.5 text-accent" />
                        <span>{schedule.stripeSubscriptionId}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-caption uppercase px-2 py-1.5 rounded font-bold ${getStatusBadge(schedule.status)}`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {schedule.status === "active" ? (
                          <button
                            onClick={() => handleStatusChange(schedule.id, "paused")}
                            disabled={actionLoadingId === schedule.id}
                            className="border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 disabled:opacity-50 text-yellow-400 p-2 rounded transition-colors"
                            title="Pause Schedule"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        ) : schedule.status === "paused" ? (
                          <button
                            onClick={() => handleStatusChange(schedule.id, "active")}
                            disabled={actionLoadingId === schedule.id}
                            className="border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 disabled:opacity-50 text-green-400 p-2 rounded transition-colors"
                            title="Resume Schedule"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        ) : null}

                        {schedule.status !== "cancelled" && (
                          <button
                            onClick={() => handleStatusChange(schedule.id, "cancelled")}
                            disabled={actionLoadingId === schedule.id}
                            className="border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 disabled:opacity-50 text-red-400 p-2 rounded transition-colors"
                            title="Cancel Schedule"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {schedules.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#a6a6a6]">
                      No active recurring subscriptions found in SQLite database yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
