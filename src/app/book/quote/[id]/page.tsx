"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { localizeHref } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { getBookingQuoteDetails, acceptQuoteAndPayDeposit, rejectQuote } from "@/app/actions/booking";
import { Shield, Check, Lock, CreditCard, Calendar, Clock, MapPin, Mail, AlertTriangle, ArrowRight, Plane, Ship } from "lucide-react";

export default function QuoteAcceptancePage() {
  const { locale } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Decline flow states
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declining, setDeclining] = useState(false);
  const [declined, setDeclined] = useState(false);

  // Card input states
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const loadData = () => {
    if (id) {
      setLoading(true);
      getBookingQuoteDetails(id).then((res) => {
        setLoading(false);
        if (res.success && res.booking) {
          setBooking(res.booking);
        } else {
          setError(res.error || "Failed to load quote details.");
        }
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setSubmittingPayment(true);
    setError("");

    // Simulated Stripe Deposit payment
    const res = await acceptQuoteAndPayDeposit({
      bookingId: booking.id,
      paymentMethodId: "pm_mock_visa"
    });

    setSubmittingPayment(false);

    if (res.success) {
      setSuccess(true);
      loadData();
    } else {
      setError(res.error || "Simulated payment processing failed.");
    }
  };

  const handleDecline = async () => {
    if (!booking) return;
    setDeclining(true);
    setError("");
    const res = await rejectQuote({ bookingId: booking.id, reason: declineReason || undefined });
    setDeclining(false);
    if (res.success) {
      setDeclined(true);
      setShowDeclineModal(false);
      loadData();
    } else {
      setError(res.error || "Failed to decline quote.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-[#f2f2f2] font-medium text-body-md">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span>Retrieving bespoke quote details...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-[#f2f2f2] p-6">
        <div className="border border-[#262626] bg-[#141414] p-8 rounded-lg max-w-md w-full text-center space-y-6">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-400" />
          <h2 className="text-display-xs font-semibold">Quote Not Found</h2>
          <p className="text-body-sm text-[#a6a6a6] leading-relaxed">
            The requested booking or quote could not be located. It may have expired or been deleted. Please check your link or contact flight operations support.
          </p>
          <Link
            href={localizeHref("/", locale)}
            className="inline-block border border-accent bg-accent/10 text-accent hover:bg-accent/20 px-6 py-3 rounded-md transition-colors text-button font-semibold uppercase tracking-wider text-xs"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-[#f2f2f2] p-6">
        <div className="border border-[#262626] bg-[#141414] p-8 rounded-lg max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-[#141414] border border-[#262626] rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-[#22c55e]" />
          </div>
          <h2 className="text-xl font-semibold">Quote Declined</h2>
          <p className="text-sm text-[#a6a6a6] leading-relaxed">
            Your CHF 50.00 pre-booking hold has been released. No charges will be applied to your card.
          </p>
          <Link
            href={localizeHref("/", locale)}
            className="inline-block border border-accent bg-accent/10 text-accent hover:bg-accent/20 px-6 py-3 rounded-md transition-colors text-xs font-semibold uppercase tracking-wider"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const intakeDetails = booking.intake ? JSON.parse(booking.intake) : {};
  const isAviation = booking.categorySlug === "aviation";
  const isYacht = booking.categorySlug === "yacht";
  const validUntilStr = booking.quote?.validUntil
    ? new Date(booking.quote.validUntil).toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric"
      })
    : "N/A";

  const isExpired = booking.quote?.validUntil && new Date() > new Date(booking.quote.validUntil);
  const isPaid = ["confirmed", "assigned", "offer_dispatched", "completed"].includes(booking.status);

  return (
    <div className="min-h-screen bg-[#080808] text-[#f2f2f2] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#262626] bg-[#141414]/90 backdrop-blur-md sticky top-0 z-50 py-5">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Logo locale={locale} variant="light" />
          <div className="text-caption font-mono text-[#a6a6a6]">
            REF: {booking.id.substring(0, 8).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-16">
        {/* Status Banners */}
        {booking.status === "quote_pending" && (
          <div className="bg-accent/10 border border-accent/20 p-6 rounded-lg mb-8 space-y-2 text-center max-w-3xl mx-auto">
            <Clock className="w-8 h-8 mx-auto text-accent mb-2" />
            <h3 className="text-body-md font-semibold text-accent uppercase tracking-wide">Bespoke Quote Pending</h3>
            <p className="text-body-sm text-[#a6a6a6] leading-relaxed">
              Our specialty operations desk is currently reviewing the detailing requirements for your{" "}
              {isAviation ? "aircraft" : isYacht ? "vessel" : "service"}. We will calculate custom pricing and send the
              quote to you shortly.
            </p>
          </div>
        )}

        {isExpired && !isPaid && (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-lg mb-8 space-y-2 text-center max-w-3xl mx-auto">
            <AlertTriangle className="w-8 h-8 mx-auto text-red-400 mb-2" />
            <h3 className="text-body-md font-semibold text-red-400 uppercase tracking-wide">Bespoke Quote Expired</h3>
            <p className="text-body-sm text-[#a6a6a6] leading-relaxed">
              This bespoke quote expired on {validUntilStr}. Please contact support or request a new booking session to get updated pricing.
            </p>
          </div>
        )}

        {isPaid && (
          <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-lg mb-8 space-y-2 text-center max-w-3xl mx-auto">
            <Check className="w-8 h-8 mx-auto text-green-400 mb-2" />
            <h3 className="text-body-md font-semibold text-green-400 uppercase tracking-wide">Bespoke Dispatch Active</h3>
            <p className="text-body-sm text-[#a6a6a6] leading-relaxed">
              Bespoke quote accepted. The 30% deposit of CHF {booking.depositAmountChf} has been processed successfully. Your dispatch is currently active, and the subcontracting team has been alerted.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Scope & Specification */}
          <div className="lg:col-span-7 space-y-8">
            <div className="border border-[#262626] bg-[#141414] p-6 md:p-8 rounded-lg space-y-6">
              <div className="flex items-center gap-3">
                {isAviation ? (
                  <Plane className="w-7 h-7 text-accent" />
                ) : isYacht ? (
                  <Ship className="w-7 h-7 text-accent" />
                ) : (
                  <Shield className="w-7 h-7 text-accent" />
                )}
                <div>
                  <span className="text-caption text-accent uppercase tracking-widest font-mono block">Specialty Detailing</span>
                  <h2 className="text-display-sm font-display font-medium text-[#f2f2f2] capitalize">
                    {booking.vertical} Cleaning Request
                  </h2>
                </div>
              </div>

              {/* Service details list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-[#262626] pt-6 text-body-sm">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Calendar className="w-4 h-4 text-[#a6a6a6] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">Service Date</span>
                      <span className="font-semibold text-[#f2f2f2]">
                        {new Date(booking.scheduledAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Clock className="w-4 h-4 text-[#a6a6a6] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">Preferred Window</span>
                      <span className="font-semibold text-[#f2f2f2] capitalize">{booking.scheduledWindow}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <MapPin className="w-4 h-4 text-[#a6a6a6] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">Location / Base</span>
                      <span className="font-semibold text-[#f2f2f2]">{booking.locationAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {isAviation && (
                    <>
                      <div>
                        <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">Aircraft Type</span>
                        <span className="font-semibold text-[#f2f2f2] capitalize">
                          {intakeDetails.aircraftType?.replace("_", " ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">Tail Number</span>
                        <span className="font-semibold text-accent uppercase font-mono">
                          {intakeDetails.tailNumber || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">FBO Operator</span>
                        <span className="font-semibold text-[#f2f2f2]">{intakeDetails.fboLocation}</span>
                      </div>
                    </>
                  )}

                  {isYacht && (
                    <>
                      <div>
                        <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">Vessel Class</span>
                        <span className="font-semibold text-[#f2f2f2] capitalize">
                          {intakeDetails.vesselType?.replace("_", " ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">Vessel Length</span>
                        <span className="font-semibold text-[#f2f2f2]">{intakeDetails.vesselLength} Feet</span>
                      </div>
                      <div>
                        <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">Marina Berth</span>
                        <span className="font-semibold text-[#f2f2f2]">{intakeDetails.marinaLocation}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Cleaning scopes */}
              <div className="border-t border-[#262626] pt-6">
                <span className="text-caption text-[#a6a6a6] block uppercase font-semibold mb-3">Requested Detailing Scope</span>
                <div className="flex flex-wrap gap-2">
                  {isAviation &&
                    intakeDetails.aviationScope?.map((sc: string) => (
                      <span
                        key={sc}
                        className="border border-[#262626] bg-[#0d0d0d] text-accent font-mono text-body-xs uppercase px-3 py-1.5 rounded-full"
                      >
                        {sc?.replace("_", " ")}
                      </span>
                    ))}
                  {isYacht &&
                    intakeDetails.yachtScope?.map((sc: string) => (
                      <span
                        key={sc}
                        className="border border-[#262626] bg-[#0d0d0d] text-accent font-mono text-body-xs uppercase px-3 py-1.5 rounded-full"
                      >
                        {sc?.replace("_", " ")}
                      </span>
                    ))}
                </div>
              </div>

              {/* Operator notes */}
              {booking.quote?.notes && (
                <div className="border-t border-[#262626] pt-6 space-y-2">
                  <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">Operator Specifications</span>
                  <div className="p-4 bg-accent/5 border border-accent/10 rounded-md text-body-sm italic text-[#d4d4d4] leading-relaxed">
                    "{booking.quote.notes}"
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing Breakdown & Payment */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-[#262626] bg-[#141414] p-6 md:p-8 rounded-lg space-y-6">
              <h3 className="text-body-md font-semibold text-[#f2f2f2] uppercase tracking-wide">Financial Proposal</h3>

              {booking.status === "quote_pending" ? (
                <div className="py-6 text-center space-y-2">
                  <span className="text-caption text-[#a6a6a6] block uppercase font-semibold">Bespoke Price</span>
                  <span className="text-display-md font-display font-medium text-accent">Pending Desk Review</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Prices */}
                  <div className="bg-[#0d0d0d] p-4 rounded-md border border-[#262626] divide-y divide-[#262626] text-body-sm font-semibold">
                    <div className="flex justify-between pb-3">
                      <span className="text-[#a6a6a6]">Bespoke Rate</span>
                      <span className="text-[#f2f2f2]">CHF {booking.totalAmountChf}</span>
                    </div>
                    <div className="flex justify-between pt-3">
                      <span className="text-accent uppercase tracking-wider font-mono">1/3 Deposit on acceptance:</span>
                      <span className="text-[#f2f2f2]">CHF {booking.depositAmountChf.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-3">
                      <span className="text-accent uppercase tracking-wider font-mono">Pre-booking hold applied:</span>
                      <span className="text-green-400">-CHF {booking.prebookingDepositChf?.toFixed(2) || '50.00'}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-[#262626] mt-3">
                      <span className="text-accent uppercase tracking-wider font-mono">Amount due now:</span>
                      <span className="text-accent text-body-md font-bold">CHF {(booking.depositAmountChf - (booking.prebookingDepositChf || 50)).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-caption text-[#a6a6a6] leading-relaxed">
                    Note: A secure 30% deposit is required to assign your dispatch to our vetted teams. The remaining 70% is collected via invoicing post-service completion.
                  </div>

                  <div className="flex items-center gap-2 border-t border-[#262626] pt-4 font-mono text-caption text-[#a6a6a6]">
                    <Clock className="w-4 h-4 text-accent shrink-0" />
                    <span>Quote Proposal Valid Until: <span className="text-accent font-semibold">{validUntilStr}</span></span>
                  </div>
                </div>
              )}

              {/* Checkout Form */}
              {booking.status === "quote_sent" && !isExpired && (
                <form onSubmit={handlePayment} className="border-t border-[#262626] pt-6 space-y-4">
                  <div className="flex items-center justify-between text-caption font-semibold uppercase tracking-wider text-[#a6a6a6] mb-1">
                    <span>Credit Card Checkout</span>
                    <span className="flex items-center gap-1 text-accent text-body-xs font-mono lowercase">
                      <Lock className="w-3.5 h-3.5" /> secure link
                    </span>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md text-body-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3 text-body-sm">
                    <div>
                      <label className="text-caption text-[#a6a6a6] block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded-md focus:border-accent outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-caption text-[#a6a6a6] block mb-1">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          required
                          className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 pl-10 rounded-md focus:border-accent outline-none font-medium font-mono"
                        />
                        <CreditCard className="w-4 h-4 text-[#a6a6a6] absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-caption text-[#a6a6a6] block mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          maxLength={5}
                          required
                          className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded-md focus:border-accent outline-none font-medium font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-caption text-[#a6a6a6] block mb-1">Security Code (CVC)</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="123"
                          maxLength={4}
                          required
                          className="w-full border border-[#262626] bg-[#0d0d0d] text-[#f2f2f2] p-2.5 rounded-md focus:border-accent outline-none font-medium font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="w-full border border-accent bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-50 text-button font-semibold py-3.5 rounded-md transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                  >
                    {submittingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                        Processing Secure Payment...
                      </>
                    ) : (
                      <>
                        Pay CHF {booking.depositAmountChf} Deposit <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Decline Quote Button */}
              {booking.status === "quote_sent" && !isExpired && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowDeclineModal(true)}
                    className="text-red-400 hover:text-red-300 text-sm underline underline-offset-4 transition-colors"
                  >
                    Decline this quote
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262626] bg-[#0d0d0d] py-8 text-center text-caption text-[#737373]">
        <div className="max-w-7xl mx-auto px-6 space-y-2">
          <p>© 2026 Mondar. Switzerland. All Rights Reserved.</p>
          <p className="font-mono text-body-xs">Secure mock platform payment. No actual funds are charged.</p>
        </div>
      </footer>

      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[#f2f2f2]">Decline Quote</h3>
            <p className="text-sm text-[#a6a6a6]">
              Your CHF 50 pre-booking hold will be released immediately — no charge.
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Optional: Tell us why (helps us improve)"
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-md px-3 py-2 text-sm text-[#f2f2f2] placeholder-[#595959] focus:outline-none focus:border-accent resize-none h-20"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="flex-1 border border-[#262626] text-[#a6a6a6] hover:text-[#f2f2f2] px-4 py-2 rounded-md text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={declining}
                className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 px-4 py-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {declining ? "Declining..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
