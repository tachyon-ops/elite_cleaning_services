"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Plane, Ship, Building2, Home, Shield, Check, Calendar, ChevronRight, Lock, CreditCard, Mail, Phone, Clock } from "lucide-react";
import { getAvailableSlots, sendOtp, verifyOtp, createBooking, getActiveCategories } from "@/app/actions/booking";

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const vertical = (params?.vertical as string) || "general";

  // Stepper state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Intake State
  const [intake, setIntake] = useState<any>({
    // Commercial fields
    officeType: "office",
    surfaceArea: 60,
    rooms: 3,
    floors: 1,
    frequency: "one-off",
    preferredTime: "after-hours",
    specialRequirements: "",
    
    // Hospitality fields
    propertyType: "Airbnb",
    bedrooms: 2,
    bathrooms: 1,
    linenChange: false,
    keyHandling: "lockbox"
  });

  // Schedule State
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  // Contact State
  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: ""
  });
  
  // Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  // Address State
  const [address, setAddress] = useState("");

  // Booking result
  const [bookingId, setBookingId] = useState("");

  // Payment State
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");

  const [activeSlugs, setActiveSlugs] = useState<string[]>([]);
  const [checkingActive, setCheckingActive] = useState(true);

  useEffect(() => {
    getActiveCategories().then((res) => {
      setCheckingActive(false);
      if (res.success && res.categories) {
        setActiveSlugs(res.categories.map((c: any) => c.slug));
      }
    });
  }, []);

  // Validate Vertical
  const isValidVertical = ["commercial", "hospitality", "domestic"].includes(vertical) && activeSlugs.includes(vertical);

  // Auto-redirect if invalid vertical is requested
  useEffect(() => {
    if (!checkingActive) {
      if (!isValidVertical && vertical !== "general") {
        router.push("/book/general");
      }
    }
  }, [vertical, isValidVertical, checkingActive, router]);

  // Fetch Slots when date changes
  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      getAvailableSlots(vertical, selectedDate).then(res => {
        setLoading(false);
        if (res.success && res.slots) {
          setAvailableSlots(res.slots);
        } else {
          setError(res.error || "Failed to fetch slots");
        }
      });
    }
  }, [selectedDate, vertical]);

  // Pricing calculations
  const calculatePricing = () => {
    let basePrice = 0;
    let sizeAdjustment = 0;
    let frequencyDiscount = 0;
    let addons = 0;

    if (vertical === "commercial") {
      basePrice = 150.00;
      const area = Number(intake.surfaceArea) || 0;
      if (area > 50) {
        sizeAdjustment = (area - 50) * 1.20;
      }
      const freq = intake.frequency;
      if (freq === "weekly") frequencyDiscount = 0.15;
      else if (freq === "bi-weekly") frequencyDiscount = 0.10;
      else if (freq === "monthly") frequencyDiscount = 0.05;
    } else if (vertical === "hospitality") {
      basePrice = 120.00;
      const bedrooms = Number(intake.bedrooms) || 1;
      const bathrooms = Number(intake.bathrooms) || 1;
      sizeAdjustment = (bedrooms - 1) * 30.00 + (bathrooms - 1) * 20.00;
      if (intake.linenChange) {
        addons = 35.00;
      }
      const freq = intake.frequency;
      if (freq === "weekly") frequencyDiscount = 0.10;
    } else if (vertical === "domestic") {
      basePrice = 80.00;
      const bedrooms = Number(intake.bedrooms) || 1;
      const bathrooms = Number(intake.bathrooms) || 1;
      sizeAdjustment = (bedrooms - 1) * 20.00 + (bathrooms - 1) * 15.00;
      const freq = intake.frequency;
      if (freq === "weekly") frequencyDiscount = 0.15;
      else if (freq === "bi-weekly") frequencyDiscount = 0.10;
      else if (freq === "monthly") frequencyDiscount = 0.05;
    }

    const subtotal = basePrice + sizeAdjustment + addons;
    const discountAmount = subtotal * frequencyDiscount;
    const total = subtotal - discountAmount;
    const deposit = total * 0.30;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      deposit: Math.round(deposit * 100) / 100
    };
  };

  const pricing = calculatePricing();

  // Handlers
  const handleIntakeChange = (field: string, val: any) => {
    setIntake((prev: any) => ({ ...prev, [field]: val }));
  };

  const triggerSendOtp = async () => {
    if (!contact.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    const res = await sendOtp(contact.email);
    setLoading(false);
    if (res.success && res.code) {
      setOtpCode(res.code);
      setOtpSent(true);
    } else {
      setError(res.error || "Failed to send code");
    }
  };

  const triggerVerifyOtp = async () => {
    if (!otpInput) {
      setError("Please enter the verification code");
      return;
    }
    setError("");
    setLoading(true);
    const res = await verifyOtp(contact.email, otpInput);
    setLoading(false);
    if (res.success) {
      setOtpVerified(true);
      setStep(5);
    } else {
      setError(res.error || "Verification failed");
    }
  };

  const submitBooking = async () => {
    if (!address) {
      setError("Please enter the service location address");
      return;
    }
    setError("");
    setLoading(true);

    const res = await createBooking({
      email: contact.email,
      vertical,
      categorySlug: vertical,
      intake,
      scheduledAtStr: selectedDate,
      scheduledWindow: selectedSlot,
      locationAddress: address
    });

    setLoading(false);
    if (res.success && res.bookingId) {
      setBookingId(res.bookingId);
      setStep(6);
    } else {
      setError(res.error || "Failed to finalize booking");
    }
  };

  // Helper arrays for dates (next 14 days)
  const getNext14Days = () => {
    const dates = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  if (!isValidVertical) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center px-6">
        <div className="max-w-md w-full border border-border p-8 bg-bg rounded-lg space-y-6 text-center">
          <span className="text-caption text-accent uppercase">QUOTE DRIVEN DISPATCH</span>
          <h2 className="text-display-sm font-display font-medium text-ink">Bespoke Inquiry</h2>
          <p className="text-body-sm text-ink-muted">
            Specialty aviation, marine yachting, or post-incident cleanups require dispatcher quote reviews.
          </p>
          <Link href="/" className="block w-full bg-accent hover:bg-accent-hover text-ink-inverse py-3 rounded-md font-semibold transition-colors">
            Return to Concierge Chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-body">
      <header className="h-[80px] bg-bg border-b border-border flex items-center px-6 md:px-16 justify-between">
        <Link href="/" className="font-display text-display-sm font-bold tracking-tight">
          <span className="text-accent font-serif font-bold">E</span>LITE
        </Link>
        <span className="text-caption text-accent uppercase font-semibold">
          {vertical} Booking Flow
        </span>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        {/* Stepper Navigation */}
        <div className="flex justify-between items-center mb-12 border-b border-border pb-6 text-caption uppercase tracking-wider font-semibold">
          <span className={step >= 1 ? "text-accent" : "text-ink-subtle"}>1. Intake</span>
          <ChevronRight className="w-4 h-4 text-border" />
          <span className={step >= 2 ? "text-accent" : "text-ink-subtle"}>2. Schedule</span>
          <ChevronRight className="w-4 h-4 text-border" />
          <span className={step >= 3 ? "text-accent" : "text-ink-subtle"}>3. Quote</span>
          <ChevronRight className="w-4 h-4 text-border" />
          <span className={step >= 4 ? "text-accent" : "text-ink-subtle"}>4. Verify</span>
          <ChevronRight className="w-4 h-4 text-border" />
          <span className={step >= 5 ? "text-accent" : "text-ink-subtle"}>5. Payment</span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md mb-8 text-body-sm">
            {error}
          </div>
        )}

        <div className="bg-bg border border-border p-8 rounded-lg shadow-sm">
          {/* STEP 1: INTAKE */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-display-sm font-display font-medium text-ink">Describe your requirements</h2>
              <p className="text-body-sm text-ink-muted">Define the scope of service for locked-in local subcontractor pricing.</p>

              {vertical === "commercial" ? (
                <div className="space-y-4 pt-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">Office Type</label>
                    <select
                      value={intake.officeType}
                      onChange={(e) => handleIntakeChange("officeType", e.target.value)}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                    >
                      <option value="office">Corporate/Standard Office</option>
                      <option value="studio">Studio & Creative Space</option>
                      <option value="retail">Retail / Showroom</option>
                      <option value="gym">Gym / Fitness Suite</option>
                      <option value="restaurant">Restaurant / Kitchen Space</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">Surface Area (m²)</label>
                      <input
                        type="number"
                        min="10"
                        max="1000"
                        value={intake.surfaceArea}
                        onChange={(e) => handleIntakeChange("surfaceArea", parseInt(e.target.value) || 0)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">Frequencies</label>
                      <select
                        value={intake.frequency}
                        onChange={(e) => handleIntakeChange("frequency", e.target.value)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      >
                        <option value="one-off">One-off clean</option>
                        <option value="weekly">Weekly (Save 15%)</option>
                        <option value="bi-weekly">Bi-weekly (Save 10%)</option>
                        <option value="monthly">Monthly (Save 5%)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">Preferred Time</label>
                    <div className="flex gap-4">
                      {["business-hours", "after-hours", "weekends"].map((t) => (
                        <label key={t} className="flex items-center gap-2 text-body-sm cursor-pointer capitalize">
                          <input
                            type="radio"
                            name="prefTime"
                            checked={intake.preferredTime === t}
                            onChange={() => handleIntakeChange("preferredTime", t)}
                            className="accent-accent"
                          />
                          {t.replace("-", " ")}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">Special Requirements</label>
                    <textarea
                      value={intake.specialRequirements}
                      onChange={(e) => handleIntakeChange("specialRequirements", e.target.value)}
                      placeholder="Security codes, sensitive equipment handling..."
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none h-24"
                    />
                  </div>
                </div>
              ) : vertical === "hospitality" ? (
                <div className="space-y-4 pt-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">Property Type</label>
                    <select
                      value={intake.propertyType}
                      onChange={(e) => handleIntakeChange("propertyType", e.target.value)}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                    >
                      <option value="Airbnb">Airbnb Apartment</option>
                      <option value="B&B">Bed & Breakfast</option>
                      <option value="HolidayLet">Holiday Let / Chalet</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">Bedrooms</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={intake.bedrooms}
                        onChange={(e) => handleIntakeChange("bedrooms", parseInt(e.target.value) || 1)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">Bathrooms</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={intake.bathrooms}
                        onChange={(e) => handleIntakeChange("bathrooms", parseInt(e.target.value) || 1)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">Turnover Frequency</label>
                      <select
                        value={intake.frequency}
                        onChange={(e) => handleIntakeChange("frequency", e.target.value)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      >
                        <option value="one-off">Per-turnover (As requested)</option>
                        <option value="weekly">Weekly scheduling (Save 10%)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="linenChange"
                      checked={intake.linenChange}
                      onChange={(e) => handleIntakeChange("linenChange", e.target.checked)}
                      className="accent-accent h-4 w-4"
                    />
                    <label htmlFor="linenChange" className="text-body-sm font-medium cursor-pointer">
                      Request professional linen laundering service (+CHF 35)
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">Key Handling</label>
                    <select
                      value={intake.keyHandling}
                      onChange={(e) => handleIntakeChange("keyHandling", e.target.value)}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                    >
                      <option value="lockbox">Lockbox on-site</option>
                      <option value="smartlock">Smartlock API access</option>
                      <option value="in-person">In-person handoff</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  {/* Domestic Intake Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">Bedrooms</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={intake.bedrooms || 1}
                        onChange={(e) => handleIntakeChange("bedrooms", parseInt(e.target.value) || 1)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">Bathrooms</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={intake.bathrooms || 1}
                        onChange={(e) => handleIntakeChange("bathrooms", parseInt(e.target.value) || 1)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">Frequency</label>
                    <select
                      value={intake.frequency}
                      onChange={(e) => handleIntakeChange("frequency", e.target.value)}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                    >
                      <option value="one-off">One-off clean</option>
                      <option value="weekly">Weekly (Save 15%)</option>
                      <option value="bi-weekly">Bi-weekly (Save 10%)</option>
                      <option value="monthly">Monthly (Save 5%)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">Special Instructions / Pets</label>
                    <textarea
                      value={intake.specialRequirements}
                      onChange={(e) => handleIntakeChange("specialRequirements", e.target.value)}
                      placeholder="Access codes, key location, pets in house, priority rooms..."
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none h-24"
                    />
                  </div>
                </div>
              )}

              <div className="pt-6">
                <button
                  onClick={() => setStep(2)}
                  className="bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-8 rounded-md transition-colors"
                >
                  Continue to Schedule
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SCHEDULE */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-display-sm font-display font-medium text-ink">Select date and window</h2>
              <p className="text-body-sm text-ink-muted">Subcontractor capacity check within Zürich region.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="flex flex-col gap-2">
                  <label className="text-caption text-ink font-semibold uppercase">Service Date</label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                  >
                    <option value="">Choose a date...</option>
                    {getNext14Days().map((d) => (
                      <option key={d} value={d}>
                        {new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDate && (
                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">Available Slot</label>
                    {loading ? (
                      <span className="text-body-sm text-ink-subtle">Checking dispatches...</span>
                    ) : (
                      <div className="space-y-2">
                        {availableSlots.map((slot) => (
                          <label
                            key={slot.id}
                            className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                              !slot.available
                                ? "border-border opacity-50 bg-bg-subtle cursor-not-allowed"
                                : selectedSlot === slot.id
                                ? "border-accent bg-accent-soft"
                                : "border-border hover:bg-bg-subtle"
                            }`}
                          >
                            <span className="text-body-sm font-medium">{slot.label}</span>
                            {slot.available ? (
                              <input
                                type="radio"
                                name="slot"
                                checked={selectedSlot === slot.id}
                                onChange={() => setSelectedSlot(slot.id)}
                                className="accent-accent"
                              />
                            ) : (
                              <span className="text-caption text-red-500 uppercase">FULLY BOOKED</span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6 border-t border-border mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="border border-ink text-ink py-3 px-6 rounded-md transition-colors text-button font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedDate || !selectedSlot}
                  className="bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-8 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Quote
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: QUOTE */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-display-sm font-display font-medium text-ink">Locked-in Subcontractor Quote</h2>
              <p className="text-body-sm text-ink-muted">All dispatches are fully insured and backed by our quality pledge.</p>

              <div className="border border-border p-6 rounded-md bg-bg-subtle space-y-4 pt-6">
                <div className="flex justify-between text-body-sm text-ink-muted">
                  <span>Base cleanup fee</span>
                  <span>CHF {vertical === "commercial" ? "150.00" : vertical === "hospitality" ? "120.00" : "80.00"}</span>
                </div>
                {pricing.subtotal - (vertical === "commercial" ? 150 : vertical === "hospitality" ? 120 : 80) - (intake.linenChange ? 35 : 0) > 0 && (
                  <div className="flex justify-between text-body-sm text-ink-muted">
                    <span>Size/Scope adjustment</span>
                    <span>+CHF {Math.round((pricing.subtotal - (vertical === "commercial" ? 150 : vertical === "hospitality" ? 120 : 80) - (intake.linenChange ? 35 : 0)) * 100) / 100}</span>
                  </div>
                )}
                {intake.linenChange && (
                  <div className="flex justify-between text-body-sm text-ink-muted">
                    <span>Linen service laundry</span>
                    <span>+CHF 35.00</span>
                  </div>
                )}
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-body-sm text-green-600 font-medium">
                    <span>Frequency discount</span>
                    <span>-CHF {pricing.discount}</span>
                  </div>
                )}

                <div className="border-t border-border pt-4 flex justify-between text-body-lg text-ink font-bold font-display">
                  <span>Total Amount</span>
                  <span>CHF {pricing.total}</span>
                </div>

                <div className="border-t border-border border-dashed pt-4 flex justify-between text-body-md text-accent font-semibold">
                  <span>Stripe Deposit (30% to secure)</span>
                  <span>CHF {pricing.deposit}</span>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setStep(2)}
                  className="border border-ink text-ink py-3 px-6 rounded-md transition-colors text-button font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-8 rounded-md transition-colors"
                >
                  Secure with OTP Verification
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CONTACT & VERIFICATION */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-display-sm font-display font-medium text-ink">Guest verification</h2>
              <p className="text-body-sm text-ink-muted">Secure your booking details and receipt credentials.</p>

              {!otpSent ? (
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">Full Name</label>
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => setContact({ ...contact, name: e.target.value })}
                        placeholder="John Doe"
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">Phone Number</label>
                      <input
                        type="text"
                        value={contact.phone}
                        onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                        placeholder="+41 79 123 4567"
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">Email Address</label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      placeholder="john.doe@example.ch"
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                    />
                  </div>
                  <button
                    onClick={triggerSendOtp}
                    disabled={loading || !contact.email || !contact.name}
                    className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 rounded-md transition-colors disabled:opacity-50"
                  >
                    {loading ? "Sending Code..." : "SEND OTP CODE"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <div className="bg-accent-soft p-4 rounded-md border border-accent/25 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-accent" />
                    <div>
                      <span className="text-body-sm font-semibold text-ink block">Local Testing Code Triggered</span>
                      <span className="text-body-xs text-ink-muted">Enter verification code: <b>{otpCode}</b></span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">Enter 6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="000000"
                      className="border border-border bg-bg p-3 rounded-md text-body-md text-center font-mono focus:border-accent outline-none tracking-widest text-lg"
                    />
                  </div>
                  <button
                    onClick={triggerVerifyOtp}
                    disabled={loading}
                    className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 rounded-md transition-colors"
                  >
                    {loading ? "Verifying..." : "VERIFY CODE"}
                  </button>
                  <button
                    onClick={() => setOtpSent(false)}
                    className="w-full text-caption text-ink-subtle hover:text-ink font-semibold uppercase tracking-wider text-center mt-2"
                  >
                    Edit email address
                  </button>
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-border mt-8">
                <button
                  onClick={() => setStep(3)}
                  className="border border-ink text-ink py-3 px-6 rounded-md transition-colors text-button font-semibold"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: PAYMENT */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-display-sm font-display font-medium text-ink">Simulated Stripe deposit</h2>
              <p className="text-body-sm text-ink-muted">A 30% deposit is required to lock in the subcontractor dispatch.</p>

              <div className="space-y-4 pt-4">
                <div className="flex flex-col gap-2">
                  <label className="text-caption text-ink font-semibold uppercase">Service Location Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Seestrasse 10, 8002 Zürich"
                    className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                  />
                </div>

                <div className="border border-border p-6 rounded-md bg-bg-subtle space-y-4">
                  <span className="text-caption text-accent uppercase font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" /> SECURE STRIPE GATEWAY
                  </span>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="John Doe"
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">CVC</label>
                      <input
                        type="text"
                        placeholder="123"
                        maxLength={3}
                        className="border border-border bg-bg p-3 rounded-md text-body-md text-center focus:border-accent outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-border mt-8">
                <button
                  onClick={() => setStep(4)}
                  className="border border-ink text-ink py-3 px-6 rounded-md transition-colors text-button font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={submitBooking}
                  disabled={loading || !address || !cardName}
                  className="bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-8 rounded-md transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing..." : `PAY DEPOSIT (CHF ${pricing.deposit})`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: CONFIRMATION */}
          {step === 6 && (
            <div className="space-y-6 text-center py-8">
              <div className="h-16 w-16 bg-accent-soft text-accent rounded-full flex items-center justify-center mx-auto mb-6 border border-accent/25">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-display-md font-display font-medium text-ink">Booking Confirmed</h2>
              <p className="text-body-md text-ink-muted max-w-[50ch] mx-auto">
                Thank you, {contact.name}. Your 30% deposit has been processed. A certified subcontractor team has been assigned for dispatch to:
              </p>
              <div className="bg-bg-subtle p-4 border border-border rounded-md max-w-md mx-auto text-body-sm font-mono mt-4">
                {address}<br />
                Scheduled: {selectedDate} ({selectedSlot === "morning" ? "Morning Slot" : "Afternoon Slot"})
              </div>
              <p className="text-body-sm text-ink-subtle pt-6">
                A copy of your PDF receipt and .ics calendar invite has been sent to: <b>{contact.email}</b>.
              </p>
              <div className="pt-8">
                <Link href="/" className="bg-accent hover:bg-accent-hover text-ink-inverse font-semibold px-8 py-3 rounded-md transition-colors text-button">
                  RETURN HOME
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
