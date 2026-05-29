import React from "react";
import Link from "next/link";
import { ShieldCheck, TrendingUp, Handshake, CheckSquare, ChevronRight } from "lucide-react";

export default function ProvidersLandingPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-[#f2f2f2] font-body relative overflow-hidden">
      {/* Radial grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(197,160,89,0.05),transparent_60%)] pointer-events-none" />

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-[#1f1f1f]">
        <Link href="/" className="font-display font-medium text-body-lg tracking-widest text-[#f2f2f2] hover:text-accent transition-colors">
          ELITE CLEANING
        </Link>
        <div className="flex gap-4 items-center">
          <Link
            href="/providers/account/login"
            className="text-body-sm font-medium text-[#a6a6a6] hover:text-[#f2f2f2] transition-colors mr-2"
          >
            Sign In
          </Link>
          <Link
            href="/providers/apply"
            className="bg-accent hover:bg-accent-hover text-ink-inverse text-button px-5 py-2.5 rounded font-semibold transition-colors"
          >
            Apply to Join
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center py-20 px-6 space-y-6">
        <span className="text-caption text-accent uppercase tracking-widest font-semibold">Service Partner Network</span>
        <h1 className="text-display-lg md:text-display-xl font-display font-medium text-[#f2f2f2] tracking-tight leading-tight">
          Partner with the Swiss Leader in Specialty Cleaning
        </h1>
        <p className="text-body-lg text-[#a6a6a6] max-w-2xl mx-auto leading-relaxed">
          Access premium client accounts across aviation, marine, and commercial sectors. Fill your schedules with high-value, pre-paid jobs.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/providers/apply"
            className="bg-accent hover:bg-accent-hover text-ink-inverse text-button px-8 py-4 rounded font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Submit Application <ChevronRight className="w-4 h-4" />
          </Link>
          <a
            href="#requirements"
            className="border border-[#262626] bg-[#141414] hover:bg-[#1f1f1f] text-[#f2f2f2] text-button px-8 py-4 rounded font-semibold transition-colors flex items-center justify-center"
          >
            Review Requirements
          </a>
        </div>
      </section>

      {/* Three Columns Offer */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-[#1f1f1f] grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="border border-[#262626] bg-[#141414] p-8 rounded-lg space-y-4">
          <div className="h-12 w-12 bg-accent/10 text-accent rounded-full flex items-center justify-center border border-accent/25">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-body-lg font-semibold text-[#f2f2f2]">Qualified Jobs, Not Leads</h3>
          <p className="text-body-sm text-[#a6a6a6] leading-relaxed">
            Every booking is fully paid and secure. You accept pre-qualified client cleanings without competing or bidding.
          </p>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-8 rounded-lg space-y-4">
          <div className="h-12 w-12 bg-accent/10 text-accent rounded-full flex items-center justify-center border border-accent/25">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-body-lg font-semibold text-[#f2f2f2]">Transparent Economics</h3>
          <p className="text-body-sm text-[#a6a6a6] leading-relaxed">
            Keep up to 85% of job value. Direct weekly payouts via Stripe Connect. No registration fees or hidden subscription costs.
          </p>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-8 rounded-lg space-y-4">
          <div className="h-12 w-12 bg-accent/10 text-accent rounded-full flex items-center justify-center border border-accent/25">
            <Handshake className="w-6 h-6" />
          </div>
          <h3 className="text-body-lg font-semibold text-[#f2f2f2]">Premium Brand Association</h3>
          <p className="text-body-sm text-[#a6a6a6] leading-relaxed">
            Deliver services to high-net-worth clients, flight departments, yacht management crews, and luxury rental properties.
          </p>
        </div>
      </section>

      {/* Requirements Section */}
      <section id="requirements" className="max-w-4xl mx-auto px-6 py-16 space-y-10 border-t border-[#1f1f1f]">
        <div className="text-center space-y-3">
          <h2 className="text-display-md font-display font-medium text-[#f2f2f2] tracking-tight">Marketplace Compliance</h2>
          <p className="text-body-md text-[#a6a6a6]">We enforce absolute compliance to protect Swiss clients.</p>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-8 rounded-lg space-y-6">
          <h3 className="text-body-md font-semibold text-[#f2f2f2] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" /> Minimum Prerequisites to Apply
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-sm text-[#a6a6a6]">
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 bg-accent rounded-full" /> Registered Swiss Business (AG, GmbH, or Einzelfirma)
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 bg-accent rounded-full" /> Business Liability Insurance (Betriebshaftpflicht) Min CHF 5M
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 bg-accent rounded-full" /> Verified VAT ID (if turnover exceeds CHF 100K)
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 bg-accent rounded-full" /> Clean Criminal Records for all dispatch personnel
            </li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1f1f1f] bg-[#0d0d0d] py-8 text-center text-[#595959] text-body-xs font-mono">
        &copy; {new Date().getFullYear()} Elite Cleaning Platform AG. All Swiss partner rights reserved.
      </footer>
    </div>
  );
}
