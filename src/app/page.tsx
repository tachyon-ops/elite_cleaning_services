import Link from "next/link";
import { Plane, Ship, Building2, Home, Shield, Check, ChevronDown, Phone, Mail, Award, Clock } from "lucide-react";
import { checkAndSeedDb } from "@/lib/db/seed-checker";

export default async function HomePage() {
  await checkAndSeedDb();
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-body">
      {/* 4.6 Navigation Bar */}
      <header className="h-[80px] bg-bg border-b border-border flex items-center px-6 md:px-16 sticky top-0 z-50">
        <div className="flex-1 flex items-center">
          <Link href="/" className="font-display text-display-sm font-bold text-ink tracking-tight flex items-center gap-2">
            <span className="text-accent font-serif font-bold">E</span>LITE
          </Link>
        </div>
        <nav className="hidden md:flex gap-8 items-center mr-8">
          <Link href="/aviation" className="text-body-sm font-medium text-ink-muted hover:text-ink transition-colors">Aviation</Link>
          <Link href="/yacht" className="text-body-sm font-medium text-ink-muted hover:text-ink transition-colors">Yacht & Marine</Link>
          <Link href="/commercial" className="text-body-sm font-medium text-ink-muted hover:text-ink transition-colors">Commercial</Link>
          <Link href="/hospitality" className="text-body-sm font-medium text-ink-muted hover:text-ink transition-colors">Hospitality</Link>
          <Link href="/special-services" className="text-body-sm font-medium text-ink-muted hover:text-ink transition-colors">Special Services</Link>
          <Link href="/how-it-works" className="text-body-sm font-medium text-ink-muted hover:text-ink transition-colors">How It Works</Link>
        </nav>
        <div>
          <Link
            href="/book/general"
            className="bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-2 px-6 rounded-md transition-colors"
          >
            GET A QUOTE
          </Link>
        </div>
      </header>

      {/* 5.1 Hero Section */}
      <section className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] lg:min-h-[720px] bg-bg border-b border-border">
        {/* Left Half: Copy */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-16 lg:py-0 max-w-4xl">
          <span className="text-caption text-accent uppercase mb-3">SWISS SPECIALTY BROKERAGE</span>
          <h1 className="text-display-md md:text-display-xl text-ink font-display font-medium leading-none tracking-tight mb-6">
            Specialty cleaning.<br />
            Booked online.<br />
            Done by experts.
          </h1>
          <p className="text-body-lg text-ink-muted mb-8 max-w-[55ch]">
            A curated, Swiss-based network of specialty cleaning subcontractors. Insured delivery, single point of contact, and locked-in recurring schedules.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/book/general"
              className="bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-8 rounded-md transition-all shadow-sm hover:shadow-md"
            >
              Get a quote in 60s
            </Link>
            <Link
              href="#how-it-works"
              className="border border-ink hover:bg-ink hover:text-ink-inverse text-ink text-button font-semibold py-3 px-8 rounded-md transition-all"
            >
              How it works
            </Link>
          </div>
        </div>

        {/* Right Half: Editorial Imagery Block (Line-Art & Fallback Graphic per §6.3) */}
        <div className="flex-1 bg-bg-subtle border-t lg:border-t-0 lg:border-l border-border flex items-center justify-center p-8 lg:p-16 relative overflow-hidden select-none">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#926c15_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="border border-border p-8 md:p-12 bg-bg max-w-md w-full relative z-10 rounded-lg shadow-md">
            <span className="text-caption text-accent block mb-2">METRIC PREVIEW</span>
            <span className="font-display text-display-lg text-ink font-bold block leading-none mb-1">CHF 0.00</span>
            <span className="text-body-sm text-ink-subtle block mb-6">No commitment, full refunds up to 24h prior.</span>
            
            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-accent"></div>
                <span className="text-body-sm font-medium text-ink-muted">Aviation detailing</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-accent"></div>
                <span className="text-body-sm font-medium text-ink-muted">Yacht teak care</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-accent"></div>
                <span className="text-body-sm font-medium text-ink-muted">Commercial offices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="bg-bg-subtle border-b border-border py-6 px-6 md:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-caption text-ink-muted">FULLY INSURED</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-accent" />
            <span className="text-caption text-ink-muted">SWISS-BASED</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-accent" />
            <span className="text-caption text-ink-muted">GDPR COMPLIANT</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-caption text-ink-muted">VETTED PARTNERS</span>
          </div>
          <div className="flex items-center justify-center gap-2 col-span-2 md:col-span-1">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-caption text-ink-muted">RISK-FREE TRIAL</span>
          </div>
        </div>
      </section>

      {/* Vertical Grid Section */}
      <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <span className="text-caption text-accent uppercase block mb-3">OUR PORTFOLIO</span>
          <h2 className="text-display-md text-ink font-display font-medium mb-4">Five Service Verticals</h2>
          <p className="text-body-md text-ink-muted max-w-[60ch] mx-auto">
            Each specialized division operates under custom SLAs, vetted contractors, and specific intake structures to deliver precision Swiss servicing.
          </p>
        </div>

        {/* 5 Cards Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1: Aviation */}
          <div className="border border-border hover:bg-bg-subtle p-8 transition-colors flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="h-12 w-12 bg-accent-soft rounded-sm flex items-center justify-center text-accent mb-6">
                <Plane className="w-6 h-6" />
              </div>
              <span className="text-caption text-accent uppercase block mb-1">AVIATION</span>
              <h3 className="text-display-sm text-ink font-medium mb-3">Private Jets & Helicopters</h3>
              <p className="text-body-sm text-ink-muted">
                Exterior wash, deep interior detailing, and cabin restocking in Swiss hangars and FBOs.
              </p>
            </div>
            <div className="pt-6 border-t border-border flex items-center justify-between mt-6">
              <span className="text-caption text-ink-subtle">QUOTE ON REQUEST</span>
              <Link href="/book/aviation" className="text-body-sm font-semibold text-accent hover:text-accent-hover transition-colors">Book →</Link>
            </div>
          </div>

          {/* Card 2: Yacht */}
          <div className="border border-border hover:bg-bg-subtle p-8 transition-colors flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="h-12 w-12 bg-accent-soft rounded-sm flex items-center justify-center text-accent mb-6">
                <Ship className="w-6 h-6" />
              </div>
              <span className="text-caption text-accent uppercase block mb-1">YACHT & MARINE</span>
              <h3 className="text-display-sm text-ink font-medium mb-3">Vessels & Yacht Decks</h3>
              <p className="text-body-sm text-ink-muted">
                Teak cleaning, interior detail, end-of-season decommissioning, and marina access.
              </p>
            </div>
            <div className="pt-6 border-t border-border flex items-center justify-between mt-6">
              <span className="text-caption text-ink-subtle">QUOTE ON REQUEST</span>
              <Link href="/book/yacht" className="text-body-sm font-semibold text-accent hover:text-accent-hover transition-colors">Book →</Link>
            </div>
          </div>

          {/* Card 3: Commercial */}
          <div className="border border-border hover:bg-bg-subtle p-8 transition-colors flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="h-12 w-12 bg-accent-soft rounded-sm flex items-center justify-center text-accent mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-caption text-accent uppercase block mb-1">COMMERCIAL</span>
              <h3 className="text-display-sm text-ink font-medium mb-3">Offices & Co-working</h3>
              <p className="text-body-sm text-ink-muted">
                Standard cleanups, after-hours deep cleans, and tailored frequencies for office suites.
              </p>
            </div>
            <div className="pt-6 border-t border-border flex items-center justify-between mt-6">
              <span className="text-caption text-ink-subtle">FROM CHF 150</span>
              <Link href="/book/commercial" className="text-body-sm font-semibold text-accent hover:text-accent-hover transition-colors">Book →</Link>
            </div>
          </div>

          {/* Card 4: Hospitality */}
          <div className="border border-border hover:bg-bg-subtle p-8 transition-colors flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="h-12 w-12 bg-accent-soft rounded-sm flex items-center justify-center text-accent mb-6">
                <Home className="w-6 h-6" />
              </div>
              <span className="text-caption text-accent uppercase block mb-1">HOSPITALITY</span>
              <h3 className="text-display-sm text-ink font-medium mb-3">Airbnb Turnover & B&Bs</h3>
              <p className="text-body-sm text-ink-muted">
                Fast turnover schedules, linen management, and smartlock key handovers.
              </p>
            </div>
            <div className="pt-6 border-t border-border flex items-center justify-between mt-6">
              <span className="text-caption text-ink-subtle">FROM CHF 120</span>
              <Link href="/book/hospitality" className="text-body-sm font-semibold text-accent hover:text-accent-hover transition-colors">Book →</Link>
            </div>
          </div>

          {/* Card 5: Special Services */}
          <div className="border border-border hover:bg-bg-subtle p-8 transition-colors flex flex-col justify-between min-h-[300px] md:col-span-2 lg:col-span-1">
            <div>
              <div className="h-12 w-12 bg-accent-soft rounded-sm flex items-center justify-center text-accent mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-caption text-accent uppercase block mb-1">SPECIAL SERVICES</span>
              <h3 className="text-display-sm text-ink font-medium mb-3">Biohazard & Post-Incident</h3>
              <p className="text-body-sm text-ink-muted">
                Restorative cleaning, trauma-incident assistance, and hoarding support. Confidential booking.
              </p>
            </div>
            <div className="pt-6 border-t border-border flex items-center justify-between mt-6">
              <span className="text-caption text-ink-subtle">PHONE ONLY</span>
              <Link href="/book/special-services" className="text-body-sm font-semibold text-accent hover:text-accent-hover transition-colors">Book →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Concierge Banner Section */}
      <section className="bg-ink text-ink-inverse py-24 px-6 md:px-16 border-y border-accent/25 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#926c15_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="text-caption text-accent uppercase tracking-wider block">VIP DIRECT CHANNEL</span>
            <h2 className="text-display-md md:text-display-lg text-ink-inverse font-display font-medium leading-tight">
              Bespoke dispatch.<br />
              Direct via WhatsApp.
            </h2>
            <p className="text-body-md text-ink-subtle max-w-[55ch]">
              For private aviation crews, yacht captains, and luxury estate managers, we offer an on-demand, high-touch dispatch service. Bypass portals and forms—simply send your cleaning requirements, photos of the target cabin/deck/villa, or coordinates directly to our desk. A dedicated Swiss dispatcher will organize the team and confirm your booking within 15 minutes.
            </p>
            <div className="flex flex-wrap gap-8 pt-4">
              <div className="flex flex-col">
                <span className="text-display-xs text-accent font-serif font-bold">&lt; 5 Min</span>
                <span className="text-caption text-ink-subtle uppercase">Response Time</span>
              </div>
              <div className="flex flex-col border-l border-ink-muted/30 pl-8">
                <span className="text-display-xs text-accent font-serif font-bold">24 / 7</span>
                <span className="text-caption text-ink-subtle uppercase">Dispatcher Coverage</span>
              </div>
              <div className="flex flex-col border-l border-ink-muted/30 pl-8">
                <span className="text-display-xs text-accent font-serif font-bold">Vetted</span>
                <span className="text-caption text-ink-subtle uppercase">SLA Matching</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 lg:pl-8">
            <div className="border border-accent/25 bg-bg/5 p-8 rounded-lg backdrop-blur-sm space-y-6">
              <h3 className="text-body-lg font-display text-ink-inverse font-semibold">How to Book via Concierge:</h3>
              <ul className="space-y-4 text-body-sm text-ink-subtle">
                <li className="flex gap-3">
                  <span className="text-accent font-semibold font-serif">1.</span>
                  <span>Tap the WhatsApp link to open a secure direct chat with our Zurich dispatch office.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent font-semibold font-serif">2.</span>
                  <span>Share details (hangar FBO name, vessel length/location, or villa photos).</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent font-semibold font-serif">3.</span>
                  <span>Confirm our tailored subcontractor pricing and lock in your schedule.</span>
                </li>
              </ul>
              <div className="pt-6 border-t border-accent/15">
                <a
                  href="https://wa.me/41791234567?text=Hello%20Elite%20Concierge,%20I'd%20like%20to%20inquire%20about%20a%20specialty%20clean."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.501-5.734-1.453L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.497 0 9.965-4.437 9.968-9.894.002-2.643-1.022-5.127-2.887-6.995C16.48 1.848 14.004.825 11.368.825 5.867.825 1.4 5.26 1.397 10.72c-.001 1.932.504 3.814 1.462 5.474L1.879 22.4l6.402-1.681c-.553-.307-1.112-.663-1.634-1.565z"/>
                  </svg>
                  <span>CONNECT TO CONCIERGE</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="bg-bg-subtle border-y border-border py-24 px-6 md:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="text-caption text-accent uppercase block mb-3">OPERATIONS PROCESS</span>
            <h2 className="text-display-md text-ink font-display font-medium mb-4">How it works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="flex flex-col">
              <span className="font-display text-display-lg text-accent-soft mb-4">01</span>
              <h3 className="text-display-sm text-ink font-semibold mb-2">Tell us about your job</h3>
              <p className="text-body-md text-ink-muted">
                Complete our vertical-specific intake form in under two minutes to define location, size, and custom options.
              </p>
            </div>
            <div className="flex flex-col border-t md:border-t-0 md:border-l border-border pt-8 md:pt-0 md:pl-8">
              <span className="font-display text-display-lg text-accent-soft mb-4">02</span>
              <h3 className="text-display-sm text-ink font-semibold mb-2">Get a price and time</h3>
              <p className="text-body-md text-ink-muted">
                Receive instant quotes for standard jobs or detailed responses within four hours for specialty divisions.
              </p>
            </div>
            <div className="flex flex-col border-t md:border-t-0 md:border-l border-border pt-8 md:pt-0 md:pl-8">
              <span className="font-display text-display-lg text-accent-soft mb-4">03</span>
              <h3 className="text-display-sm text-ink font-semibold mb-2">Vetted dispatch</h3>
              <p className="text-body-md text-ink-muted">
                We coordinate with insured, certified local teams. Receive status reminders, photos, and digital invoices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recurring Pitch Section */}
      <section className="py-24 px-6 md:px-16 max-w-4xl mx-auto w-full text-center">
        <span className="text-caption text-accent uppercase block mb-3">RECURRING ADVANTAGE</span>
        <h2 className="text-display-md text-ink font-display font-medium mb-4">First clean? No commitment.</h2>
        <p className="text-body-lg text-ink-muted mb-8 max-w-[65ch] mx-auto">
          Try our vetted partners once. If you are satisfied with the results, unlock recurring schedules (weekly, bi-weekly, or monthly turnovers) to save 10% on future bookings.
        </p>
        <Link
          href="/book/general"
          className="bg-accent hover:bg-accent-hover text-ink-inverse text-button font-semibold py-3 px-8 rounded-md transition-colors"
        >
          Book Your Trial Clean
        </Link>
      </section>

      {/* FAQ Section */}
      <section className="bg-bg-subtle border-t border-border py-24 px-6 md:px-16">
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="text-caption text-accent uppercase block mb-3">FAQ</span>
            <h2 className="text-display-md text-ink font-display font-medium mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            <details className="group border-b border-border pb-6">
              <summary className="list-none flex items-center justify-between cursor-pointer font-semibold text-body-lg text-ink">
                <span>Do you do the cleaning yourselves?</span>
                <ChevronDown className="w-5 h-5 text-ink-muted group-open:rotate-180 transition-transform duration-base" />
              </summary>
              <p className="text-body-md text-ink-muted mt-4">
                No, Elite acts as a vetted brokerage layer. We manage bookings, quality audits, insurance, and payments, while dispatching the physical service to certified Swiss specialty subcontractors.
              </p>
            </details>

            <details className="group border-b border-border pb-6">
              <summary className="list-none flex items-center justify-between cursor-pointer font-semibold text-body-lg text-ink">
                <span>Where do you operate?</span>
                <ChevronDown className="w-5 h-5 text-ink-muted group-open:rotate-180 transition-transform duration-base" />
              </summary>
              <p className="text-body-md text-ink-muted mt-4">
                We are launching initial service dispatches in Zurich, Lake Zurich, and surrounding municipalities, planning expansion to further Swiss cantons in later phases.
              </p>
            </details>

            <details className="group border-b border-border pb-6">
              <summary className="list-none flex items-center justify-between cursor-pointer font-semibold text-body-lg text-ink">
                <span>What if something is damaged during a session?</span>
                <ChevronDown className="w-5 h-5 text-ink-muted group-open:rotate-180 transition-transform duration-base" />
              </summary>
              <p className="text-body-md text-ink-muted mt-4">
                All assigned subcontractors are vetted to carry liability insurance. In the rare event of damage, Elite mediates the claim and guarantees resolution through our platform pledge.
              </p>
            </details>

            <details className="group border-b border-border pb-6">
              <summary className="list-none flex items-center justify-between cursor-pointer font-semibold text-body-lg text-ink">
                <span>Is my data GDPR secure?</span>
                <ChevronDown className="w-5 h-5 text-ink-muted group-open:rotate-180 transition-transform duration-base" />
              </summary>
              <p className="text-body-md text-ink-muted mt-4">
                Yes. All application servers, Supabase instances, and logs are hosted in European datacenters. We do not track cookies without consent, and you can export or purge your account records at any time.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-ink-inverse mt-auto border-t border-ink-muted/20">
        <div className="max-w-7xl mx-auto px-6 py-16 md:px-16 grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Col 1 */}
          <div>
            <span className="font-display text-display-sm font-bold text-ink-inverse tracking-tight">ELITE</span>
            <p className="text-body-sm text-ink-subtle mt-4 max-w-[25ch]">
              Precision Swiss cleaning brokerage. Confident restraint, immaculate execution.
            </p>
          </div>
          {/* Col 2 */}
          <div>
            <span className="text-caption text-accent uppercase block mb-4">SERVICES</span>
            <ul className="space-y-2 text-body-sm text-ink-subtle">
              <li><Link href="/aviation" className="hover:text-ink-inverse transition-colors">Aviation Division</Link></li>
              <li><Link href="/yacht" className="hover:text-ink-inverse transition-colors">Yacht & Marine</Link></li>
              <li><Link href="/commercial" className="hover:text-ink-inverse transition-colors">Commercial Real Estate</Link></li>
              <li><Link href="/hospitality" className="hover:text-ink-inverse transition-colors">Hospitality & Turnover</Link></li>
            </ul>
          </div>
          {/* Col 3 */}
          <div>
            <span className="text-caption text-accent uppercase block mb-4">COMPANY</span>
            <ul className="space-y-2 text-body-sm text-ink-subtle">
              <li><Link href="/about" className="hover:text-ink-inverse transition-colors">About Us</Link></li>
              <li><Link href="/partners" className="hover:text-ink-inverse transition-colors">Become a Subcontractor</Link></li>
              <li><Link href="/contact" className="hover:text-ink-inverse transition-colors">Contact</Link></li>
            </ul>
          </div>
          {/* Col 4 */}
          <div>
            <span className="text-caption text-accent uppercase block mb-4">CONTACT</span>
            <div className="space-y-3 text-body-sm text-ink-subtle">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent" />
                <span>+41 (0) 44 123 4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent" />
                <span>ops@elite-cleaning.ch</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="border-t border-ink-muted/20 py-8 px-6 md:px-16 text-center text-body-sm text-ink-subtle max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span>&copy; {new Date().getFullYear()} Elite Cleaning Services. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/legal/privacy" className="hover:text-ink-inverse transition-colors">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-ink-inverse transition-colors">Terms of Service</Link>
            <Link href="/legal/cookies" className="hover:text-ink-inverse transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Concierge Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="https://wa.me/41791234567?text=Hello%20Elite%20Concierge,%20I'd%20like%20to%20inquire%20about%20a%20specialty%20clean."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-ink hover:bg-ink-muted text-accent hover:text-accent-hover border border-accent/35 hover:border-accent py-3 px-5 rounded-full flex items-center gap-3 transition-all duration-base shadow-[0_4px_20px_rgba(146,108,21,0.25)] hover:shadow-[0_6px_25px_rgba(146,108,21,0.4)] group"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          <svg className="w-5 h-5 fill-currentColor animate-pulse" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.501-5.734-1.453L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.497 0 9.965-4.437 9.968-9.894.002-2.643-1.022-5.127-2.887-6.995C16.48 1.848 14.004.825 11.368.825 5.867.825 1.4 5.26 1.397 10.72c-.001 1.932.504 3.814 1.462 5.474L1.879 22.4l6.402-1.681c-.553-.307-1.112-.663-1.634-1.565z"/>
          </svg>
          <span className="text-caption tracking-wider font-semibold text-ink-inverse group-hover:text-accent transition-colors">
            CONCIERGE ON-CALL
          </span>
        </a>
      </div>
    </div>
  );
}
