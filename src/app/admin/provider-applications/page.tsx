"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProviderApplications, reviewApplication, isAdminAuthenticated } from "@/app/actions/admin";
import { ShieldCheck, UserCheck, Trash2, Calendar, FileText, Check, X, Info } from "lucide-react";

export default function AdminProviderApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decisionNotes, setDecisionNotes] = useState<{ [key: string]: string }>({});

  const checkAuthAndLoad = async () => {
    setLoading(true);
    const auth = await isAdminAuthenticated();
    if (!auth) {
      router.push("/admin/login");
      return;
    }

    const res = await getProviderApplications();
    if (res.success) {
      setApplications(res.applications);
    } else {
      setError(res.error || "Failed to load applications");
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const handleReview = async (appId: string, status: "approved" | "rejected" | "info_requested") => {
    const notes = decisionNotes[appId] || "";
    const res = await reviewApplication({
      applicationId: appId,
      status,
      decisionNotes: notes
    });

    if (res.success) {
      checkAuthAndLoad(); // reload list
    } else {
      alert("Failed to review application: " + res.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#f2f2f2] font-body flex justify-center items-center">
        <p className="text-body-md font-mono text-accent animate-pulse">LOADING APPLICATION QUEUE...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <span className="text-caption text-accent uppercase tracking-widest font-semibold">Super-Admin Backoffice</span>
        <h1 className="text-display-md font-display font-medium text-[#f2f2f2] tracking-tight">
          Subcontractor Application Queue
        </h1>
        <p className="text-body-xs text-[#a6a6a6]">Review corporate registrations, check VAT validity and approve partners.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md text-body-sm">
          {error}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="border border-[#262626] bg-[#141414] p-12 text-center rounded-lg space-y-2">
          <FileText className="w-12 h-12 text-[#595959] mx-auto animate-pulse" />
          <h3 className="text-body-md font-semibold text-[#f2f2f2]">No applications submitted</h3>
          <p className="text-body-xs text-[#a6a6a6]">New subcontractor registrations will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => {
            const data = JSON.parse(app.applicationData || "{}");
            return (
              <div key={app.id} className="border border-[#262626] bg-[#141414] p-6 rounded-lg grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Applicant Profile */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-body-md font-semibold text-[#f2f2f2]">{app.companyName}</h3>
                    <p className="text-body-xs text-[#a6a6a6] font-mono capitalize">
                      {app.legalEntityType} | Region: {app.region}
                    </p>
                  </div>
                  <div className="text-body-xs text-[#a6a6a6] space-y-1">
                    <p>Applicant: <span className="text-[#f2f2f2]">{app.applicantName}</span></p>
                    <p>Email: <span className="text-[#f2f2f2]">{app.applicantEmail}</span></p>
                    <p className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-caption uppercase font-bold px-2 py-0.5 rounded border ${
                      app.status === "approved"
                        ? "bg-green-500/10 text-green-400 border-green-500/25"
                        : app.status === "rejected"
                        ? "bg-red-500/10 text-red-400 border-red-500/25"
                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/25"
                    }`}>
                      Status: {app.status}
                    </span>
                  </div>
                </div>

                {/* Vertical Choices & Motivation */}
                <div className="space-y-3">
                  <div>
                    <span className="text-caption text-[#737373] uppercase font-bold block mb-1">Verticals requested</span>
                    <div className="flex flex-wrap gap-1.5">
                      {app.verticalsRequested.split(",").map((v: string) => (
                        <span key={v} className="bg-accent/15 text-accent text-[10px] font-bold px-2 py-0.5 rounded border border-accent/25 uppercase font-mono">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-body-xs text-[#a6a6a6] space-y-1">
                    <span className="text-caption text-[#737373] uppercase font-bold block">Business Motivation</span>
                    <p className="italic bg-[#0d0d0d] p-3 rounded border border-[#1f1f1f] leading-relaxed">
                      "{data.motivation || "No motivation provided."}"
                    </p>
                  </div>
                </div>

                {/* Operations Review Controls */}
                <div className="flex flex-col justify-between space-y-4">
                  {app.status === "submitted" || app.status === "under_review" ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-caption text-[#737373] uppercase font-bold">Decision Note / Internal notes</label>
                        <textarea
                          rows={2}
                          placeholder="Check Swiss business records..."
                          value={decisionNotes[app.id] || ""}
                          onChange={(e) => setDecisionNotes({ ...decisionNotes, [app.id]: e.target.value })}
                          className="border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded text-body-xs outline-none focus:border-accent resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(app.id, "approved")}
                          id={`approve-btn-${app.id}`}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-caption font-bold py-2 rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleReview(app.id, "rejected")}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-caption font-bold py-2 rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                        <button
                          onClick={() => handleReview(app.id, "info_requested")}
                          className="border border-[#262626] bg-transparent text-[#a6a6a6] hover:bg-[#1f1f1f] text-caption font-bold py-2 px-3 rounded transition-colors"
                        >
                          Need Info
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0d0d0d] p-4 rounded border border-[#1f1f1f] text-body-xs text-[#737373]">
                      <span className="text-[#a6a6a6] font-semibold block mb-1">Decision details:</span>
                      <p>Processed: {app.decisionAt ? new Date(app.decisionAt).toLocaleDateString() : "n/a"}</p>
                      {app.decisionNotes && <p className="mt-2 italic">"{app.decisionNotes}"</p>}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
