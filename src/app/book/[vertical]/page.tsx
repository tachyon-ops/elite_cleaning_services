"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { localizeHref, resolveVerticalSlug } from "@/lib/i18n";
import { Plane, Ship, Building2, Home, Shield, Check, Calendar, ChevronRight, ChevronLeft, Lock, CreditCard, Mail, Phone, Clock, Sparkles, X, MessageSquare, Key, Building, ChefHat, Info, Zap } from "lucide-react";
import { getAvailableSlots, sendOtp, verifyOtp, createBooking, getActiveCategories, setCustomerPassword } from "@/app/actions/booking";
import { getSystemSetting } from "@/app/actions/admin";
import { validatePromoCode } from "@/app/actions/marketing";
import { Logo } from "@/components/Logo";

interface CustomSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string; disabled?: boolean }[];
  onChange: (val: string) => void;
}

function CustomSelect({ label, value, options, onChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value) || options[0];

  return (
    <div className="flex flex-col gap-2 relative w-full" ref={dropdownRef}>
      <label className="text-caption text-ink font-semibold uppercase">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="border border-border bg-bg p-3 rounded-md text-body-md text-left flex justify-between items-center focus:border-accent outline-none hover:border-accent/50 cursor-pointer select-none transition-all duration-200"
      >
        <span className="truncate">{selectedOpt?.label}</span>
        <svg
          className={`w-4 h-4 text-ink-subtle transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-[102%] left-0 right-0 z-50 bg-bg/95 backdrop-blur-md border border-border rounded-md shadow-lg py-1 max-h-60 overflow-y-auto animate-popover-in">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-body-sm transition-colors flex justify-between items-center ${
                  opt.disabled
                    ? "opacity-50 cursor-not-allowed text-ink-muted select-none"
                    : isSelected
                    ? "bg-accent-soft/30 text-accent font-semibold cursor-pointer"
                    : "text-ink-muted hover:bg-bg-subtle hover:text-ink cursor-pointer"
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  const [whatsappNumber, setWhatsappNumber] = useState("41791234567");
  const [autoCheckout, setAutoCheckout] = useState(true);
  const [contactPhone, setContactPhone] = useState("+41 (0) 44 123 4567");
  const [showPhone, setShowPhone] = useState(true);

  // Promo campaign state
  const [promoCode, setPromoCode] = useState("");
  const [promoData, setPromoData] = useState<{ valid: boolean; discountType?: string; discountValue?: number; campaignId?: string; campaignName?: string; error?: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoInputError, setPromoInputError] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const handleApplyPromo = async (codeToApply?: string) => {
    const code = (codeToApply || promoInput).trim().toUpperCase();
    if (!code) {
      setPromoInputError(t("enterPromoCode") || "Please enter a promo code");
      return;
    }
    setPromoInputError("");
    setIsApplyingPromo(true);
    try {
      const res = await validatePromoCode(code, vertical !== "general" ? vertical : undefined);
      if (res.valid) {
        setPromoCode(code);
        setPromoData(res);
        setPromoInput("");
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("promo", code);
          window.history.replaceState({}, "", url.toString());
        }
      } else {
        setPromoInputError(res.error || t("promoInvalid") || "Invalid promo code");
      }
    } catch {
      setPromoInputError("Failed to validate promo code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoData(null);
    setPromoInput("");
    setPromoInputError("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("promo");
      window.history.replaceState({}, "", url.toString());
    }
  };

  useEffect(() => {
    async function loadConfig() {
      const resNum = await getSystemSetting("whatsapp_number");
      if (resNum.success && resNum.value) {
        setWhatsappNumber(resNum.value);
      }
      const resAuto = await getSystemSetting("auto_checkout");
      if (resAuto.success) {
        setAutoCheckout(resAuto.value === null ? true : resAuto.value === "true");
      }
      const resPhone = await getSystemSetting("contact_phone");
      if (resPhone.success && resPhone.value) {
        setContactPhone(resPhone.value);
      }
      const resShowPhone = await getSystemSetting("show_phone_number");
      if (resShowPhone.success) {
        setShowPhone(resShowPhone.value !== "false");
      }
    }
    loadConfig();

    // Parse URL query parameters and local storage to pre-populate intake state
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const area = searchParams.get("area") || searchParams.get("surfaceArea") || searchParams.get("moveoutArea");
      const freq = searchParams.get("frequency") || searchParams.get("freq");
      const time = searchParams.get("time") || searchParams.get("preferredTime");
      const beds = searchParams.get("bedrooms") || searchParams.get("beds");
      const baths = searchParams.get("bathrooms") || searchParams.get("baths");
      const linen = searchParams.get("linen");
      const rooms = searchParams.get("rooms") || searchParams.get("moveoutRooms");
      const scopeParam = searchParams.get("scope") || searchParams.get("moveoutScope") || searchParams.get("addons");
      const notes = searchParams.get("notes") || searchParams.get("specialRequirements") || searchParams.get("requirements");
      const aircraft = searchParams.get("aircraftType");
      const fbo = searchParams.get("fboLocation") || searchParams.get("airportFbo");
      const tail = searchParams.get("tailNumber");
      const vessel = searchParams.get("vesselType");
      const vesselLen = searchParams.get("vesselLength");
      const marina = searchParams.get("marinaLocation");
      const office = searchParams.get("officeType");
      const floors = searchParams.get("floors");
      const property = searchParams.get("propertyType");
      const keyHandling = searchParams.get("keyHandling");
      const stepParam = searchParams.get("step");

      let baseDraft: any = null;
      try {
        const savedDraft = localStorage.getItem("mondar_booking_intake_draft");
        if (savedDraft) {
          baseDraft = JSON.parse(savedDraft);
        }
      } catch (e) {
        // Ignore
      }

      setIntake((prev: any) => {
        const next = { ...prev, ...(baseDraft || {}) };
        if (area) {
          next.surfaceArea = Number(area);
          next.moveoutArea = Number(area);
          next.restaurantSurfaceArea = Number(area);
        }
        if (freq) next.frequency = freq;
        if (time) {
          next.preferredTime = (time === "after-hours" || time === "weekends") ? "business-hours" : time;
        } else if (scopeParam && scopeParam.includes("express_weekend")) {
          next.preferredTime = "business-hours";
        }
        if (beds) next.bedrooms = Number(beds);
        if (baths) next.bathrooms = Number(baths);
        if (linen !== null && linen !== undefined) next.linenChange = linen === "true";
        if (rooms) {
          next.rooms = Number(rooms);
          next.moveoutRooms = Number(rooms);
        }
        if (scopeParam) {
          const parsedScope = scopeParam.split(",").map((s: string) => s.trim()).filter(Boolean);
          if (parsedScope.length > 0) {
            next.moveoutScope = parsedScope;
            next.aviationScope = parsedScope;
            next.yachtScope = parsedScope;
          }
        }
        if (notes) next.specialRequirements = notes;
        if (aircraft) next.aircraftType = aircraft;
        if (fbo) next.fboLocation = fbo;
        if (tail) next.tailNumber = tail;
        if (vessel) next.vesselType = vessel;
        if (vesselLen) next.vesselLength = Number(vesselLen);
        if (marina) next.marinaLocation = marina;
        if (office) next.officeType = office;
        if (floors) next.floors = Number(floors);
        if (property) next.propertyType = property;
        if (keyHandling) next.keyHandling = keyHandling;

        try {
          localStorage.setItem("mondar_booking_intake_draft", JSON.stringify(next));
        } catch (e) {}

        return next;
      });

      const dateParam = searchParams.get("date") || searchParams.get("scheduledAt");
      if (dateParam) {
        setSelectedDate(dateParam);
      }
      const slotParam = searchParams.get("slot") || searchParams.get("timeSlot");
      if (slotParam) {
        setSelectedSlot(slotParam);
      }

      if (stepParam && (stepParam === "1" || stepParam === "2" || stepParam === "3")) {
        setStep(Number(stepParam));
      }

      // Parse promo code from URL
      const promo = searchParams.get("promo");
      if (promo) {
        setPromoCode(promo.toUpperCase());
        setPromoLoading(true);
        validatePromoCode(promo, vertical !== "general" ? vertical : undefined).then((res) => {
          setPromoData(res);
          setPromoLoading(false);
        }).catch(() => {
          setPromoData({ valid: false, error: "Failed to validate promo code" });
          setPromoLoading(false);
        });
      }
    }
  }, []);

  // Intake State
  const [intake, setIntake] = useState<any>({
    // Commercial fields
    officeType: "office",
    surfaceArea: 60,
    rooms: 3,
    floors: 1,
    frequency: "one-off",
    prepayPeriod: "1",
    preferredTime: "business-hours",
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
    yachtScope: ["deck_wash"],

    // Move-out fields
    moveoutRooms: 3,
    moveoutArea: 80,
    moveoutScope: ["handover_guarantee"],

    // Building Care fields
    buildingPropertyType: "residential",
    buildingEntrances: 1,
    buildingFloors: 2,
    buildingCommonArea: 50,
    buildingLift: false,
    buildingGarage: false,
    buildingGarageArea: 0,
    buildingWasteRoom: false,
    buildingWindowCleaning: false,
    buildingWindowFreq: "monthly",
    buildingPortfolioSize: 0,

    // Restaurant fields
    restaurantVenueType: "restaurant",
    restaurantSurfaceArea: 100,
    restaurantCovers: 50,
    restaurantTier: ["tier_a"],
    restaurantKitchenArea: 30,
    restaurantGreaseLoad: "light",
    restaurantHoodLength: 2,
    restaurantHoodsCount: 1,
    restaurantDuctAccessible: false,
    restaurantLastCertified: "",
    restaurantCertRequiredFor: ["insurer"],
    restaurantOperatingHours: "after-hours"
  });

  // Schedule State
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);
  const [minLeadDays, setMinLeadDays] = useState<number>(5);
  const [businessDaysOnly, setBusinessDaysOnly] = useState<boolean>(true);
  const [allowWeekends, setAllowWeekends] = useState<boolean>(false);
  const [allowAfterHours, setAllowAfterHours] = useState<boolean>(false);

  useEffect(() => {
    getSystemSetting("min_lead_time_days").then((res) => {
      if (res.success && res.value !== null) {
        const val = parseInt(res.value, 10);
        if (!isNaN(val)) setMinLeadDays(val);
      }
    });
    getSystemSetting("lead_time_business_days_only").then((res) => {
      if (res.success && res.value !== null) {
        setBusinessDaysOnly(res.value !== "false");
      }
    });
    getSystemSetting("allow_weekend_bookings").then((res) => {
      if (res.success && res.value !== null) {
        setAllowWeekends(res.value === "true");
      }
    });
    getSystemSetting("allow_after_hours_bookings").then((res) => {
      if (res.success && res.value !== null) {
        setAllowAfterHours(res.value === "true");
      }
    });
  }, []);

  // Gracefully fallback preferredTime if setting is disabled
  useEffect(() => {
    if (!allowWeekends && intake.preferredTime === "weekends") {
      setIntake((prev: any) => ({ ...prev, preferredTime: "business-hours" }));
    }
    if (!allowAfterHours && intake.preferredTime === "after-hours") {
      setIntake((prev: any) => ({ ...prev, preferredTime: "business-hours" }));
    }
  }, [allowWeekends, allowAfterHours, intake.preferredTime]);

  const isExpressOrWeekend = 
    intake?.moveoutScope?.includes("express_weekend") ||
    intake?.preferredTime === "weekends" ||
    (intake?.specialRequirements && /express|urgent|24h|wochenende|weekend|samstag|sonntag|saturday|sunday/i.test(intake.specialRequirements));

  const minSelectableDate = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);

    let daysAdded = 0;
    const targetLeadDays = Math.max(1, minLeadDays);
    while (daysAdded < targetLeadDays) {
      d.setDate(d.getDate() + 1);
      const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
      if (!allowWeekends || businessDaysOnly) {
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          daysAdded++;
        }
      } else {
        daysAdded++;
      }
    }
    return d;
  }, [minLeadDays, allowWeekends, businessDaysOnly]);

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  useEffect(() => {
    if (minSelectableDate) {
      setViewDate(new Date(minSelectableDate.getFullYear(), minSelectableDate.getMonth(), 1));
    }
  }, [minSelectableDate]);

  const maxSelectableDate = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  const handlePrevMonth = () => {
    setViewDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setViewDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const isPrevMonthDisabled = React.useMemo(() => {
    const currentMonthStart = new Date(minSelectableDate.getFullYear(), minSelectableDate.getMonth(), 1);
    return viewDate.getTime() <= currentMonthStart.getTime();
  }, [viewDate, minSelectableDate]);

  const isNextMonthDisabled = React.useMemo(() => {
    const maxMonthStart = new Date(maxSelectableDate.getFullYear(), maxSelectableDate.getMonth(), 1);
    return viewDate.getTime() >= maxMonthStart.getTime();
  }, [viewDate, maxSelectableDate]);

  const calendarDays = React.useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayInstance = new Date(year, month, 1);
    const firstDayIndex = firstDayInstance.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const daysList = [];
    for (let i = 0; i < firstDayIndex; i++) {
      daysList.push(null);
    }
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      daysList.push(new Date(year, month, dayNum));
    }
    return daysList;
  }, [viewDate]);

  const isDateDisabled = (dayDate: Date) => {
    const dTime = dayDate.getTime();
    const minTime = minSelectableDate.getTime();
    const mTime = maxSelectableDate.getTime();
    if (dTime < minTime || dTime > mTime) {
      return true;
    }
    
    const dayOfWeek = dayDate.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Supply chain protection: Block weekends if not enabled by admin
    if (isWeekend && !allowWeekends) {
      return true;
    }

    // 4. Check preferredWeekday restrictions for recurring weekly/bi-weekly plans
    const isWeeklyOrBiweekly = intake?.frequency === "weekly" || intake?.frequency === "bi-weekly";
    if (isWeeklyOrBiweekly && selectedWeekday !== null) {
      if (dayDate.getDay() !== selectedWeekday) {
        return true;
      }
    }

    return false;
  };

  const formatDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getWeekdays = (loc: string) => {
    const baseDate = new Date(2026, 4, 3); // May 3, 2026 is Sunday
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      days.push(d.toLocaleDateString(loc, { weekday: "short" }));
    }
    return days;
  };

  const getWeekdayOptions = (loc: string) => {
    const baseDate = new Date(2026, 4, 3); // May 3, 2026 is Sunday
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      days.push({
        value: d.getDay(),
        label: d.toLocaleDateString(loc, { weekday: "long" })
      });
    }
    const sunday = days.shift()!;
    days.push(sunday);
    return days;
  };

  const getFilteredWeekdayOptions = (loc: string) => {
    const allDays = getWeekdayOptions(loc);
    if (vertical === "commercial") {
      if (intake.preferredTime === "weekends") {
        return allDays.filter(d => d.value === 0 || d.value === 6);
      } else if (intake.preferredTime === "business-hours" || intake.preferredTime === "after-hours") {
        return allDays.filter(d => d.value !== 0 && d.value !== 6);
      }
    }
    return allDays;
  };

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

  // Post-booking Password Creation State
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

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
  const isValidVertical = ["commercial", "hospitality", "domestic", "aviation", "yacht", "moveout", "building-care", "restaurant"].includes(vertical) && activeSlugs.includes(vertical);

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
      getAvailableSlots(vertical, selectedDate, intake?.preferredTime).then(res => {
        setLoading(false);
        if (res.success && res.slots) {
          setAvailableSlots(res.slots);
          if (intake?.preferredTime === "after-hours") {
            setSelectedSlot("after-hours");
          }
        } else {
          setError(res.error || t("failedFetchSlots"));
        }
      });
    }
  }, [selectedDate, vertical, intake?.preferredTime]);

  // Pricing calculations
  const calculatePricing = () => {
    let basePrice = 0;
    let sizeAdjustment = 0;
    let frequencyDiscount = 0;
    let addons = 0;

    let hasAfterHoursSurcharge = false;
    let hasWeekendSurcharge = false;

    if (vertical === "commercial") {
      basePrice = 150.00;
      const area = Number(intake.surfaceArea) || 0;
      if (area > 50) {
        sizeAdjustment = (area - 50) * 1.20;
      }
      const freq = intake.frequency;
      if (freq === "weekly") frequencyDiscount = 0.15;
      else if (freq === "bi-weekly") frequencyDiscount = 0.10;
      else if (freq === "monthly") {
        const prepay = intake.prepayPeriod || "1";
        if (prepay === "3") frequencyDiscount = 0.15;
        else if (prepay === "6") frequencyDiscount = 0.20;
        else frequencyDiscount = 0.05;
      }
      if (intake.preferredTime === "after-hours") {
        addons += 50.00;
        hasAfterHoursSurcharge = true;
      } else if (intake.preferredTime === "weekends") {
        addons += 80.00;
        hasWeekendSurcharge = true;
      }
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
      else if (freq === "monthly") {
        const prepay = intake.prepayPeriod || "1";
        if (prepay === "3") frequencyDiscount = 0.15;
        else if (prepay === "6") frequencyDiscount = 0.20;
        else frequencyDiscount = 0.05;
      }
      if (selectedDate) {
        const d = new Date(selectedDate);
        const day = d.getDay();
        if (day === 0 || day === 6) {
          addons += 30.00;
          hasWeekendSurcharge = true;
        }
      }
    }

    const singleSubtotal = basePrice + sizeAdjustment + addons;
    const prepayFactor = (vertical === "commercial" || vertical === "domestic") && intake.frequency === "monthly"
      ? Number(intake.prepayPeriod || "1")
      : 1;

    const subtotal = singleSubtotal * prepayFactor;
    const frequencyDiscountAmount = subtotal * frequencyDiscount;

    // Calculate promo discount (does NOT stack with frequency — higher wins)
    let promoDiscountAmount = 0;
    let promoApplied = false;
    if (promoData?.valid && promoData.discountValue) {
      if (promoData.discountType === "percentage") {
        promoDiscountAmount = subtotal * (promoData.discountValue / 100);
      } else {
        promoDiscountAmount = promoData.discountValue;
      }
    }

    // Use the higher discount
    let effectiveDiscount = frequencyDiscountAmount;
    if (promoDiscountAmount > frequencyDiscountAmount) {
      effectiveDiscount = promoDiscountAmount;
      promoApplied = true;
    }

    const total = Math.max(0, subtotal - effectiveDiscount);
    const deposit = total * 0.30;

    return {
      basePrice,
      sizeAdjustment: Math.round(sizeAdjustment * 100) / 100,
      addons: Math.round(addons * 100) / 100,
      singleSubtotal: Math.round(singleSubtotal * 100) / 100,
      prepayFactor,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(effectiveDiscount * 100) / 100,
      frequencyDiscount: Math.round(frequencyDiscountAmount * 100) / 100,
      promoDiscountAmount: Math.round(promoDiscountAmount * 100) / 100,
      promoApplied,
      total: Math.round(total * 100) / 100,
      deposit: Math.round(deposit * 100) / 100,
      hasAfterHoursSurcharge,
      hasWeekendSurcharge
    };
  };

  const pricing = calculatePricing();

  // Handlers
  const handleIntakeChange = (field: string, val: any) => {
    setIntake((prev: any) => {
      const next = { ...prev, [field]: val };
      try {
        localStorage.setItem("mondar_booking_intake_draft", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    if (field === "preferredTime" || field === "frequency") {
      setSelectedDate("");
      setSelectedSlot("");
      setSelectedWeekday(null);
    }
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
    if (res.success) {
      setOtpCode(res.code || "");
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

  const handleStep1WhatsAppRedirect = () => {
    const frequencyLabel = intake.frequency ? intake.frequency.toUpperCase() : "ONE-OFF";
    
    let detailsText = "";
    if (vertical === "domestic") {
      detailsText = `Bedrooms: ${intake.bedrooms || 0}\nBathrooms: ${intake.bathrooms || 0}\nLinen Service: ${intake.linenChange ? "Yes" : "No"}`;
    } else if (vertical === "commercial") {
      detailsText = `Office Type: ${intake.officeType || "N/A"}\nSurface Area: ${intake.surfaceArea || 0} m²\nRooms: ${intake.rooms || 0}\nFloors: ${intake.floors || 0}`;
    } else if (vertical === "hospitality") {
      detailsText = `Property Type: ${intake.propertyType || "N/A"}\nTurnover Freq: ${intake.turnoverFrequency || "N/A"}\nKey Handling: ${intake.keyHandling || "N/A"}`;
    } else if (vertical === "aviation") {
      detailsText = `Aircraft Type: ${intake.aircraftType || "N/A"}\nTail Number: ${intake.tailNumber || "N/A"}\nFBO Hangar: ${intake.airportFbo || "N/A"}`;
    } else if (vertical === "yacht") {
      detailsText = `Vessel Type: ${intake.vesselType || "N/A"}\nLength: ${intake.vesselLength || 0} ft\nMarina: ${intake.marinaLocation || "N/A"}`;
    } else if (vertical === "moveout") {
      detailsText = `Total Rooms: ${intake.moveoutRooms || 0}\nBed/Bath: ${intake.bedrooms || 0}/${intake.bathrooms || 0}\nSurface Area: ${intake.moveoutArea || 0} m²\nOptions: ${(intake.moveoutScope || []).join(", ")}`;
    } else if (vertical === "building-care") {
      detailsText = `Property Type: ${intake.buildingPropertyType || "N/A"}\nEntrances: ${intake.buildingEntrances || 0}\nFloors: ${intake.buildingFloors || 0}\nCommon Area: ${intake.buildingCommonArea || 0} m²\nLift: ${intake.buildingLift ? "Yes" : "No"}\nGarage: ${intake.buildingGarage ? "Yes" : "No"} (${intake.buildingGarageArea || 0} m²)\nWaste Room: ${intake.buildingWasteRoom ? "Yes" : "No"}\nWindow Clean: ${intake.buildingWindowCleaning ? "Yes" : "No"} (${intake.buildingWindowFreq || "N/A"})\nPortfolio: ${intake.buildingPortfolioSize || 0}`;
    } else if (vertical === "restaurant") {
      detailsText = `Venue Type: ${intake.restaurantVenueType || "N/A"}\nSurface Area: ${intake.restaurantSurfaceArea || 0} m²\nCovers: ${intake.restaurantCovers || 0}\nTiers: ${(intake.restaurantTier || []).join(", ")}\nKitchen Area: ${intake.restaurantKitchenArea || 0} m²\nGrease Load: ${intake.restaurantGreaseLoad || "N/A"}\nHoods: ${intake.restaurantHoodsCount || 0} (${intake.restaurantHoodLength || 0}m)\nDuct Accessible: ${intake.restaurantDuctAccessible ? "Yes" : "No"}\nLast Certified: ${intake.restaurantLastCertified || "N/A"}\nCert Target: ${(intake.restaurantCertRequiredFor || []).join(", ")}`;
    } else if (vertical === "special") {
      detailsText = `Special service request details.`;
    }

    const waMsg = `Mondar Booking Request
---------------------------------------
Division: ${vertical.toUpperCase()}
Frequency: ${frequencyLabel}
${pricing.prepayFactor > 1 ? `Prepayment Commitment: ${pricing.prepayFactor} months\n` : ""}
Details:
${detailsText}

Estimated Amount: CHF ${pricing.total ? pricing.total.toFixed(2) : "0.00"}
---------------------------------------
Please help me schedule this service manually. Thank you!`;

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMsg)}`;
    window.open(whatsappUrl, "_blank");
  };

  const submitBooking = async () => {
    if (!address) {
      setError(t("enterAddressError"));
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await createBooking({
        email: contact.email,
        vertical,
        categorySlug: vertical,
        intake,
        scheduledAtStr: selectedDate,
        scheduledWindow: selectedSlot || (intake.preferredTime === "after-hours" ? "after-hours" : "morning"),
        locationAddress: address,
        promoCode: promoData?.valid ? promoCode : undefined
      });

      if (res.success && res.bookingId) {
        if (!autoCheckout && vertical !== "aviation" && vertical !== "yacht" && vertical !== "moveout" && vertical !== "building-care" && vertical !== "restaurant") {
          // Build WhatsApp message template
          const formattedDate = selectedDate || "Not scheduled";
          const formattedSlot = formatSlotName(selectedSlot) || "Not specified";
          const frequencyLabel = intake.frequency ? intake.frequency.toUpperCase() : "ONE-OFF";
          
          let detailsText = "";
          if (vertical === "domestic") {
            detailsText = `Bedrooms: ${intake.bedrooms || 0}\nBathrooms: ${intake.bathrooms || 0}\nLinen Service: ${intake.linenChange ? "Yes" : "No"}`;
          } else if (vertical === "commercial") {
            detailsText = `Office Type: ${intake.officeType || "N/A"}\nSurface Area: ${intake.surfaceArea || 0} m²\nRooms: ${intake.rooms || 0}\nFloors: ${intake.floors || 0}`;
          } else if (vertical === "hospitality") {
            detailsText = `Property Type: ${intake.propertyType || "N/A"}\nTurnover Freq: ${intake.turnoverFrequency || "N/A"}\nKey Handling: ${intake.keyHandling || "N/A"}`;
          } else if (vertical === "moveout") {
            detailsText = `Total Rooms: ${intake.moveoutRooms || 0}\nBed/Bath: ${intake.bedrooms || 0}/${intake.bathrooms || 0}\nSurface Area: ${intake.moveoutArea || 0} m²\nOptions: ${(intake.moveoutScope || []).join(", ")}`;
          } else if (vertical === "building-care") {
            detailsText = `Property Type: ${intake.buildingPropertyType || "N/A"}\nEntrances: ${intake.buildingEntrances || 0}\nFloors: ${intake.buildingFloors || 0}\nCommon Area: ${intake.buildingCommonArea || 0} m²\nLift: ${intake.buildingLift ? "Yes" : "No"}\nGarage: ${intake.buildingGarage ? "Yes" : "No"} (${intake.buildingGarageArea || 0} m²)\nWaste Room: ${intake.buildingWasteRoom ? "Yes" : "No"}\nWindow Clean: ${intake.buildingWindowCleaning ? "Yes" : "No"} (${intake.buildingWindowFreq || "N/A"})\nPortfolio: ${intake.buildingPortfolioSize || 0}`;
          } else if (vertical === "restaurant") {
            detailsText = `Venue Type: ${intake.restaurantVenueType || "N/A"}\nSurface Area: ${intake.restaurantSurfaceArea || 0} m²\nCovers: ${intake.restaurantCovers || 0}\nTiers: ${(intake.restaurantTier || []).join(", ")}\nKitchen Area: ${intake.restaurantKitchenArea || 0} m²\nGrease Load: ${intake.restaurantGreaseLoad || "N/A"}\nHoods: ${intake.restaurantHoodsCount || 0} (${intake.restaurantHoodLength || 0}m)\nDuct Accessible: ${intake.restaurantDuctAccessible ? "Yes" : "No"}\nLast Certified: ${intake.restaurantLastCertified || "N/A"}\nCert Target: ${(intake.restaurantCertRequiredFor || []).join(", ")}`;
          } else if (vertical === "special") {
            detailsText = `Special service request details.`;
          }

          const waMsg = `Mondar Booking Request
---------------------------------------
Booking ID: ${res.bookingId}
Division: ${vertical.toUpperCase()}
Client Name: ${contact.name || "N/A"}
Email: ${contact.email || "N/A"}
Phone: ${contact.phone || "N/A"}
Address: ${address}
Scheduled Date: ${formattedDate}
Time Slot: ${formattedSlot}
Frequency: ${frequencyLabel}
${pricing.prepayFactor > 1 ? `Prepayment Commitment: ${pricing.prepayFactor} months\n` : ""}
Details:
${detailsText}

Total Amount: CHF ${pricing.total ? pricing.total.toFixed(2) : "0.00"}
Deposit: CHF ${pricing.deposit ? pricing.deposit.toFixed(2) : "0.00"}
---------------------------------------
Please verify and confirm my dispatch request. Thank you!`;

          try {
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMsg)}`;
            window.open(whatsappUrl, "_blank");
          } catch (e) {
            console.error("Popup blocked", e);
          }
        }
        setBookingId(res.bookingId);
        setStep(6);
      } else {
        setError(res.error || t("failedFinalizeBooking"));
      }
    } catch (err: any) {
      console.error("submitBooking error", err);
      setError(err?.message || t("failedFinalizeBooking"));
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passwordInput || passwordInput.length < 8) {
      setPasswordError(t("passwordLengthError"));
      return;
    }
    setPasswordError("");
    setPasswordSaving(true);
    const res = await setCustomerPassword({
      email: contact.email,
      password: passwordInput
    });
    setPasswordSaving(false);
    if (res.success) {
      setPasswordSaved(true);
    } else {
      setPasswordError(res.error || "Failed to set password");
    }
  };

  const formatSlotName = (slotId: string) => {
    if (!slotId) return "";
    if (slotId === "after-hours" || intake?.preferredTime === "after-hours") {
      return intake?.customTimeWindow
        ? `${t("afterHours")} (${intake.customTimeWindow})`
        : t("afterHours");
    }
    const slotObj = availableSlots.find(s => s.id === slotId);
    if (slotObj?.label) return slotObj.label;
    if (slotId === "morning") return t("morningSlot");
    if (slotId === "afternoon") return t("afternoonSlot");
    return slotId;
  };



  if (!isValidVertical) {
    if (vertical === "general") {
      const categoriesList = [
        { slug: "domestic", icon: Sparkles },
        { slug: "moveout", icon: Key },
        { slug: "commercial", icon: Building2 },
        { slug: "hospitality", icon: Home },
        { slug: "aviation", icon: Plane },
        { slug: "yacht", icon: Ship },
        { slug: "special", icon: Shield },
        { slug: "building-care", icon: Building },
        { slug: "restaurant", icon: ChefHat }
      ];

      const activeCategoriesToShow = categoriesList.filter(cat => activeSlugs.includes(cat.slug));
      const capitalize = (s: string) => s.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");

      return (
        <div className="min-h-screen bg-bg text-ink flex flex-col font-body">
          {/* Header */}
          <header className="h-[80px] bg-bg/85 backdrop-blur-md border-b border-border/30 flex items-center px-6 md:px-16 justify-between sticky top-0 z-50">
            <Logo locale={locale} variant="dark" />
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
                        {isSpecial ? baseT("nav.services") : baseT("portfolio.book")}
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
                  {showPhone && (
                    <a
                      href={`tel:${contactPhone.replace(/[^\d+]/g, "")}`}
                      className="flex items-center justify-center gap-3 w-full bg-ink hover:bg-ink-muted text-ink-inverse py-3 rounded-md font-semibold transition-colors border border-border"
                    >
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{t("callDispatch").replace("{phone}", contactPhone)}</span>
                    </a>
                  )}
                   <a
                    href={`https://wa.me/${whatsappNumber}?text=Hello%20Mondar%20Concierge,%20I'd%20like%20to%2520inquire%2520about%2520a%2520specialty%2520post-incident%2520clean.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full bg-accent hover:bg-accent-hover text-ink-inverse py-3 rounded-md font-semibold transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
          <a href={localizeHref("/", locale)} className="block w-full bg-accent hover:bg-accent-hover text-ink-inverse py-3 rounded-md font-semibold transition-colors text-center">
            {t("returnConciergeChat")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-body">
      <header className="h-[80px] bg-bg border-b border-border flex items-center px-6 md:px-16 justify-between">
        <Logo locale={locale} variant="dark" />
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

        {step === 6 ? (
          <div className="bg-bg border border-border p-8 rounded-lg shadow-sm">
            <div className="space-y-6 text-center py-8">
              <div className="h-16 w-16 bg-accent-soft text-accent rounded-full flex items-center justify-center mx-auto mb-6 border border-accent/25">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-display-md font-display font-medium text-ink">
                {["aviation", "yacht", "moveout", "building-care", "restaurant"].includes(vertical) ? t("requestSubmitted") : t("bookingConfirmed")}
              </h2>
              <p className="text-body-md text-ink-muted max-w-[50ch] mx-auto leading-relaxed">
                {["aviation", "yacht", "moveout", "building-care", "restaurant"].includes(vertical) ? (
                  t(
                    vertical === "moveout"
                      ? "thankYouMoveout"
                      : vertical === "building-care"
                      ? "thankYouBuildingCare"
                      : vertical === "restaurant"
                      ? "thankYouRestaurant"
                      : "thankYouAviation"
                  )
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
                {t("scheduled")} {selectedDate} ({formatSlotName(selectedSlot)})
              </div>
              <p className="text-body-sm text-ink-subtle pt-6 max-w-[55ch] mx-auto leading-relaxed">
                {["aviation", "yacht", "moveout", "building-care", "restaurant"].includes(vertical) ? (
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

              {/* Account Activation Section */}
              <div className="bg-bg-subtle border border-border p-6 rounded-lg max-w-md mx-auto text-left mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-body-md font-semibold text-ink">{t("accountCreatedTitle")}</h3>
                    <p className="text-body-xs text-ink-muted leading-relaxed mt-1">
                      {t("accountCreatedDesc").replace("{email}", contact.email)}
                    </p>
                  </div>
                </div>

                {passwordSaved ? (
                  <div className="bg-accent-soft p-5 rounded-md border border-accent/25 flex flex-col items-center gap-3 text-accent text-center animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 shrink-0" />
                      <span className="text-body-sm font-semibold">{t("passwordSavedSuccess")}</span>
                    </div>
                    <p className="text-body-xs text-ink-muted leading-relaxed">
                      Your booking and client profile are securely confirmed and active.
                    </p>
                    <a
                      href={localizeHref("/", locale)}
                      className="bg-accent hover:bg-accent-hover text-ink-inverse font-semibold px-6 py-2.5 rounded-md transition-colors text-button text-center inline-block mt-2 cursor-pointer shadow-xs"
                    >
                      {t("returnHome")}
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleSavePassword} className="space-y-3 pt-2">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordInput}
                        onChange={(e) => {
                          setPasswordInput(e.target.value);
                          if (passwordError) setPasswordError("");
                        }}
                        placeholder={t("setPasswordPlaceholder")}
                        className="w-full border border-border bg-bg p-3 pr-16 rounded-md text-body-sm focus:border-accent outline-none font-sans text-ink placeholder:text-ink-subtle"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink text-caption font-semibold uppercase tracking-wider cursor-pointer select-none"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-body-xs text-red-400">{passwordError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={passwordSaving || !passwordInput}
                      className="w-full bg-accent hover:bg-accent-hover text-ink-inverse font-semibold py-2.5 px-4 rounded-md transition-colors text-button font-body disabled:opacity-50 cursor-pointer"
                    >
                      {passwordSaving ? t("savingPassword") : t("setPasswordBtn")}
                    </button>
                  </form>
                )}
              </div>

              <div className="pt-8">
                <a
                  href={localizeHref("/", locale)}
                  className="bg-accent hover:bg-accent-hover text-ink-inverse font-semibold px-8 py-3.5 rounded-md transition-colors text-button text-center block sm:inline-block cursor-pointer shadow-sm"
                >
                  {t("returnHome")}
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 bg-bg border border-border p-8 rounded-lg shadow-sm">
              {/* Promo Banner */}
              {promoCode && !promoLoading && promoData && (
                <div className={`mb-6 p-4 rounded-md border text-body-sm flex items-center justify-between gap-4 ${
                  promoData.valid
                    ? "bg-accent-soft/20 border-accent/30 text-accent"
                    : promoData.error === "expired"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>
                  {promoData.valid ? (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>
                        Promo <strong>{promoCode}</strong> applied — {promoData.discountType === "percentage" ? `${promoData.discountValue}%` : `CHF ${promoData.discountValue?.toFixed(2)}`} off your booking
                      </span>
                    </div>
                  ) : promoData.error === "expired" ? (
                    <span>{t("promoExpired") || "This offer has expired"}</span>
                  ) : (
                    <span>{promoData.error || t("promoInvalid") || "Invalid promo code"}</span>
                  )}
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-body-xs font-semibold px-2.5 py-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    title="Remove promo code"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t("remove") || "Remove"}</span>
                  </button>
                </div>
              )}
              {promoCode && promoLoading && (
                <div className="mb-6 p-4 rounded-md border border-border bg-bg-subtle text-body-sm text-ink-muted">
                  Validating promo code...
                </div>
              )}
              {/* STEP 1: INTAKE */}
              {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-display-sm font-display font-medium text-ink">{t("describeReqs")}</h2>
              <p className="text-body-sm text-ink-muted">{t("defineScope")}</p>

              {vertical === "commercial" ? (
                <div className="space-y-4 pt-4">
                  <CustomSelect
                    label={t("officeType")}
                    value={intake.officeType}
                    onChange={(val) => handleIntakeChange("officeType", val)}
                    options={[
                      { value: "office", label: t("corporateOffice") },
                      { value: "studio", label: t("studioCreative") },
                      { value: "retail", label: t("retailShowroom") },
                      { value: "gym", label: t("gymFitness") },
                      { value: "restaurant", label: t("restaurantKitchen") }
                    ]}
                  />

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
                    <CustomSelect
                      label={t("frequencies")}
                      value={intake.frequency}
                      onChange={(val) => handleIntakeChange("frequency", val)}
                      options={[
                        { value: "one-off", label: t("oneOffClean") },
                        { value: "weekly", label: t("weeklySave15") },
                        { value: "bi-weekly", label: t("biWeeklySave10") },
                        { value: "monthly", label: t("monthlySave5") }
                      ]}
                    />
                  </div>

                  {intake.frequency === "monthly" && (
                    <div className="pt-2 animate-popover-in">
                      <CustomSelect
                        label={t("prepaymentCommitment")}
                        value={intake.prepayPeriod || "1"}
                        onChange={(val) => handleIntakeChange("prepayPeriod", val)}
                        options={[
                          { value: "1", label: t("prepay1Month") },
                          { value: "3", label: t("prepay3Months") },
                          { value: "6", label: t("prepay6Months") }
                        ]}
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("prefTime")}</label>
                    <div className="flex gap-4">
                      {["business-hours", "after-hours", "weekends"].map((timeVal) => {
                        const isBlocked = (timeVal === "after-hours" && !allowAfterHours) || (timeVal === "weekends" && !allowWeekends);
                        const timeLabels: Record<string, string> = {
                          "business-hours": t("businessHours"),
                          "after-hours": allowAfterHours ? t("afterHours") : `${t("afterHours")} (Paused)`,
                          "weekends": allowWeekends ? t("weekends") : `${t("weekends")} (Paused)`
                        };
                        return (
                          <label key={timeVal} className={`flex items-center gap-2 text-body-sm capitalize ${isBlocked ? "opacity-50 cursor-not-allowed text-ink-muted select-none" : "cursor-pointer"}`}>
                            <input
                              type="radio"
                              name="prefTime"
                              disabled={isBlocked}
                              checked={intake.preferredTime === timeVal}
                              onChange={() => !isBlocked && handleIntakeChange("preferredTime", timeVal)}
                              className="accent-accent disabled:cursor-not-allowed"
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
                  <CustomSelect
                    label={t("propertyType")}
                    value={intake.propertyType}
                    onChange={(val) => handleIntakeChange("propertyType", val)}
                    options={[
                      { value: "Airbnb", label: t("airbnbApartment") },
                      { value: "B&B", label: t("bedBreakfast") },
                      { value: "HolidayLet", label: t("holidayLetChalet") }
                    ]}
                  />

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
                    <CustomSelect
                      label={t("turnoverFreq")}
                      value={intake.frequency}
                      onChange={(val) => handleIntakeChange("frequency", val)}
                      options={[
                        { value: "one-off", label: t("turnoverAsRequested") },
                        { value: "weekly", label: t("weeklySave10") }
                      ]}
                    />
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

                  <CustomSelect
                    label={t("keyHandling")}
                    value={intake.keyHandling}
                    onChange={(val) => handleIntakeChange("keyHandling", val)}
                    options={[
                      { value: "lockbox", label: t("lockboxOnSite") },
                      { value: "smartlock", label: t("smartlockApi") },
                      { value: "in-person", label: t("inPersonHandoff") }
                    ]}
                  />

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("prefTime")}</label>
                    <div className="flex flex-wrap gap-4">
                      {["business-hours", "after-hours", "weekends"].map((timeVal) => {
                        const isBlocked = (timeVal === "after-hours" && !allowAfterHours) || (timeVal === "weekends" && !allowWeekends);
                        const timeLabels: Record<string, string> = {
                          "business-hours": t("businessHours"),
                          "after-hours": allowAfterHours ? t("afterHours") : `${t("afterHours")} (Paused)`,
                          "weekends": allowWeekends ? t("weekends") : `${t("weekends")} (Paused)`
                        };
                        const isSelected = (intake.preferredTime || "business-hours") === timeVal;
                        return (
                          <label key={timeVal} className={`flex items-center gap-2 text-body-sm capitalize ${isBlocked ? "opacity-50 cursor-not-allowed text-ink-muted select-none" : "cursor-pointer"}`}>
                            <input
                              type="radio"
                              name="prefTime-hospitality"
                              disabled={isBlocked}
                              checked={isSelected}
                              onChange={() => !isBlocked && handleIntakeChange("preferredTime", timeVal)}
                              className="accent-accent disabled:cursor-not-allowed"
                            />
                            {timeLabels[timeVal] || timeVal.replace("-", " ")}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : vertical === "aviation" ? (
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomSelect
                      label={t("aircraftType")}
                      value={intake.aircraftType}
                      onChange={(val) => handleIntakeChange("aircraftType", val)}
                      options={[
                        { value: "light_jet", label: t("lightJet") },
                        { value: "mid_size_jet", label: t("midSizeJet") },
                        { value: "heavy_jet", label: t("heavyJet") },
                        { value: "turboprop", label: t("turboprop") },
                        { value: "helicopter", label: t("helicopter") }
                      ]}
                    />
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

                  <CustomSelect
                    label={t("airportFbo")}
                    value={intake.fboLocation}
                    onChange={(val) => handleIntakeChange("fboLocation", val)}
                    options={[
                      { value: "Zürich (LSZH) - Cat Air Service FBO", label: "Zürich (LSZH) - Cat Air Service FBO" },
                      { value: "Zürich (LSZH) - Jet Aviation FBO", label: "Zürich (LSZH) - Jet Aviation FBO" },
                      { value: "Geneva (LSGG) - Signature FBO", label: "Geneva (LSGG) - Signature FBO" },
                      { value: "Dübendorf (LSMD) - Private Hangar", label: "Dübendorf (LSMD) - Private Hangar" },
                      { value: "St. Gallen-Altenrhein (LSZR) - FBO", label: "St. Gallen-Altenrhein (LSZR) - FBO" }
                    ]}
                  />

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
                    <CustomSelect
                      label={t("vesselType")}
                      value={intake.vesselType}
                      onChange={(val) => handleIntakeChange("vesselType", val)}
                      options={[
                        { value: "motor_yacht", label: t("motorYacht") },
                        { value: "sailing_yacht", label: t("sailingYacht") },
                        { value: "catamaran", label: t("catamaranYacht") },
                        { value: "tender", label: t("tenderYacht") }
                      ]}
                    />
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

                  <CustomSelect
                    label={t("marinaLoc")}
                    value={intake.marinaLocation}
                    onChange={(val) => handleIntakeChange("marinaLocation", val)}
                    options={[
                      { value: "Zürich Wollishofen Marina", label: "Zürich Wollishofen Marina" },
                      { value: "Horgen Harbor", label: "Horgen Harbor" },
                      { value: "Rapperswil Harbor", label: "Rapperswil Harbor" },
                      { value: "Geneva Port Noir", label: "Geneva Port Noir" },
                      { value: "Zug Lake Marina", label: "Zug Lake Marina" }
                    ]}
                  />

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
              ) : vertical === "moveout" ? (
                <div className="space-y-4 pt-4">
                  {/* Move-out Intake Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("bedrooms")}</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={intake.bedrooms || 0}
                        onChange={(e) => handleIntakeChange("bedrooms", parseInt(e.target.value) || 0)}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("moveoutRooms")}</label>
                      <input
                        type="number"
                        min="1"
                        max="15"
                        step="0.5"
                        value={intake.moveoutRooms || 3}
                        onChange={(e) => handleIntakeChange("moveoutRooms", parseFloat(e.target.value) || 3)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("surfaceArea")}</label>
                      <input
                        type="number"
                        min="10"
                        max="500"
                        value={intake.moveoutArea || 80}
                        onChange={(e) => handleIntakeChange("moveoutArea", parseInt(e.target.value) || 80)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-caption text-ink font-semibold uppercase block font-body">{t("servScope")}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-body-sm text-ink-muted">
                      {[
                        { id: "handover_guarantee", label: t("handoverGuaranteeOption"), disabled: false },
                        { id: "windows_shutters", label: t("windowShuttersOption"), disabled: false },
                        { id: "oven_deep_clean", label: t("ovenDeepCleanOption"), disabled: false },
                        { id: "balcony_terrace", label: t("balconyTerraceOption"), disabled: false },
                        { id: "carpet_steam", label: t("carpetSteamOption"), disabled: false },
                        { id: "express_weekend", label: allowWeekends ? t("expressWeekendOption") : `${t("expressWeekendOption")} (Paused)`, disabled: !allowWeekends }
                      ].map((item: any) => {
                        const isChecked = intake.moveoutScope?.includes(item.id);
                        return (
                          <label key={item.id} className={`flex items-center gap-2.5 ${item.disabled ? "opacity-50 cursor-not-allowed text-ink-muted select-none" : "cursor-pointer"}`}>
                            <input
                              type="checkbox"
                              disabled={item.disabled}
                              checked={!item.disabled && isChecked}
                              onChange={(e) => {
                                if (item.disabled) return;
                                const nextScope = e.target.checked
                                  ? [...(intake.moveoutScope || []), item.id]
                                  : (intake.moveoutScope || []).filter((id: string) => id !== item.id);
                                handleIntakeChange("moveoutScope", nextScope);
                              }}
                              className="accent-accent h-4 w-4 disabled:cursor-not-allowed"
                            />
                            {item.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("prefTime")}</label>
                    <div className="flex flex-wrap gap-4">
                      {["business-hours", "after-hours", "weekends"].map((timeVal) => {
                        const isBlocked = (timeVal === "after-hours" && !allowAfterHours) || (timeVal === "weekends" && !allowWeekends);
                        const timeLabels: Record<string, string> = {
                          "business-hours": t("businessHours"),
                          "after-hours": allowAfterHours ? t("afterHours") : `${t("afterHours")} (Paused)`,
                          "weekends": allowWeekends ? t("weekends") : `${t("weekends")} (Paused)`
                        };
                        const isSelected = (intake.preferredTime || "business-hours") === timeVal;
                        return (
                          <label key={timeVal} className={`flex items-center gap-2 text-body-sm capitalize ${isBlocked ? "opacity-50 cursor-not-allowed text-ink-muted select-none" : "cursor-pointer"}`}>
                            <input
                              type="radio"
                              name="prefTime-moveout"
                              disabled={isBlocked}
                              checked={isSelected}
                              onChange={() => {
                                if (isBlocked) return;
                                handleIntakeChange("preferredTime", timeVal);
                              }}
                              className="accent-accent disabled:cursor-not-allowed"
                            />
                            {timeLabels[timeVal] || timeVal.replace("-", " ")}
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
                      placeholder={t("specialInstructionsPetsPlaceholder")}
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none h-20 resize-none"
                    />
                  </div>
                </div>
              ) : vertical === "building-care" ? (
                <div className="space-y-4 pt-4">
                  {/* Building Care Intake Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomSelect
                      label={t("propertyType")}
                      value={intake.buildingPropertyType || "residential"}
                      onChange={(val) => handleIntakeChange("buildingPropertyType", val)}
                      options={[
                        { value: "residential", label: t("propertyTypeResidential") },
                        { value: "mixed", label: t("propertyTypeMixed") },
                        { value: "commercial", label: t("propertyTypeCommercial") }
                      ]}
                    />
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("entrancesCount")}</label>
                      <input
                        type="number"
                        min="1"
                        value={intake.buildingEntrances || 1}
                        onChange={(e) => handleIntakeChange("buildingEntrances", parseInt(e.target.value) || 1)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-body"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("floorsCount")}</label>
                      <input
                        type="number"
                        min="1"
                        value={intake.buildingFloors || 2}
                        onChange={(e) => handleIntakeChange("buildingFloors", parseInt(e.target.value) || 2)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-body"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("commonAreaM2")}</label>
                      <input
                        type="number"
                        min="1"
                        value={intake.buildingCommonArea || 50}
                        onChange={(e) => handleIntakeChange("buildingCommonArea", parseInt(e.target.value) || 50)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-body"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer text-body-sm text-ink-muted font-body">
                      <input
                        type="checkbox"
                        checked={intake.buildingLift || false}
                        onChange={(e) => handleIntakeChange("buildingLift", e.target.checked)}
                        className="accent-accent h-4 w-4"
                      />
                      {t("liftPresent")}
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-body-sm text-ink-muted font-body">
                      <input
                        type="checkbox"
                        checked={intake.buildingGarage || false}
                        onChange={(e) => handleIntakeChange("buildingGarage", e.target.checked)}
                        className="accent-accent h-4 w-4"
                      />
                      {t("garagePresent")}
                    </label>
                  </div>

                  {intake.buildingGarage && (
                    <div className="flex flex-col gap-2 pt-2 animate-popover-in">
                      <label className="text-caption text-ink font-semibold uppercase">{t("garageM2")}</label>
                      <input
                        type="number"
                        min="1"
                        value={intake.buildingGarageArea || 100}
                        onChange={(e) => handleIntakeChange("buildingGarageArea", parseInt(e.target.value) || 100)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-body"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer text-body-sm text-ink-muted font-body">
                      <input
                        type="checkbox"
                        checked={intake.buildingWasteRoom || false}
                        onChange={(e) => handleIntakeChange("buildingWasteRoom", e.target.checked)}
                        className="accent-accent h-4 w-4"
                      />
                      {t("wasteRoomIncluded")}
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-body-sm text-ink-muted font-body">
                      <input
                        type="checkbox"
                        checked={intake.buildingWindowCleaning || false}
                        onChange={(e) => handleIntakeChange("buildingWindowCleaning", e.target.checked)}
                        className="accent-accent h-4 w-4"
                      />
                      {t("windowCleaningSeparate")}
                    </label>
                  </div>

                  {intake.buildingWindowCleaning && (
                    <div className="pt-2 animate-popover-in">
                      <CustomSelect
                        label={t("frequencies")}
                        value={intake.buildingWindowFreq || "monthly"}
                        onChange={(val) => handleIntakeChange("buildingWindowFreq", val)}
                        options={[
                          { value: "weekly", label: t("weekly") },
                          { value: "bi-weekly", label: t("biWeekly") },
                          { value: "monthly", label: t("monthly") },
                          { value: "quarterly", label: "Quarterly" }
                        ]}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <CustomSelect
                      label={t("frequencies")}
                      value={intake.frequency || "weekly"}
                      onChange={(val) => handleIntakeChange("frequency", val)}
                      options={[
                        { value: "weekly", label: t("weekly") },
                        { value: "bi-weekly", label: t("biWeekly") },
                        { value: "monthly", label: t("monthly") }
                      ]}
                    />

                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("portfolioSize")}</label>
                      <input
                        type="number"
                        min="0"
                        value={intake.buildingPortfolioSize || 0}
                        onChange={(e) => handleIntakeChange("buildingPortfolioSize", parseInt(e.target.value) || 0)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-body"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("prefTime")}</label>
                    <div className="flex flex-wrap gap-4">
                      {["business-hours", "after-hours", "weekends"].map((timeVal) => {
                        const isBlocked = (timeVal === "after-hours" && !allowAfterHours) || (timeVal === "weekends" && !allowWeekends);
                        const timeLabels: Record<string, string> = {
                          "business-hours": t("businessHours"),
                          "after-hours": allowAfterHours ? t("afterHours") : `${t("afterHours")} (Paused)`,
                          "weekends": allowWeekends ? t("weekends") : `${t("weekends")} (Paused)`
                        };
                        const isSelected = (intake.preferredTime || "business-hours") === timeVal;
                        return (
                          <label key={timeVal} className={`flex items-center gap-2 text-body-sm capitalize ${isBlocked ? "opacity-50 cursor-not-allowed text-ink-muted select-none" : "cursor-pointer"}`}>
                            <input
                              type="radio"
                              name="prefTime-building"
                              disabled={isBlocked}
                              checked={isSelected}
                              onChange={() => !isBlocked && handleIntakeChange("preferredTime", timeVal)}
                              className="accent-accent disabled:cursor-not-allowed"
                            />
                            {timeLabels[timeVal] || timeVal.replace("-", " ")}
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
                      placeholder="Access Schließanlage codes, key repository location..."
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none h-20 resize-none font-body"
                    />
                  </div>
                </div>
              ) : vertical === "restaurant" ? (
                <div className="space-y-4 pt-4">
                  {/* Restaurant Intake Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomSelect
                      label={t("venueType")}
                      value={intake.restaurantVenueType || "restaurant"}
                      onChange={(val) => handleIntakeChange("restaurantVenueType", val)}
                      options={[
                        { value: "restaurant", label: t("venueTypeRestaurant") },
                        { value: "bar", label: t("venueTypeBar") },
                        { value: "cafe", label: t("venueTypeCafe") },
                        { value: "hotel_fnb", label: t("venueTypeHotelFnb") },
                        { value: "commercial_kitchen", label: t("venueTypeCommKitchen") },
                        { value: "bakery", label: t("venueTypeBakery") }
                      ]}
                    />
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("coversSeats")}</label>
                      <input
                        type="number"
                        min="1"
                        value={intake.restaurantCovers || 50}
                        onChange={(e) => handleIntakeChange("restaurantCovers", parseInt(e.target.value) || 50)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-body"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("surfaceArea")}</label>
                      <input
                        type="number"
                        min="1"
                        value={intake.restaurantSurfaceArea || 100}
                        onChange={(e) => handleIntakeChange("restaurantSurfaceArea", parseInt(e.target.value) || 100)}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-body"
                      />
                    </div>
                    <CustomSelect
                      label={t("operatingHours")}
                      value={intake.restaurantOperatingHours || "business-hours"}
                      onChange={(val) => handleIntakeChange("restaurantOperatingHours", val)}
                      options={[
                        { value: "business-hours", label: t("businessHours") },
                        { value: "after-hours", label: allowAfterHours ? t("afterHours") : `${t("afterHours")} (Paused)`, disabled: !allowAfterHours },
                        { value: "weekends", label: allowWeekends ? t("weekends") : `${t("weekends")} (Paused)`, disabled: !allowWeekends }
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-caption text-ink font-semibold uppercase block font-body">{t("cleaningTier")}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-body-sm text-ink-muted">
                      {[
                        { id: "tier_a", label: t("tierACompliance") },
                        { id: "tier_b", label: t("tierBNightly") }
                      ].map((item) => {
                        const isChecked = intake.restaurantTier?.includes(item.id);
                        return (
                          <label key={item.id} className="flex items-center gap-2.5 cursor-pointer font-body">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const nextTiers = e.target.checked
                                  ? [...(intake.restaurantTier || []), item.id]
                                  : (intake.restaurantTier || []).filter((id: string) => id !== item.id);
                                handleIntakeChange("restaurantTier", nextTiers);
                              }}
                              className="accent-accent h-4 w-4"
                            />
                            {item.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {intake.restaurantTier?.includes("tier_a") && (
                    <div className="space-y-4 border-t border-border/60 pt-4 mt-2 animate-popover-in">
                      <h4 className="text-body-sm font-semibold text-accent uppercase tracking-wider font-body">Tier A (Extraction & Compliance) Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-caption text-ink font-semibold uppercase">{t("kitchenSizeM2")}</label>
                          <input
                            type="number"
                            min="1"
                            value={intake.restaurantKitchenArea || 30}
                            onChange={(e) => handleIntakeChange("restaurantKitchenArea", parseInt(e.target.value) || 30)}
                            className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-body"
                          />
                        </div>
                        <CustomSelect
                          label={t("greaseLoad")}
                          value={intake.restaurantGreaseLoad || "light"}
                          onChange={(val) => handleIntakeChange("restaurantGreaseLoad", val)}
                          options={[
                            { value: "light", label: t("greaseLoadLight") },
                            { value: "heavy", label: t("greaseLoadHeavy") }
                          ]}
                        />
                        <div className="flex flex-col gap-2">
                          <label className="text-caption text-ink font-semibold uppercase">{t("hoodLength")}</label>
                          <input
                            type="number"
                            min="1"
                            value={intake.restaurantHoodLength || 2}
                            onChange={(e) => handleIntakeChange("restaurantHoodLength", parseInt(e.target.value) || 2)}
                            className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-body"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-caption text-ink font-semibold uppercase">{t("hoodsCount")}</label>
                          <input
                            type="number"
                            min="1"
                            value={intake.restaurantHoodsCount || 1}
                            onChange={(e) => handleIntakeChange("restaurantHoodsCount", parseInt(e.target.value) || 1)}
                            className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-body"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="flex items-center gap-2.5 cursor-pointer text-body-sm text-ink-muted font-body">
                          <input
                            type="checkbox"
                            checked={intake.restaurantDuctAccessible || false}
                            onChange={(e) => handleIntakeChange("restaurantDuctAccessible", e.target.checked)}
                            className="accent-accent h-4 w-4"
                          />
                          {t("ductAccessible") || "Duct accessible / Roof fan present?"}
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-caption text-ink font-semibold uppercase">{t("lastCertified")}</label>
                          <input
                            type="date"
                            value={intake.restaurantLastCertified || ""}
                            onChange={(e) => handleIntakeChange("restaurantLastCertified", e.target.value)}
                            className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none font-body"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-caption text-ink font-semibold uppercase block font-body">{t("certificateRequiredFor")}</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-body-sm text-ink-muted">
                          {[
                            { id: "insurer", label: t("certForInsurer") },
                            { id: "fire", label: t("certForFire") },
                            { id: "internal", label: t("certForInternal") }
                          ].map((item) => {
                            const isChecked = intake.restaurantCertRequiredFor?.includes(item.id);
                            return (
                              <label key={item.id} className="flex items-center gap-2.5 cursor-pointer font-body">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const nextCerts = e.target.checked
                                      ? [...(intake.restaurantCertRequiredFor || []), item.id]
                                      : (intake.restaurantCertRequiredFor || []).filter((id: string) => id !== item.id);
                                    handleIntakeChange("restaurantCertRequiredFor", nextCerts);
                                  }}
                                  className="accent-accent h-4 w-4"
                                />
                                {item.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <CustomSelect
                    label={t("frequencies")}
                    value={intake.frequency || "one-off"}
                    onChange={(val) => handleIntakeChange("frequency", val)}
                    options={[
                      { value: "one-off", label: t("oneOffClean") },
                      { value: "weekly", label: t("weekly") },
                      { value: "bi-weekly", label: t("biWeekly") },
                      { value: "monthly", label: t("monthly") }
                    ]}
                  />

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase font-body">{t("specInstructions")}</label>
                    <textarea
                      value={intake.specialRequirements}
                      onChange={(e) => handleIntakeChange("specialRequirements", e.target.value)}
                      placeholder="Access codes, grease trap details, alarm bypass instructions..."
                      className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none h-20 resize-none font-body"
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

                  <CustomSelect
                    label={t("frequencies")}
                    value={intake.frequency}
                    onChange={(val) => handleIntakeChange("frequency", val)}
                    options={[
                      { value: "one-off", label: t("oneOffClean") },
                      { value: "weekly", label: t("weeklySave15") },
                      { value: "bi-weekly", label: t("biWeeklySave10") },
                      { value: "monthly", label: t("monthlySave5") }
                    ]}
                  />

                  {intake.frequency === "monthly" && (
                    <div className="pt-2 animate-popover-in">
                      <CustomSelect
                        label={t("prepaymentCommitment")}
                        value={intake.prepayPeriod || "1"}
                        onChange={(val) => handleIntakeChange("prepayPeriod", val)}
                        options={[
                          { value: "1", label: t("prepay1Month") },
                          { value: "3", label: t("prepay3Months") },
                          { value: "6", label: t("prepay6Months") }
                        ]}
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("prefTime")}</label>
                    <div className="flex flex-wrap gap-4">
                      {["business-hours", "after-hours", "weekends"].map((timeVal) => {
                        const isBlocked = (timeVal === "after-hours" && !allowAfterHours) || (timeVal === "weekends" && !allowWeekends);
                        const timeLabels: Record<string, string> = {
                          "business-hours": t("businessHours"),
                          "after-hours": allowAfterHours ? t("afterHours") : `${t("afterHours")} (Paused)`,
                          "weekends": allowWeekends ? t("weekends") : `${t("weekends")} (Paused)`
                        };
                        const isSelected = (intake.preferredTime || "business-hours") === timeVal;
                        return (
                          <label key={timeVal} className={`flex items-center gap-2 text-body-sm capitalize ${isBlocked ? "opacity-50 cursor-not-allowed text-ink-muted select-none" : "cursor-pointer"}`}>
                            <input
                              type="radio"
                              name="prefTime-domestic"
                              disabled={isBlocked}
                              checked={isSelected}
                              onChange={() => !isBlocked && handleIntakeChange("preferredTime", timeVal)}
                              className="accent-accent disabled:cursor-not-allowed"
                            />
                            {timeLabels[timeVal] || timeVal.replace("-", " ")}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("specialInstructions")}</label>
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
                  onClick={() => {
                    if (!autoCheckout) {
                      handleStep1WhatsAppRedirect();
                    } else {
                      setStep(2);
                    }
                  }}
                  className="bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-8 rounded-md transition-colors cursor-pointer"
                >
                  {autoCheckout ? t("continueSchedule") : t("confirmSendWhatsapp")}
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
                {(intake.frequency === "weekly" || intake.frequency === "bi-weekly") && (
                  <div className="space-y-3 pb-2 max-w-md mx-auto animate-popover-in">
                    <label className="text-caption text-ink font-semibold uppercase tracking-wider block">
                      {t("preferredWeekday")}
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {getFilteredWeekdayOptions(locale).map((day) => {
                        const isSelected = selectedWeekday === day.value;
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => {
                              setSelectedWeekday(day.value);
                              if (selectedDate) {
                                const d = new Date(selectedDate);
                                if (d.getDay() !== day.value) {
                                  setSelectedDate("");
                                  setSelectedSlot("");
                                }
                              }
                            }}
                            className={`px-4 py-2 rounded-full border text-body-sm transition-all duration-200 cursor-pointer select-none ${
                              isSelected
                                ? "border-accent bg-accent text-ink-inverse font-semibold"
                                : "border-border bg-bg hover:border-accent/50 text-ink-muted"
                            }`}
                          >
                            <span className="capitalize">{day.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-caption text-ink font-semibold uppercase tracking-wider">
                      {t("serviceDate")}
                    </label>
                    {isExpressOrWeekend ? (
                      <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-1 font-mono">
                        <Zap className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{t("expressPriorityBadge")}</span>
                      </span>
                    ) : minLeadDays > 0 && (
                      <span className="text-[11px] text-accent font-semibold flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t(businessDaysOnly ? "leadTimeNoticeDays" : "leadTimeNoticeCalendarDays", { days: minLeadDays })}</span>
                      </span>
                    )}
                  </div>
                  
                  {isExpressOrWeekend ? (
                    <div className="flex items-center gap-2 p-2.5 mb-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-300 text-body-xs font-medium max-w-md mx-auto">
                      <Zap className="w-4 h-4 shrink-0 text-amber-600 fill-amber-600" />
                      <span>
                        {t("expressPriorityNotice", { date: minSelectableDate.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" }) })}
                      </span>
                    </div>
                  ) : minLeadDays > 0 && (
                    <div className="flex items-center gap-2 p-2.5 mb-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-300 text-body-xs font-medium max-w-md mx-auto">
                      <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        {t("standardLeadTimeNotice", { date: minSelectableDate.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" }) })}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4 max-w-md mx-auto">
                    {/* Month Pagination Header */}
                    <div className="flex items-center justify-between border border-border/60 bg-bg p-2 rounded-lg shadow-sm">
                      <button
                        type="button"
                        disabled={isPrevMonthDisabled}
                        onClick={handlePrevMonth}
                        className="p-2 border border-border/60 hover:border-accent rounded-md hover:bg-accent-soft/20 text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        aria-label="Previous Month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-display font-semibold text-body-md text-ink uppercase tracking-wider">
                        {viewDate.toLocaleDateString(locale, { month: "long", year: "numeric" })}
                      </span>
                      <button
                        type="button"
                        disabled={isNextMonthDisabled}
                        onClick={handleNextMonth}
                        className="p-2 border border-border/60 hover:border-accent rounded-md hover:bg-accent-soft/20 text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        aria-label="Next Month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Weekdays Grid */}
                    <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase font-bold tracking-wider text-ink-subtle">
                      {getWeekdays(locale).map((wd, i) => (
                        <div key={i} className="py-1">
                          {wd}
                        </div>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((dayDate, i) => {
                        if (!dayDate) {
                          return <div key={`empty-${i}`} className="aspect-square" />;
                        }

                        const formatted = formatDateString(dayDate);
                        const isSelected = selectedDate === formatted;
                        const disabled = isDateDisabled(dayDate);

                        return (
                          <button
                            key={formatted}
                            type="button"
                            disabled={disabled}
                            onClick={() => setSelectedDate(formatted)}
                            className={`aspect-square flex flex-col items-center justify-center border rounded-lg transition-all select-none ${
                              disabled
                                ? "border-border/20 opacity-20 bg-bg-subtle cursor-not-allowed"
                                : isSelected
                                ? "border-accent bg-accent-soft/40 shadow-sm text-ink ring-1 ring-accent scale-[1.02]"
                                : "border-border hover:border-accent/40 bg-bg hover:bg-bg-subtle text-ink hover:scale-[1.01]"
                            }`}
                          >
                            <span className="text-body-sm font-semibold font-serif">
                              {dayDate.getDate()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
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
                    ) : intake.preferredTime === "after-hours" ? (
                      <div className="space-y-4 max-w-md mx-auto">
                        <div className="p-4 border border-accent bg-accent-soft/40 ring-1 ring-accent rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-accent" />
                            <div>
                              <span className="text-body-sm font-semibold text-ink">{t("afterHours")}</span>
                              <p className="text-body-xs text-ink-muted">{t("afterHoursSurcharge")} (+CHF 50.00)</p>
                            </div>
                          </div>
                          <div className="h-5 w-5 rounded-full border border-accent bg-accent text-ink-inverse flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>

                        <div className="space-y-2 pt-1">
                          <label className="text-caption text-ink font-semibold uppercase tracking-wider block">
                            {t("specifyAfterHoursTiming")}
                          </label>
                          <input
                            type="text"
                            value={intake.customTimeWindow || ""}
                            onChange={(e) => handleIntakeChange("customTimeWindow", e.target.value)}
                            placeholder={t("specifyAfterHoursPlaceholder")}
                            className="w-full border border-border bg-bg p-3 rounded-md text-body-sm focus:border-accent outline-none text-ink placeholder:text-ink-subtle"
                          />
                        </div>
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

          {/* STEP 3: QUOTE / REVIEW */}
          {step === 3 && (
            <div className="space-y-6">
              {["aviation", "yacht", "special", "moveout", "building-care", "restaurant"].includes(vertical) ? (
                <div className="space-y-4 pt-4">
                  <h2 className="text-display-sm font-display font-medium text-ink">{t("bespokeQuoteRequired")}</h2>
                  <p className="text-body-sm text-ink-muted">
                    {vertical === "moveout" ? t("moveoutQuoteDesc") : vertical === "building-care" ? t("buildingCareQuoteDesc") : vertical === "restaurant" ? t("restaurantQuoteDesc") : t("aviationYachtQuoteDesc")}
                  </p>
                  <div className="border border-border p-6 rounded-md bg-bg-subtle space-y-4 pt-6 text-body-sm leading-relaxed">
                    <span className="text-caption text-accent uppercase font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {t("reviewPending")}
                    </span>
                    <p className="text-[#a6a6a6]">
                      {t("subcontractorNetworkNote")}
                    </p>
                    <p className="text-[#a6a6a6]" dangerouslySetInnerHTML={{ __html: t("dispatchDeskNote") }} />
                    <div className="border-t border-border pt-4 text-caption uppercase text-accent font-semibold flex justify-between">
                      <span>{t("quoteStatus")}</span>
                      <span>{t("quotePending")}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h2 className="text-display-sm font-display font-medium text-ink">{t("reviewDetailsTitle")}</h2>
                  <p className="text-body-sm text-ink-muted">{t("reviewDetailsSubtitle")}</p>

                  <div className="border border-border p-6 rounded-md bg-bg-subtle/50 space-y-4 pt-6 text-body-sm leading-relaxed">
                    <div className="flex justify-between py-2 border-b border-border/40">
                      <span className="font-semibold text-ink-muted">{t("selectedService")}</span>
                      <span className="text-ink font-medium capitalize">{t(`categories.${vertical}.title`)}</span>
                    </div>
                    {intake.officeType && (
                      <div className="flex justify-between py-2 border-b border-border/40">
                        <span className="font-semibold text-ink-muted">{t("officeType")}</span>
                        <span className="text-ink font-medium capitalize">{t(intake.officeType === "office" ? "corporateOffice" : intake.officeType === "studio" ? "studioCreative" : intake.officeType === "retail" ? "retailShowroom" : intake.officeType === "gym" ? "gymFitness" : intake.officeType === "restaurant" ? "restaurantKitchen" : intake.officeType)}</span>
                      </div>
                    )}
                    {intake.surfaceArea && (
                      <div className="flex justify-between py-2 border-b border-border/40">
                        <span className="font-semibold text-ink-muted">{t("surfaceArea")}</span>
                        <span className="text-ink font-medium">{intake.surfaceArea} m²</span>
                      </div>
                    )}
                    {intake.bedrooms && (
                      <div className="flex justify-between py-2 border-b border-border/40">
                        <span className="font-semibold text-ink-muted">{t("bedrooms")}</span>
                        <span className="text-ink font-medium">{intake.bedrooms}</span>
                      </div>
                    )}
                    {intake.bathrooms && (
                      <div className="flex justify-between py-2 border-b border-border/40">
                        <span className="font-semibold text-ink-muted">{t("bathrooms")}</span>
                        <span className="text-ink font-medium">{intake.bathrooms}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-border/40">
                      <span className="font-semibold text-ink-muted">{t("frequencies")}</span>
                      <span className="text-ink font-medium capitalize">{t(intake.frequency)}</span>
                    </div>
                    {intake.frequency === "monthly" && intake.prepayPeriod && (
                      <div className="flex justify-between py-2 border-b border-border/40">
                        <span className="font-semibold text-ink-muted">{t("prepaymentCommitment")}</span>
                        <span className="text-ink font-medium">{intake.prepayPeriod} {t("months")}</span>
                      </div>
                    )}
                    {selectedDate && (
                      <div className="flex justify-between py-2 border-b border-border/40">
                        <span className="font-semibold text-ink-muted">{t("selectedDate")}</span>
                        <span className="text-ink font-medium">{selectedDate}</span>
                      </div>
                    )}
                    {selectedSlot && (
                      <div className="flex justify-between py-2 border-b border-border/40">
                        <span className="font-semibold text-ink-muted">{t("selectedSlot")}</span>
                        <span className="text-ink font-medium">{formatSlotName(selectedSlot)}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-bg-subtle border border-border/60 rounded-md flex items-start gap-2.5 text-body-xs text-ink-muted leading-relaxed mt-4">
                    <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{t("providerCostNote")}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="border border-ink text-ink py-3 px-6 rounded-md transition-colors text-button font-semibold"
                >
                  {t("back")}
                </button>
                <button
                  type="button"
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
                      placeholder="e.g. my@email.com"
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
              {vertical === "aviation" || vertical === "yacht" || vertical === "moveout" ? (
                <div className="space-y-4">
                  <h2 className="text-display-sm font-display font-medium text-ink">{t("confirmRequestSubmission")}</h2>
                  <p className="text-body-sm text-ink-muted">{t("specifyCoordinatesNote")}</p>

                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("exactLocation")}</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={
                        vertical === "aviation"
                          ? t("aviationLocationPlaceholder")
                          : vertical === "yacht"
                          ? t("yachtLocationPlaceholder")
                          : t("moveoutLocationPlaceholder")
                      }
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
              ) : !autoCheckout ? (
                <div className="space-y-4">
                  <h2 className="text-display-sm font-display font-medium text-ink">{t("booking.reviewDetailsTitle")}</h2>
                  <p className="text-body-sm text-ink-muted">{t("booking.whatsappDispatchNotice")}</p>

                  <div className="space-y-4 pt-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-caption text-ink font-semibold uppercase">{t("booking.serviceLocation")}</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t("booking.addressPlaceholder")}
                        className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                      />
                    </div>

                    <div className="border border-border p-6 rounded-md bg-bg-subtle space-y-4 leading-relaxed text-body-sm text-[#a6a6a6]">
                      <span className="text-caption text-accent uppercase font-semibold flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" /> WhatsApp Dispatch Routing
                      </span>
                      <p>
                        Your booking information will be saved directly in our platform database as a draft request. Upon clicking the confirmation button below, a secure WhatsApp message template containing all your specifications will be prepared for you.
                      </p>
                      <p>
                        Our dispatch desk and subcontractor partners in the Zurich region will coordinate manual confirmation details.
                      </p>
                    </div>
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

                    <div className="p-3 bg-bg-subtle border border-border/60 rounded-md flex items-start gap-2.5 text-body-xs text-ink-muted leading-relaxed">
                      <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>{t("providerCostNote")}</span>
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
                  disabled={loading || !address || (autoCheckout && vertical !== "aviation" && vertical !== "yacht" && vertical !== "moveout" && vertical !== "building-care" && vertical !== "restaurant" && !cardName)}
                  className="bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-8 rounded-md transition-colors disabled:opacity-50 cursor-pointer font-body"
                >
                  {loading 
                    ? t("processing") 
                    : ["aviation", "yacht", "moveout", "building-care", "restaurant"].includes(vertical)
                      ? t("submitBespoke") 
                      : !autoCheckout
                        ? t("booking.confirmSendWhatsapp")
                        : `${t("payDeposit")} (CHF ${pricing.deposit})`}
                </button>
              </div>
            </div>
          )}

            </div>

            {/* Pricing / Booking Summary Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {["aviation", "yacht", "special", "moveout", "building-care", "restaurant"].includes(vertical) ? (
                <div className="bg-bg border border-border p-6 rounded-lg shadow-sm space-y-4">
                  <h3 className="text-body-md font-display font-medium text-ink tracking-wide uppercase border-b border-border pb-2">
                    {t("bespokeInquiry")}
                  </h3>
                  <div className="space-y-4 text-body-sm leading-relaxed text-ink-muted">
                    <span className="text-caption text-accent uppercase font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {t("reviewPending")}
                    </span>
                    <p>{t("subcontractorNetworkNote")}</p>
                    <p dangerouslySetInnerHTML={{ __html: t("dispatchDeskNote") }} />
                    <div className="border-t border-border pt-4 text-caption uppercase text-accent font-semibold flex justify-between">
                      <span>{t("quoteStatus")}</span>
                      <span>{t("quotePending")}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-bg border border-border p-6 rounded-lg shadow-sm space-y-4">
                  <h3 className="text-body-sm font-semibold text-ink uppercase tracking-wide border-b border-border/60 pb-2">
                    {t("indicativeEstimate") || t("quoteSummaryTitle")}
                  </h3>
                  <div className="space-y-3 pt-2">
                    {pricing.prepayFactor > 1 && (
                      <div className="text-body-xs font-semibold uppercase text-accent tracking-wider pb-2 border-b border-border/50">
                        {t("prepaymentCommitment")}: {pricing.prepayFactor} {t("months")}
                      </div>
                    )}
                    <div className="flex justify-between text-body-sm text-ink-muted">
                      <span>{t("baseFee")}{pricing.prepayFactor > 1 ? ` (x${pricing.prepayFactor})` : ""}</span>
                      <span>CHF {(pricing.basePrice * pricing.prepayFactor).toFixed(2)}</span>
                    </div>
                    {pricing.sizeAdjustment > 0 && (
                      <div className="flex justify-between text-body-sm text-ink-muted">
                        <span>{t("sizeAdjustment")}{pricing.prepayFactor > 1 ? ` (x${pricing.prepayFactor})` : ""}</span>
                        <span>+CHF {(pricing.sizeAdjustment * pricing.prepayFactor).toFixed(2)}</span>
                      </div>
                    )}
                    {intake.linenChange && (
                      <div className="flex justify-between text-body-sm text-ink-muted">
                        <span>{t("linenLaundry")}{pricing.prepayFactor > 1 ? ` (x${pricing.prepayFactor})` : ""}</span>
                        <span>+CHF {(35 * pricing.prepayFactor).toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.hasAfterHoursSurcharge && (
                      <div className="flex justify-between text-body-sm text-ink-muted">
                        <span>{t("afterHoursSurcharge")}{pricing.prepayFactor > 1 ? ` (x${pricing.prepayFactor})` : ""}</span>
                        <span>+CHF {(50 * pricing.prepayFactor).toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.hasWeekendSurcharge && (
                      <div className="flex justify-between text-body-sm text-ink-muted">
                        <span>{t("weekendSurcharge")}{pricing.prepayFactor > 1 ? ` (x${pricing.prepayFactor})` : ""}</span>
                        <span>+CHF {((vertical === "commercial" ? 80 : 30) * pricing.prepayFactor).toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.promoApplied && pricing.promoDiscountAmount > 0 ? (
                      <div className="flex justify-between items-center text-body-sm text-green-600 font-medium bg-green-500/10 px-2.5 py-1.5 rounded">
                        <span className="flex items-center gap-1.5 font-semibold truncate pr-2">
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Promo {promoCode || promoData?.code} ({promoData?.discountType === "percentage" ? `${promoData.discountValue}% OFF` : `CHF ${promoData?.discountValue} OFF`})</span>
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold">-CHF {pricing.promoDiscountAmount.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={handleRemovePromo}
                            title="Remove promo"
                            className="text-ink-muted hover:text-red-500 transition-colors p-0.5 rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : pricing.frequencyDiscount > 0 ? (
                      <div className="flex justify-between text-body-sm text-green-600 font-medium">
                        <span>{t("frequencyDiscount")}</span>
                        <span>-CHF {pricing.frequencyDiscount.toFixed(2)}</span>
                      </div>
                    ) : null}

                    {/* Promo Code Input when no promo is active */}
                    {!promoData?.valid && (
                      <div className="pt-2 border-t border-border/50 space-y-1.5">
                        <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                          {t("havePromoCode") || "Have a promo code?"}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={promoInput}
                            onChange={(e) => {
                              setPromoInput(e.target.value);
                              if (promoInputError) setPromoInputError("");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyPromo();
                              }
                            }}
                            placeholder="e.g. OPENING15"
                            className="flex-1 min-w-0 border border-border bg-bg text-ink px-2.5 py-1.5 rounded text-body-xs uppercase font-mono placeholder:normal-case placeholder:font-sans focus:border-accent outline-none font-semibold"
                          />
                          <button
                            type="button"
                            disabled={!promoInput.trim() || isApplyingPromo}
                            onClick={() => handleApplyPromo()}
                            className="bg-accent hover:bg-accent-hover disabled:opacity-40 text-ink-inverse text-body-xs font-bold px-3 py-1.5 rounded transition-colors cursor-pointer shrink-0 uppercase tracking-wider"
                          >
                            {isApplyingPromo ? "..." : (t("apply") || "Apply")}
                          </button>
                        </div>
                        {promoInputError && (
                          <p className="text-[11px] text-red-500 font-medium leading-tight">
                            {promoInputError}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="border-t border-border pt-4 flex justify-between items-start text-body-lg text-ink font-bold font-display">
                      <div className="flex flex-col">
                        <span>{t("estimatedBaseTotal") || t("totalAmount")}</span>
                        <span className="text-[11px] font-normal text-ink-muted font-sans italic tracking-normal">
                          {t("hourlySettlementNote") || "(Final cost fixed by provider based on hours taken)"}
                        </span>
                      </div>
                      <span className="shrink-0 text-right">CHF {pricing.total.toFixed(2)}</span>
                    </div>

                    <div className="border-t border-border border-dashed pt-4 flex justify-between items-start text-body-md text-accent font-semibold">
                      <div className="flex flex-col">
                        <span>{t("stripeDeposit")}</span>
                        <span className="text-[10px] font-normal text-ink-muted font-sans tracking-normal">
                          {t("depositSecuresReservation") || "(Deducted from final invoice)"}
                        </span>
                      </div>
                      <span className="shrink-0 text-right">CHF {pricing.deposit.toFixed(2)}</span>
                    </div>

                    <div className="pt-3 border-t border-border/50 text-[11px] text-ink-muted leading-relaxed bg-bg-subtle/80 p-3 rounded-md border border-border/70 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-accent">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>{t("estimateDisclaimerTitle") || "Important: Base Estimate Only"}</span>
                      </div>
                      <p className="text-ink-subtle">
                        {t("providerCostDisclaimer")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
