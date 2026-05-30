"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { localizeHref, resolveVerticalSlug } from "@/lib/i18n";
import { Plane, Ship, Building2, Home, Shield, Check, Calendar, ChevronRight, Lock, CreditCard, Mail, Phone, Clock, Sparkles, X } from "lucide-react";
import { getAvailableSlots, sendOtp, verifyOtp, createBooking, getActiveCategories } from "@/app/actions/booking";

export default function BookingPage() {
  const { locale, t: baseT } = useLanguage();
  const t = (key: string) => baseT("booking." + key);

  const params = useParams();
  const router = useRouter();
  const rawVertical = (params?.vertical as string) || "general";
  const vertical = resolveVerticalSlug(rawVertical, locale);

  // Stepper state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSpecialNotice, setShowSpecialNotice] = useState(false);

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
    keyHandling: "lockbox",

    // Aviation fields
    aircraftType: "light_jet",
    fboLocation: "Zürich (LSZH) - Jet Aviation FBO",
    tailNumber: "",
    aviationScope: ["interior_detail"],

    // Yacht fields
    vesselType: "motor_yacht",
    vesselLength: 30,
    marinaLocation: "Zürich Wollishofen Marina",
    yachtScope: ["deck_wash"]
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
  const isValidVertical = ["commercial", "hospitality", "domestic", "aviation", "yacht"].includes(vertical) && activeSlugs.includes(vertical);

  // Auto-redirect if invalid vertical is requested
  useEffect(() => {
    if (!checkingActive) {
      if (!isValidVertical && vertical !== "general") {
        router.push(localizeHref("/book/general", locale));
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
          setError(res.error || t("failedFetchSlots"));
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
      setError(t("invalidEmail"));
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
      setError(res.error || t("failedSendCode"));
    }
  };

  const triggerVerifyOtp = async () => {
    if (!otpInput) {
      setError(t("enterVerificationCodeError"));
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
      setError(res.error || t("verificationFailed"));
    }
  };

  const submitBooking = async () => {
    if (!address) {
      setError(t("enterAddressError"));
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
      setError(res.error || t("failedFinalizeBooking"));
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
    if (vertical === "general") {
      const categoriesList = [
        { slug: "domestic", icon: Sparkles },
        { slug: "commercial", icon: Building2 },
        { slug: "hospitality", icon: Home },
        { slug: "aviation", icon: Plane },
        { slug: "yacht", icon: Ship },
        { slug: "special", icon: Shield }
      ];

      const activeCategoriesToShow = categoriesList.filter(cat => activeSlugs.includes(cat.slug));
      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

      return (
        <div className="min-h-screen bg-bg text-ink flex flex-col font-body">
          {/* Header */}
          <header className="h-[80px] bg-bg/85 backdrop-blur-md border-b border-border/30 flex items-center px-6 md:px-16 justify-between sticky top-0 z-50">
            <Link href={localizeHref("/", locale)} className="font-display text-display-sm font-bold tracking-tight">
              <span className="text-accent font-serif font-bold">E</span>LITE
            </Link>
            <span className="text-caption text-accent uppercase font-semibold">
              {t("selectDivision")}
            </span>
          </header>

          <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
            <div className="text-center mb-12 space-y-4">
              <span className="text-caption text-accent uppercase tracking-wider block font-semibold">{t("quoteDrivenDispatch")}</span>
              <h1 className="text-display-md text-ink font-display font-medium leading-none tracking-tight">{t("selectDivision")}</h1>
              <p className="text-body-md text-ink-muted max-w-[65ch] mx-auto">
                {t("selectDivisionDesc")}
              </p>
            </div>

            {/* Grid of Divisions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
              {activeCategoriesToShow.map(cat => {
                const IconComponent = cat.icon;
                const isSpecial = cat.slug === "special";
                
                return (
                  <div
                    key={cat.slug}
                    onClick={() => {
                      if (isSpecial) {
                        setShowSpecialNotice(true);
                      } else {
                        router.push(localizeHref(`/book/${cat.slug}`, locale));
                      }
                    }}
                    className="border border-border/60 hover:border-accent bg-bg hover:bg-accent-soft/20 p-6 rounded-lg cursor-pointer flex flex-col justify-between min-h-[240px] shadow-sm hover:shadow-md transition-all duration-300 group"
                  >
                    <div>
                      {/* Icon container */}
                      <div className="h-10 w-10 bg-accent-soft text-accent rounded-sm flex items-center justify-center border border-accent/15 group-hover:border-accent/30 transition-colors mb-4 shrink-0">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-accent font-semibold tracking-wider uppercase block mb-1">
                        {t(`cat${capitalize(cat.slug)}Sub` as any)}
                      </span>
                      <h3 className="text-body-lg font-display font-semibold text-ink group-hover:text-accent transition-colors mb-2">
                        {t(`cat${capitalize(cat.slug)}Title` as any)}
                      </h3>
                      <p className="text-body-sm text-ink-muted leading-relaxed">
                        {t(`cat${capitalize(cat.slug)}Desc` as any)}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border/40 flex items-center justify-between text-caption font-semibold uppercase text-ink-subtle group-hover:text-accent transition-colors mt-4">
                      <span>{t(`cat${capitalize(cat.slug)}Price` as any)}</span>
                      <span className="text-accent flex items-center gap-1">
                        {isSpecial ? t("nav.services") : t("portfolio.book")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* Confidential Notice Modal for Special Services */}
          {showSpecialNotice && (
            <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
              <div className="bg-bg border border-border p-8 rounded-lg max-w-md w-full shadow-xl space-y-6 relative transition-all animate-popover-in text-center">
                <button
                  onClick={() => setShowSpecialNotice(false)}
                  className="absolute top-4 right-4 text-ink-subtle hover:text-ink transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="h-12 w-12 bg-accent-soft text-accent rounded-full flex items-center justify-center border border-accent/10 mx-auto">
                  <Shield className="w-6 h-6" />
                </div>

                <div className="space-y-2">
                  <span className="text-caption text-accent uppercase font-semibold block">
                    {t("catSpecialSub")}
                  </span>
                  <h3 className="text-display-sm font-display font-medium text-ink">
                    {t("catSpecialTitle")}
                  </h3>
                </div>

                <p className="text-body-sm text-ink-muted leading-relaxed text-left border-y border-border/40 py-4">
                  {t("confidentialNotice")}
                </p>

                <div className="space-y-3 pt-2">
                  <a
                    href="tel:+41441234567"
                    className="flex items-center justify-center gap-3 w-full bg-ink hover:bg-ink-muted text-ink-inverse py-3 rounded-md font-semibold transition-colors border border-border"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{t("callDispatch").replace("{phone}", "+41 (0) 44 123 4567")}</span>
                  </a>
                  <a
                    href="https://wa.me/41791234567?text=Hello%20Elite%20Concierge,%20I'd%20like%20to%20inquire%20about%20a%20specialty%20post-incident%20clean."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full bg-accent hover:bg-accent-hover text-ink-inverse py-3 rounded-md font-semibold transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>{t("chatWhatsApp")}</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center px-6">
        <div className="max-w-md w-full border border-border p-8 bg-bg rounded-lg space-y-6 text-center">
          <span className="text-caption text-accent uppercase">{t("quoteDrivenDispatch")}</span>
          <h2 className="text-display-sm font-display font-medium text-ink">{t("bespokeInquiry")}</h2>
          <p className="text-body-sm text-ink-muted">
            {t("bespokeInquiryDesc")}
          </p>
          <Link href={localizeHref("/", locale)} className="block w-full bg-accent hover:bg-accent-hover text-ink-inverse py-3 rounded-md font-semibold transition-colors">
            {t("returnConciergeChat")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-body">
      <header className="h-[80px] bg-bg border-b border-border flex items-center px-6 md:px-16 justify-between">
        <Link href={localizeHref("/", locale)} className="font-display text-display-sm font-bold tracking-tight">
          <span className="text-accent font-serif font-bold">E</span>LITE
        </Link>
        <span className="text-caption text-accent uppercase font-semibold">
          {vertical} {t("bookingFlow")}
        </span>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        {/* Stepper Navigation */}
        <div className="flex justify-between items-center mb-12 border-b border-border pb-6 text-caption uppercase tracking-wider font-semibold">
          <span className={step >= 1 ? "text-accent" : "text-ink-subtle"}>1. {t("intake")}</span>
          <ChevronRight className="w-4 h-4 text-border" />
          <span className={step >= 2 ? "text-accent" : "text-ink-subtle"}>2. {t("schedule")}</span>
          <ChevronRight className="w-4 h-4 text-border" />
          <span className={step >= 3 ? "text-accent" : "text-ink-subtle"}>3. {t("quote")}</span>
          <ChevronRight className="w-4 h-4 text-border" />
          <span className={step >= 4 ? "text-accent" : "text-ink-subtle"}>4. {t("verify")}</span>
          <ChevronRight className="w-4 h-4 text-border" />
          <span className={step >= 5 ? "text-accent" : "text-ink-subtle"}>5. {t("payment")}</span>
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
              <h2 className="text-display-sm font-display font-medium text-ink">{t("describeReqs")}</h2>
              <p className="text-body-sm text-ink-muted">{t("defineScope")}</p>

              {vertical === "commercial" ? (
                <div className="space-y-4 pt-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("officeType")}</label>
                    <select
                      value={intake.officeType}
                      onChange={(e) => handleIntakeChange("officeType", e.target.value)}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                    >
                      <option value="office">{t("corporateOffice")}</option>
                      <option value="studio">{t("studioCreative")}</option>
                      <option value="retail">{t("retailShowroom")}</option>
                      <option value="gym">{t("gymFitness")}</option>
                      <option value="restaurant">{t("restaurantKitchen")}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("surfaceArea")}</label>
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
                      <label className="text-caption text-ink font-semibold uppercase">{t("frequencies")}</label>
                      <select
                        value={intake.frequency}
                        onChange={(e) => handleIntakeChange("frequency", e.target.value)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      >
                        <option value="one-off">{t("oneOffClean")}</option>
                        <option value="weekly">{t("weeklySave15")}</option>
                        <option value="bi-weekly">{t("biWeeklySave10")}</option>
                        <option value="monthly">{t("monthlySave5")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("prefTime")}</label>
                    <div className="flex gap-4">
                      {["business-hours", "after-hours", "weekends"].map((timeVal) => {
                        const timeLabels: Record<string, string> = {
                          "business-hours": t("businessHours"),
                          "after-hours": t("afterHours"),
                          "weekends": t("weekends")
                        };
                        return (
                          <label key={timeVal} className="flex items-center gap-2 text-body-sm cursor-pointer capitalize">
                            <input
                              type="radio"
                              name="prefTime"
                              checked={intake.preferredTime === timeVal}
                              onChange={() => handleIntakeChange("preferredTime", timeVal)}
                              className="accent-accent"
                            />
                            {timeLabels[timeVal] || timeVal.replace("-", " ")}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("specialReqs")}</label>
                    <textarea
                      value={intake.specialRequirements}
                      onChange={(e) => handleIntakeChange("specialRequirements", e.target.value)}
                      placeholder={t("specialReqsPlaceholder")}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none h-24"
                    />
                  </div>
                </div>
              ) : vertical === "hospitality" ? (
                <div className="space-y-4 pt-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("propertyType")}</label>
                    <select
                      value={intake.propertyType}
                      onChange={(e) => handleIntakeChange("propertyType", e.target.value)}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                    >
                      <option value="Airbnb">{t("airbnbApartment")}</option>
                      <option value="B&B">{t("bedBreakfast")}</option>
                      <option value="HolidayLet">{t("holidayLetChalet")}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("bedrooms")}</label>
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
                      <label className="text-caption text-ink font-semibold uppercase">{t("bathrooms")}</label>
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
                      <label className="text-caption text-ink font-semibold uppercase">{t("turnoverFreq")}</label>
                      <select
                        value={intake.frequency}
                        onChange={(e) => handleIntakeChange("frequency", e.target.value)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      >
                        <option value="one-off">{t("turnoverAsRequested")}</option>
                        <option value="weekly">{t("weeklySave10")}</option>
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
                      {t("linenLaunService")}
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("keyHandling")}</label>
                    <select
                      value={intake.keyHandling}
                      onChange={(e) => handleIntakeChange("keyHandling", e.target.value)}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                    >
                      <option value="lockbox">{t("lockboxOnSite")}</option>
                      <option value="smartlock">{t("smartlockApi")}</option>
                      <option value="in-person">{t("inPersonHandoff")}</option>
                    </select>
                  </div>
                </div>
              ) : vertical === "aviation" ? (
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("aircraftType")}</label>
                      <select
                        value={intake.aircraftType}
                        onChange={(e) => handleIntakeChange("aircraftType", e.target.value)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-sans"
                      >
                        <option value="light_jet">{t("lightJet")}</option>
                        <option value="mid_size_jet">{t("midSizeJet")}</option>
                        <option value="heavy_jet">{t("heavyJet")}</option>
                        <option value="turboprop">{t("turboprop")}</option>
                        <option value="helicopter">{t("helicopter")}</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase font-body">{t("tailNumber")}</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HB-JES"
                        value={intake.tailNumber}
                        onChange={(e) => handleIntakeChange("tailNumber", e.target.value)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("airportFbo")}</label>
                    <select
                      value={intake.fboLocation}
                      onChange={(e) => handleIntakeChange("fboLocation", e.target.value)}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-sans"
                    >
                      <option value="Zürich (LSZH) - Cat Air Service FBO">Zürich (LSZH) - Cat Air Service FBO</option>
                      <option value="Zürich (LSZH) - Jet Aviation FBO">Zürich (LSZH) - Jet Aviation FBO</option>
                      <option value="Geneva (LSGG) - Signature FBO">Geneva (LSGG) - Signature FBO</option>
                      <option value="Dübendorf (LSMD) - Private Hangar">Dübendorf (LSMD) - Private Hangar</option>
                      <option value="St. Gallen-Altenrhein (LSZR) - FBO">St. Gallen-Altenrhein (LSZR) - FBO</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-caption text-ink font-semibold uppercase block">{t("detScope")}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-body-sm text-ink-muted">
                      {[
                        { id: "exterior_wash", label: t("exteriorWash") },
                        { id: "interior_detail", label: t("interiorDetail") },
                        { id: "cockpit_detail", label: t("cockpitDetail") },
                        { id: "carpet_shampoo", label: t("carpetShampoo") },
                        { id: "cabin_restock", label: t("cabinRestock") }
                      ].map((item) => {
                        const isChecked = intake.aviationScope?.includes(item.id);
                        return (
                          <label key={item.id} className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const nextScope = e.target.checked
                                  ? [...(intake.aviationScope || []), item.id]
                                  : (intake.aviationScope || []).filter((id: string) => id !== item.id);
                                handleIntakeChange("aviationScope", nextScope);
                              }}
                              className="accent-accent h-4 w-4"
                            />
                            {item.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase font-body">{t("specInstructions")}</label>
                    <textarea
                      value={intake.specialRequirements}
                      onChange={(e) => handleIntakeChange("specialRequirements", e.target.value)}
                      placeholder={t("specInstructionsAviationPlaceholder")}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none h-20 resize-none"
                    />
                  </div>
                </div>
              ) : vertical === "yacht" ? (
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("vesselType")}</label>
                      <select
                        value={intake.vesselType}
                        onChange={(e) => handleIntakeChange("vesselType", e.target.value)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-sans"
                      >
                        <option value="motor_yacht">{t("motorYacht")}</option>
                        <option value="sailing_yacht">{t("sailingYacht")}</option>
                        <option value="catamaran">{t("catamaranYacht")}</option>
                        <option value="tender">{t("tenderYacht")}</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("vesselLength")}</label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={intake.vesselLength}
                        onChange={(e) => handleIntakeChange("vesselLength", parseInt(e.target.value) || 30)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("marinaLoc")}</label>
                    <select
                      value={intake.marinaLocation}
                      onChange={(e) => handleIntakeChange("marinaLocation", e.target.value)}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-sans"
                    >
                      <option value="Zürich Wollishofen Marina">Zürich Wollishofen Marina</option>
                      <option value="Horgen Harbor">Horgen Harbor</option>
                      <option value="Rapperswil Harbor">Rapperswil Harbor</option>
                      <option value="Geneva Port Noir">Geneva Port Noir</option>
                      <option value="Zug Lake Marina">Zug Lake Marina</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-caption text-ink font-semibold uppercase block font-body">{t("servScope")}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-body-sm text-ink-muted">
                      {[
                        { id: "teak_clean", label: t("teakClean") },
                        { id: "hull_polish", label: t("hullPolish") },
                        { id: "interior_detail", label: t("yachtInteriorDetail") },
                        { id: "deck_wash", label: t("deckWash") },
                        { id: "decommission", label: t("decommission") }
                      ].map((item) => {
                        const isChecked = intake.yachtScope?.includes(item.id);
                        return (
                          <label key={item.id} className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const nextScope = e.target.checked
                                  ? [...(intake.yachtScope || []), item.id]
                                  : (intake.yachtScope || []).filter((id: string) => id !== item.id);
                                handleIntakeChange("yachtScope", nextScope);
                              }}
                              className="accent-accent h-4 w-4"
                            />
                            {item.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase font-body">{t("specInstructions")}</label>
                    <textarea
                      value={intake.specialRequirements}
                      onChange={(e) => handleIntakeChange("specialRequirements", e.target.value)}
                      placeholder={t("specInstructionsYachtPlaceholder")}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none h-20 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  {/* Domestic Intake Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("bedrooms")}</label>
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
                      <label className="text-caption text-ink font-semibold uppercase">{t("bathrooms")}</label>
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
                    <label className="text-caption text-ink font-semibold uppercase">{t("frequencies")}</label>
                    <select
                      value={intake.frequency}
                      onChange={(e) => handleIntakeChange("frequency", e.target.value)}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                    >
                      <option value="one-off">{t("oneOffClean")}</option>
                      <option value="weekly">{t("weeklySave15")}</option>
                      <option value="bi-weekly">{t("biWeeklySave10")}</option>
                      <option value="monthly">{t("monthlySave5")}</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("specialInstructionsPets")}</label>
                    <textarea
                      value={intake.specialRequirements}
                      onChange={(e) => handleIntakeChange("specialRequirements", e.target.value)}
                      placeholder={t("specialInstructionsPetsPlaceholder")}
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
                  {t("continueSchedule")}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SCHEDULE */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-display-sm font-display font-medium text-ink">{t("selectDateWindow")}</h2>
                <p className="text-body-sm text-ink-muted">{t("subcontractorCapacity")}</p>
              </div>

              <div className="space-y-6 pt-4">
                <div>
                  <label className="text-caption text-ink font-semibold uppercase tracking-wider block mb-3">
                    {t("serviceDate")}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                    {getNext14Days().map((d) => {
                      const dateObj = new Date(d);
                      const isSelected = selectedDate === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setSelectedDate(d)}
                          className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all select-none ${
                            isSelected
                              ? "border-accent bg-accent-soft/40 shadow-sm text-ink ring-1 ring-accent scale-[1.02]"
                              : "border-border hover:border-accent/40 bg-bg hover:bg-bg-subtle text-ink-muted hover:text-ink hover:scale-[1.01]"
                          }`}
                        >
                          <span className="text-[10px] uppercase font-semibold tracking-wider opacity-75">
                            {dateObj.toLocaleDateString(locale, { weekday: "short" })}
                          </span>
                          <span className="text-display-xs font-bold font-serif my-1">
                            {dateObj.getDate()}
                          </span>
                          <span className="text-[10px] uppercase font-medium tracking-wide">
                            {dateObj.toLocaleDateString(locale, { month: "short" })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDate && (
                  <div className="space-y-4 pt-6 border-t border-border/40">
                    <label className="text-caption text-ink font-semibold uppercase tracking-wider block">
                      {t("availableSlot")}
                    </label>
                    {loading ? (
                      <div className="flex items-center gap-3 py-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent"></div>
                        <span className="text-body-sm text-ink-subtle">{t("checkingDispatches")}</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {availableSlots.map((slot) => {
                          const isSelected = selectedSlot === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedSlot(slot.id)}
                              className={`flex items-center justify-between p-4 border rounded-lg transition-all w-full text-left select-none ${
                                !slot.available
                                  ? "border-border opacity-40 bg-bg-subtle cursor-not-allowed"
                                  : isSelected
                                  ? "border-accent bg-accent-soft/40 ring-1 ring-accent text-ink scale-[1.01]"
                                  : "border-border hover:border-accent/40 bg-bg hover:bg-bg-subtle text-ink-muted hover:text-ink hover:scale-[1.005]"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Clock className={`w-4 h-4 ${isSelected ? "text-accent" : "text-ink-subtle"}`} />
                                <span className="text-body-sm font-semibold">{slot.label}</span>
                              </div>
                              {slot.available ? (
                                <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                                  isSelected ? "border-accent bg-accent text-ink-inverse" : "border-border bg-transparent"
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              ) : (
                                <span className="text-caption text-red-500 uppercase font-semibold tracking-wider text-[10px]">
                                  {t("fullyBooked")}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6 border-t border-border mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-ink text-ink py-3 px-6 rounded-md transition-colors text-button font-semibold"
                >
                  {t("back")}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!selectedDate || !selectedSlot}
                  className="bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-8 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("continueQuote")}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: QUOTE */}
          {step === 3 && (
            <div className="space-y-6">
              {vertical === "aviation" || vertical === "yacht" ? (
                <div className="space-y-4">
                  <h2 className="text-display-sm font-display font-medium text-ink">{t("bespokeQuoteRequired")}</h2>
                  <p className="text-body-sm text-ink-muted">{t("aviationYachtQuoteDesc")}</p>
                  <div className="border border-border p-6 rounded-md bg-bg-subtle space-y-4 pt-6 text-body-sm leading-relaxed">
                    <span className="text-caption text-accent uppercase font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {t("reviewPending")}
                    </span>
                    <p className="text-[#a6a6a6]">
                      {t("subcontractorNetworkNote")}
                    </p>
                    <p className="text-[#a6a6a6]">
                      {t("dispatchDeskNote")}
                    </p>
                    <div className="border-t border-border pt-4 text-caption uppercase text-accent font-semibold flex justify-between">
                      <span>{t("quoteStatus")}</span>
                      <span>{t("quotePending")}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-display-sm font-display font-medium text-ink">{t("lockedInQuote")}</h2>
                  <p className="text-body-sm text-ink-muted">{t("qualityPledgeNote")}</p>

                  <div className="border border-border p-6 rounded-md bg-bg-subtle space-y-4 pt-6">
                    <div className="flex justify-between text-body-sm text-ink-muted">
                      <span>{t("baseFee")}</span>
                      <span>CHF {vertical === "commercial" ? "150.00" : vertical === "hospitality" ? "120.00" : "80.00"}</span>
                    </div>
                    {pricing.subtotal - (vertical === "commercial" ? 150 : vertical === "hospitality" ? 120 : 80) - (intake.linenChange ? 35 : 0) > 0 && (
                      <div className="flex justify-between text-body-sm text-ink-muted">
                        <span>{t("sizeAdjustment")}</span>
                        <span>+CHF {Math.round((pricing.subtotal - (vertical === "commercial" ? 150 : vertical === "hospitality" ? 120 : 80) - (intake.linenChange ? 35 : 0)) * 100) / 100}</span>
                      </div>
                    )}
                    {intake.linenChange && (
                      <div className="flex justify-between text-body-sm text-ink-muted">
                        <span>{t("linenLaundry")}</span>
                        <span>+CHF 35.00</span>
                      </div>
                    )}
                    {pricing.discount > 0 && (
                      <div className="flex justify-between text-body-sm text-green-600 font-medium">
                        <span>{t("frequencyDiscount")}</span>
                        <span>-CHF {pricing.discount}</span>
                      </div>
                    )}

                    <div className="border-t border-border pt-4 flex justify-between text-body-lg text-ink font-bold font-display">
                      <span>{t("totalAmount")}</span>
                      <span>CHF {pricing.total}</span>
                    </div>

                    <div className="border-t border-border border-dashed pt-4 flex justify-between text-body-md text-accent font-semibold">
                      <span>{t("stripeDeposit")}</span>
                      <span>CHF {pricing.deposit}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setStep(2)}
                  className="border border-ink text-ink py-3 px-6 rounded-md transition-colors text-button font-semibold"
                >
                  {t("back")}
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-8 rounded-md transition-colors"
                >
                  {t("secureWithOtp")}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CONTACT & VERIFICATION */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-display-sm font-display font-medium text-ink">{t("guestVerification")}</h2>
              <p className="text-body-sm text-ink-muted">{t("secureCredentialsNote")}</p>

              {!otpSent ? (
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("fullName")}</label>
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => setContact({ ...contact, name: e.target.value })}
                        placeholder="John Doe"
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("phoneNumber")}</label>
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
                    <label className="text-caption text-ink font-semibold uppercase">{t("emailAddress")}</label>
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
                    className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 rounded-md transition-colors disabled:opacity-50 font-body cursor-pointer"
                  >
                    {loading ? t("sendingCode") : t("sendOtp")}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <div className="bg-accent-soft p-4 rounded-md border border-accent/25 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-accent" />
                    <div>
                      <span className="text-body-sm font-semibold text-ink block">{t("testingCodeTriggered")}</span>
                      <span className="text-body-xs text-ink-muted">{t("enterVerificationCode")} <b>{otpCode}</b></span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("enter6DigitCode")}</label>
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
                    className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 rounded-md transition-colors cursor-pointer font-body"
                  >
                    {loading ? t("verifying") : t("verifyCode")}
                  </button>
                  <button
                    onClick={() => setOtpSent(false)}
                    className="w-full text-caption text-ink-subtle hover:text-ink font-semibold uppercase tracking-wider text-center mt-2 cursor-pointer"
                  >
                    {t("editEmail")}
                  </button>
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-border mt-8">
                <button
                  onClick={() => setStep(3)}
                  className="border border-ink text-ink py-3 px-6 rounded-md transition-colors text-button font-semibold"
                >
                  {t("back")}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: PAYMENT */}
          {step === 5 && (
            <div className="space-y-6">
              {vertical === "aviation" || vertical === "yacht" ? (
                <div className="space-y-4">
                  <h2 className="text-display-sm font-display font-medium text-ink">{t("confirmRequestSubmission")}</h2>
                  <p className="text-body-sm text-ink-muted">{t("specifyCoordinatesNote")}</p>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("exactLocation")}</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={vertical === "aviation" ? t("aviationLocationPlaceholder") : t("yachtLocationPlaceholder")}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-sans"
                    />
                  </div>

                  <div className="border border-border p-6 rounded-md bg-bg-subtle space-y-4 leading-relaxed text-body-sm text-[#a6a6a6]">
                    <span className="text-caption text-accent uppercase font-semibold flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> {t("noDepositRequired")}
                    </span>
                    <p>
                      {t("bespokeReviewedNote")}
                    </p>
                    <p>
                      {t("customQuoteEmailNote")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-display-sm font-display font-medium text-ink">{t("simulatedStripe")}</h2>
                  <p className="text-body-sm text-ink-muted">{t("depositRequiredNote")}</p>

                  <div className="space-y-4 pt-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("serviceLocation")}</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t("addressPlaceholder")}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      />
                    </div>

                    <div className="border border-border p-6 rounded-md bg-bg-subtle space-y-4">
                      <span className="text-caption text-accent uppercase font-semibold flex items-center gap-2">
                        <Lock className="w-4 h-4" /> {t("secureStripeGateway")}
                      </span>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-caption text-ink font-semibold uppercase">{t("cardholderName")}</label>
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
                          <label className="text-caption text-ink font-semibold uppercase">{t("cardNumber")}</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4242 4242 4242 4242"
                            className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-caption text-ink font-semibold uppercase">{t("cvc")}</label>
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
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-border mt-8">
                <button
                  onClick={() => setStep(4)}
                  className="border border-ink text-ink py-3 px-6 rounded-md transition-colors text-button font-semibold"
                >
                  {t("back")}
                </button>
                <button
                  onClick={submitBooking}
                  disabled={loading || !address || (vertical !== "aviation" && vertical !== "yacht" && !cardName)}
                  className="bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-8 rounded-md transition-colors disabled:opacity-50 cursor-pointer font-body"
                >
                  {loading 
                    ? t("processing") 
                    : vertical === "aviation" || vertical === "yacht" 
                      ? t("submitBespoke") 
                      : `${t("payDeposit")} (CHF ${pricing.deposit})`}
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
              <h2 className="text-display-md font-display font-medium text-ink">
                {vertical === "aviation" || vertical === "yacht" ? t("requestSubmitted") : t("bookingConfirmed")}
              </h2>
              <p className="text-body-md text-ink-muted max-w-[50ch] mx-auto leading-relaxed">
                {vertical === "aviation" || vertical === "yacht" ? (
                  t("thankYouAviation")
                    .replace("Thank you.", `Thank you, ${contact.name}.`)
                    .replace("Merci.", `Merci, ${contact.name}.`)
                    .replace("Vielen Dank.", `Vielen Dank, ${contact.name}.`)
                    .replace("Obrigado.", `Obrigado, ${contact.name}.`)
                    .replace("Gracias.", `Gracias, ${contact.name}.`)
                    .replace("Grazie.", `Grazie, ${contact.name}.`)
                    .replace("Grazia fitg.", `Grazia fitg, ${contact.name}.`)
                ) : (
                  t("thankYouRegular")
                    .replace("Thank you.", `Thank you, ${contact.name}.`)
                    .replace("Merci.", `Merci, ${contact.name}.`)
                    .replace("Vielen Dank.", `Vielen Dank, ${contact.name}.`)
                    .replace("Obrigado.", `Obrigado, ${contact.name}.`)
                    .replace("Gracias.", `Gracias, ${contact.name}.`)
                    .replace("Grazie.", `Grazie, ${contact.name}.`)
                    .replace("Grazia fitg.", `Grazia fitg, ${contact.name}.`)
                )}
              </p>
              <div className="bg-bg-subtle p-4 border border-border rounded-md max-w-md mx-auto text-body-sm font-mono mt-4 text-accent">
                {address}<br />
                {t("scheduled")} {selectedDate} ({selectedSlot === "morning" ? t("morningSlot") : t("afternoonSlot")})
              </div>
              <p className="text-body-sm text-ink-subtle pt-6 max-w-[55ch] mx-auto leading-relaxed">
                {vertical === "aviation" || vertical === "yacht" ? (
                  (() => {
                    const parts = t("quoteSentEmail").split("{email}");
                    return <span>{parts[0]}<b>{contact.email}</b>{parts[1]}</span>;
                  })()
                ) : (
                  (() => {
                    const parts = t("pdfReceiptSent").split("{email}");
                    return <span>{parts[0]}<b>{contact.email}</b>{parts[1]}</span>;
                  })()
                )}
              </p>
              <div className="pt-8">
                <Link href={localizeHref("/", locale)} className="bg-accent hover:bg-accent-hover text-ink-inverse font-semibold px-8 py-3 rounded-md transition-colors text-button">
                  {t("returnHome")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
