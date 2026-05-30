"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { localizeHref } from "@/lib/i18n";
import { Shield, Sparkles, Building2, Home, Plane, Ship } from "lucide-react";

// Localized strings map for calculator items (supporting all 7 locales)
const CALC_I18N: Record<string, Record<string, string>> = {
  en: {
    title: "ESTIMATE PREVIEW",
    subtitle: "No commitment, full refunds up to 24h prior.",
    commercialClean: "Commercial office cleaning ({area} m²)",
    homeClean: "Home cleaning ({beds} bed / {baths} bath)",
    airbnbClean: "Airbnb turnover ({beds} bed / {baths} bath)",
    linenIncluded: "Linen laundry service included",
    weeklyDiscount: "Weekly scheduling ({discount}% discount)",
    biWeeklyDiscount: "Bi-weekly scheduling ({discount}% discount)",
    monthlyDiscount: "Monthly scheduling ({discount}% discount)",
    oneOffClean: "No commitment, one-off clean",
    fullyInsured: "Fully insured Swiss dispatch",
    keyHandover: "Key handover & automated turnovers",
    quoteOnRequest: "QUOTE ON REQUEST",
    phoneOnly: "PHONE ONLY",
    bespokeDesc: "Custom SLA, dedicated dispatch team.",
    biohazardDesc: "Confidential biohazard & trauma services.",
    vettedSub: "Vetted premium subcontractors",
    dispatchOrganizes: "Bespoke dispatch organizes everything",
    depositCheck: "Online deposit check after confirmation",
    confidentialDispatch: "Strictly confidential dispatch",
    biohazardTech: "Certified biohazard technicians",
    emergencyLine: "24/7 priority emergency line",
    
    // Form labels
    selectService: "Select Service Division",
    frequencyLabel: "Frequency",
    timingLabel: "Preferred Timing",
    surfaceAreaLabel: "Surface Area",
    bedroomsLabel: "Bedrooms",
    bathroomsLabel: "Bathrooms",
    linenLabel: "Linen Laundering (+CHF 35)",
    bookButton: "Book Current Service →",
    requestQuoteButton: "Request Bespoke Quote →",
    callDispatchButton: "Contact Dispatch Only →",
    
    // Divisions
    divCommercial: "Commercial / Office",
    divDomestic: "Home & Villa (Domestic)",
    divHospitality: "Airbnb / B&B (Hospitality)",
    divAviation: "Private Jets & Aviation",
    divYacht: "Yachts & Marine",
    divSpecial: "Special Services / Biohazard"
  },
  de: {
    title: "OFFERTENVORSCHAU",
    subtitle: "Keine Verpflichtung, volle Rückerstattung bis zu 24h vorher.",
    commercialClean: "Gewerbliche Büroreinigung ({area} m²)",
    homeClean: "Wohnungsreinigung ({beds} Zi. / {baths} Bad)",
    airbnbClean: "Airbnb-Reinigung ({beds} Zi. / {baths} Bad)",
    linenIncluded: "Wäschedienst inklusive",
    weeklyDiscount: "Wöchentlicher Turnus ({discount}% Rabatt)",
    biWeeklyDiscount: "Zweiwöchentlicher Turnus ({discount}% Rabatt)",
    monthlyDiscount: "Monatlicher Turnus ({discount}% Rabatt)",
    oneOffClean: "Keine Verpflichtung, einmalige Reinigung",
    fullyInsured: "Vollständig versicherte Schweizer Ausführung",
    keyHandover: "Schlüsselübergabe & automatisierte Abläufe",
    quoteOnRequest: "OFFERTE AUF ANFRAGE",
    phoneOnly: "NUR TELEFONISCH",
    bespokeDesc: "Individuelle SLAs, dediziertes Dispositionsteam.",
    biohazardDesc: "Diskrete Spezialreinigung & Notfalldienst.",
    vettedSub: "Geprüfte Premium-Partnerunternehmen",
    dispatchOrganizes: "Koordination durch Schweizer Zentrale",
    depositCheck: "Online-Anzahlung nach Bestätigung",
    confidentialDispatch: "Streng vertrauliche Abwicklung",
    biohazardTech: "Zertifizierte Spezialreiniger",
    emergencyLine: "24/7 Priority-Notfallnummer",
    
    // Form labels
    selectService: "Reinigungsklasse wählen",
    frequencyLabel: "Turnus",
    timingLabel: "Reinigungszeit",
    surfaceAreaLabel: "Fläche",
    bedroomsLabel: "Zimmer",
    bathroomsLabel: "Badezimmer",
    linenLabel: "Wäscheservice (+CHF 35)",
    bookButton: "Dienstleistung buchen →",
    requestQuoteButton: "Bespoke Offerte anfordern →",
    callDispatchButton: "Ausschließlich telefonisch →",
    
    // Divisions
    divCommercial: "Gewerbe / Büro",
    divDomestic: "Haus & Villa (Privat)",
    divHospitality: "Airbnb / B&B",
    divAviation: "Private Jets & Aviatik",
    divYacht: "Yachten & Marine",
    divSpecial: "Spezialreinigung / Biohazard"
  },
  fr: {
    title: "APERÇU DU DEVIS",
    subtitle: "Sans engagement, remboursement intégral jusqu'à 24h avant.",
    commercialClean: "Nettoyage de bureaux ({area} m²)",
    homeClean: "Nettoyage de maison ({beds} ch. / {baths} sdb)",
    airbnbClean: "Ménage Airbnb ({beds} ch. / {baths} sdb)",
    linenIncluded: "Blanchisserie incluse",
    weeklyDiscount: "Planification hebdomadaire ({discount}% de remise)",
    biWeeklyDiscount: "Planification bihebdomadaire ({discount}% de remise)",
    monthlyDiscount: "Planification mensuelle ({discount}% de remise)",
    oneOffClean: "Sans engagement, nettoyage ponctuel",
    fullyInsured: "Attribution suisse entièrement assurée",
    keyHandover: "Remise des clés & rotations automatisées",
    quoteOnRequest: "DEVIS SUR DEMANDE",
    phoneOnly: "PAR TÉLÉPHONE UNIQUEMENT",
    bespokeDesc: "SLA sur mesure, équipe de dispatch dédiée.",
    biohazardDesc: "Services confidentiels d'assainissement.",
    vettedSub: "Sous-traitants premium agréés",
    dispatchOrganizes: "Le dispatch organise tout",
    depositCheck: "Acompte en ligne après confirmation",
    confidentialDispatch: "Dispatch strictement confidentiel",
    biohazardTech: "Techniciens certifiés risques bio",
    emergencyLine: "Ligne d'urgence prioritaire 24/7",
    
    // Form labels
    selectService: "Sélectionner la division",
    frequencyLabel: "Fréquence",
    timingLabel: "Horaire",
    surfaceAreaLabel: "Surface",
    bedroomsLabel: "Chambres",
    bathroomsLabel: "Salles de bain",
    linenLabel: "Blanchisserie (+CHF 35)",
    bookButton: "Réserver ce service →",
    requestQuoteButton: "Demander un devis sur mesure →",
    callDispatchButton: "Contacter le dispatch uniquement →",
    
    // Divisions
    divCommercial: "Commercial / Bureau",
    divDomestic: "Maison & Villa (Privé)",
    divHospitality: "Airbnb / B&B",
    divAviation: "Jets Privés & Aviation",
    divYacht: "Yachts & Marine",
    divSpecial: "Services Spéciaux / Risques"
  },
  es: {
    title: "VISTA PREVIA DE PRECIOS",
    subtitle: "Sin compromiso, reembolso completo hasta 24h antes.",
    commercialClean: "Limpieza de oficinas ({area} m²)",
    homeClean: "Limpieza del hogar ({beds} hab. / {baths} baño)",
    airbnbClean: "Ménage Airbnb ({beds} hab. / {baths} baño)",
    linenIncluded: "Lavandería de sábanas incluida",
    weeklyDiscount: "Planificación semanal ({discount}% de descuento)",
    biWeeklyDiscount: "Planificación quincenal ({discount}% de descuento)",
    monthlyDiscount: "Planificación mensual ({discount}% de descuento)",
    oneOffClean: "Sin compromiso, limpieza única",
    fullyInsured: "Despacho suizo totalmente asegurado",
    keyHandover: "Entrega de llaves y turnos automáticos",
    quoteOnRequest: "PRESUPUESTO BAJO PETICIÓN",
    phoneOnly: "SÓLO POR TELÉFONO",
    bespokeDesc: "SLA a medida, despacho dedicado.",
    biohazardDesc: "Servicios confidenciales bio y traumas.",
    vettedSub: "Subcontratistas premium evaluados",
    dispatchOrganizes: "El despacho organiza todo",
    depositCheck: "Depósito en línea tras confirmación",
    confidentialDispatch: "Despacho estrictamente confidencial",
    biohazardTech: "Técnicos certificados en bio-riesgos",
    emergencyLine: "Línea de emergencia 24/7",
    
    // Form labels
    selectService: "Seleccionar división",
    frequencyLabel: "Frecuencia",
    timingLabel: "Horario preferido",
    surfaceAreaLabel: "Superficie",
    bedroomsLabel: "Habitaciones",
    bathroomsLabel: "Baños",
    linenLabel: "Lavandería (+CHF 35)",
    bookButton: "Reservar este servicio →",
    requestQuoteButton: "Solicitar presupuesto a medida →",
    callDispatchButton: "Contacto telefónico solamente →",
    
    // Divisions
    divCommercial: "Comercial / Oficinas",
    divDomestic: "Hogar y Villa (Doméstico)",
    divHospitality: "Airbnb / B&B",
    divAviation: "Jets Privados y Aviación",
    divYacht: "Yates y Náutica",
    divSpecial: "Servicios Especiales / Bio"
  },
  it: {
    title: "ANTEPRIMA PREZZI",
    subtitle: "Nessun impegno, rimborso completo fino a 24 ore prima.",
    commercialClean: "Pulizia uffici commerciali ({area} m²)",
    homeClean: "Pulizia casa ({beds} camere / {baths} bagni)",
    airbnbClean: "Pulizia Airbnb ({beds} camere / {baths} bagni)",
    linenIncluded: "Servizio lavanderia incluso",
    weeklyDiscount: "Pianificazione settimanale ({discount}% di sconto)",
    biWeeklyDiscount: "Pianificazione bisettimanale ({discount}% di sconto)",
    monthlyDiscount: "Pianificazione mensile ({discount}% di sconto)",
    oneOffClean: "Nessun impegno, pulizia singola",
    fullyInsured: "Invio svizzero completamente assicurato",
    keyHandover: "Consegna chiavi e turni automatizzati",
    quoteOnRequest: "PREVENTIVO SU RICHIESTA",
    phoneOnly: "SOLO TELEFONICAMENTE",
    bespokeDesc: "SLA personalizzati, team di invio dedicato.",
    biohazardDesc: "Pulizie biohazard e post-incidente discrete.",
    vettedSub: "Subappaltatori svizzeri premium selezionati",
    dispatchOrganizes: "Gestione totale da centrale svizzera",
    depositCheck: "Deposito online dopo la conferma",
    confidentialDispatch: "Gestione strettamente riservata",
    biohazardTech: "Tecnici biohazard certificati",
    emergencyLine: "Numero d'emergenza prioritario 24/7",
    
    // Form labels
    selectService: "Seleziona divisione",
    frequencyLabel: "Frequenza",
    timingLabel: "Orario preferito",
    surfaceAreaLabel: "Superficie",
    bedroomsLabel: "Camere da letto",
    bathroomsLabel: "Bagni",
    linenLabel: "Lavanderia lenzuola (+CHF 35)",
    bookButton: "Prenota questo servizio →",
    requestQuoteButton: "Richiedi preventivo su misura →",
    callDispatchButton: "Solo contatti telefonici →",
    
    // Divisions
    divCommercial: "Commerciale / Uffici",
    divDomestic: "Casa & Villa (Privato)",
    divHospitality: "Airbnb / B&B",
    divAviation: "Jet Privati & Aviazione",
    divYacht: "Yacht & Marine",
    divSpecial: "Servizi Speciali / Bio"
  },
  pt: {
    title: "PRÉ-VISUALIZAÇÃO DE PREÇOS",
    subtitle: "Sem compromisso, reembolso total até 24h antes.",
    commercialClean: "Limpeza de escritórios ({area} m²)",
    homeClean: "Limpeza doméstica ({beds} quartos / {baths} banhos)",
    airbnbClean: "Limpeza Airbnb ({beds} quartos / {baths} banhos)",
    linenIncluded: "Lavandaria de lençóis incluída",
    weeklyDiscount: "Planeamento semanal ({discount}% de desconto)",
    biWeeklyDiscount: "Planeamento quinzenal ({discount}% de desconto)",
    monthlyDiscount: "Planeamento mensal ({discount}% de desconto)",
    oneOffClean: "Sem compromisso, limpeza única",
    fullyInsured: "Envio suíço totalmente segurado",
    keyHandover: "Entrega de chaves & turnos automatizados",
    quoteOnRequest: "ORÇAMENTO SOB PEDIDO",
    phoneOnly: "APENAS POR TELEFONE",
    bespokeDesc: "SLAs à medida, equipa de despacho dedicada.",
    biohazardDesc: "Serviços confidenciais de bio-risco e trauma.",
    vettedSub: "Subcontratados premium avaliados",
    dispatchOrganizes: "Despacho suíço organiza tudo",
    depositCheck: "Depósito online após confirmação",
    confidentialDispatch: "Despacho estritamente confidencial",
    biohazardTech: "Técnicos certificados em bio-risco",
    emergencyLine: "Linha de emergência priority 24/7",
    
    // Form labels
    selectService: "Selecionar divisão",
    frequencyLabel: "Frequência",
    timingLabel: "Horário de preferência",
    surfaceAreaLabel: "Área de superfície",
    bedroomsLabel: "Quartos",
    bathroomsLabel: "Casas de banho",
    linenLabel: "Serviço de lavandaria (+CHF 35)",
    bookButton: "Reservar este serviço →",
    requestQuoteButton: "Solicitar orçamento sob medida →",
    callDispatchButton: "Contacto por telefone apenas →",
    
    // Divisions
    divCommercial: "Comercial / Escritório",
    divDomestic: "Casa & Vivenda (Doméstico)",
    divHospitality: "Airbnb / B&B",
    divAviation: "Jets Privados & Aviação",
    divYacht: "Iates & Náutica",
    divSpecial: "Serviços Especiais / Bio"
  },
  rm: {
    title: "VISTA PRELIMINARA",
    subtitle: "Nagut commitments, reembursament cumplain fin 24h avant.",
    commercialClean: "Nettegiament da buros ({area} m²)",
    homeClean: "Nettegiament domestic ({beds} stivas / {baths} bagn)",
    airbnbClean: "Rotaziun Airbnb ({beds} stivas / {baths} bagn)",
    linenIncluded: "Servetsch da lavanderia inclus",
    weeklyDiscount: "Planisaziun emnila ({discount}% rabat)",
    biWeeklyDiscount: "Planisaziun bisemnala ({discount}% rabat)",
    monthlyDiscount: "Planisaziun mensila ({discount}% rabat)",
    oneOffClean: "Nagut commitments, nettegiament singul",
    fullyInsured: "Tramissun svizra cumplettamain assicurada",
    keyHandover: "Surdada da clavs & turni automatisads",
    quoteOnRequest: "OFFERTA SUL PROPOSTA",
    phoneOnly: "SULET TRAS TELEFON",
    bespokeDesc: "SLAs customisads, team da tramissun deditgà.",
    biohazardDesc: "Nettegiament da biohazard confidenzial.",
    vettedSub: "Partenaris premium controllads",
    dispatchOrganizes: "Tramissun svizra organisescha tut",
    depositCheck: "Acquist d'anzahlung online suenter confermaziun",
    confidentialDispatch: "Tramissun strictamain confidenziala",
    biohazardTech: "Tecnichers da biohazard zertifikads",
    emergencyLine: "Linia d'urgenza prioritara 24/7",
    
    // Form labels
    selectService: "Eleger la divisiun",
    frequencyLabel: "Fréquence (Turnus)",
    timingLabel: "Reinigungszeit (Temp)",
    surfaceAreaLabel: "Fläche (Superficie)",
    bedroomsLabel: "Stivas / Cambras",
    bathroomsLabel: "Bagn / Toilets",
    linenLabel: "Servetsch da lavanderia (+CHF 35)",
    bookButton: "Reservar quest servetsch →",
    requestQuoteButton: "Dumandar offerta customisada →",
    callDispatchButton: "Sulet via telefon →",
    
    // Divisions
    divCommercial: "Commercial / Buros",
    divDomestic: "Chasa & Villa (Privat)",
    divHospitality: "Airbnb / B&B",
    divAviation: "Jets Privads & Aviaziun",
    divYacht: "Iahts & Marine",
    divSpecial: "Servetschs Specials / Bio"
  }
};

export default function HeroQuoteCalculator() {
  const { locale, t: mainT } = useLanguage();
  const router = useRouter();

  // Normalize locale key
  const cleanLocale = (locale || "de").toLowerCase().slice(0, 2);
  const calcText = CALC_I18N[cleanLocale] || CALC_I18N.en;

  // Form selections state
  const [vertical, setVertical] = useState("commercial");
  const [surfaceArea, setSurfaceArea] = useState(120);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [linenChange, setLinenChange] = useState(false);
  const [frequency, setFrequency] = useState("weekly");
  const [preferredTime, setPreferredTime] = useState("after-hours");

  // Calculate pricing values dynamically (matches official booking algorithms)
  const calculatePricing = () => {
    if (vertical === "aviation" || vertical === "yacht") {
      return { priceStr: calcText.quoteOnRequest, isQuote: true };
    }
    if (vertical === "special") {
      return { priceStr: calcText.phoneOnly, isQuote: true };
    }

    let basePrice = 0;
    let sizeAdjustment = 0;
    let frequencyDiscount = 0;
    let addons = 0;

    if (vertical === "commercial") {
      basePrice = 150.00;
      if (surfaceArea > 50) {
        sizeAdjustment = (surfaceArea - 50) * 1.20;
      }
      if (frequency === "weekly") frequencyDiscount = 0.15;
      else if (frequency === "bi-weekly") frequencyDiscount = 0.10;
      else if (frequency === "monthly") frequencyDiscount = 0.05;
      
      if (preferredTime === "after-hours") addons += 50.00;
      else if (preferredTime === "weekends") addons += 80.00;
    } else if (vertical === "hospitality") {
      basePrice = 120.00;
      sizeAdjustment = (bedrooms - 1) * 30.00 + (bathrooms - 1) * 20.00;
      if (linenChange) addons += 35.00;
      if (frequency === "weekly") frequencyDiscount = 0.10;
    } else if (vertical === "domestic") {
      basePrice = 80.00;
      sizeAdjustment = (bedrooms - 1) * 20.00 + (bathrooms - 1) * 15.00;
      if (frequency === "weekly") frequencyDiscount = 0.15;
      else if (frequency === "bi-weekly") frequencyDiscount = 0.10;
      else if (frequency === "monthly") frequencyDiscount = 0.05;
      
      if (preferredTime === "weekends") addons += 30.00;
    }

    const singleSubtotal = basePrice + sizeAdjustment + addons;
    const total = singleSubtotal - (singleSubtotal * frequencyDiscount);
    
    return {
      priceStr: `CHF ${total.toFixed(2)}`,
      isQuote: false,
      discountPercent: Math.round(frequencyDiscount * 100)
    };
  };

  const pricing = calculatePricing();

  // Dynamically compute list bullet items matching calculated state
  const getBulletItems = () => {
    if (vertical === "aviation" || vertical === "yacht") {
      return [
        calcText.vettedSub,
        calcText.dispatchOrganizes,
        calcText.depositCheck
      ];
    }
    if (vertical === "special") {
      return [
        calcText.confidentialDispatch,
        calcText.biohazardTech,
        calcText.emergencyLine
      ];
    }

    const bullets: string[] = [];

    // Bullet 1: Service Type and Sizing detail
    if (vertical === "commercial") {
      bullets.push(calcText.commercialClean.replace("{area}", String(surfaceArea)));
    } else if (vertical === "domestic") {
      bullets.push(calcText.homeClean.replace("{beds}", String(bedrooms)).replace("{baths}", String(bathrooms)));
    } else if (vertical === "hospitality") {
      bullets.push(calcText.airbnbClean.replace("{beds}", String(bedrooms)).replace("{baths}", String(bathrooms)));
    }

    // Bullet 2: Frequency & Discount description
    if (pricing.discountPercent > 0) {
      const template = frequency === "weekly" 
        ? calcText.weeklyDiscount 
        : frequency === "bi-weekly" 
        ? calcText.biWeeklyDiscount 
        : calcText.monthlyDiscount;
      bullets.push(template.replace("{discount}", String(pricing.discountPercent)));
    } else {
      bullets.push(calcText.oneOffClean);
    }

    // Optional laundry bullet for hospitality
    if (vertical === "hospitality" && linenChange) {
      bullets.push(calcText.linenIncluded);
    }

    // Bullet 3: Vetting & Dispatch status
    if (vertical === "hospitality") {
      bullets.push(calcText.keyHandover);
    } else {
      bullets.push(calcText.fullyInsured);
    }

    // Keep it exactly to 3 items for strict design constraints
    return bullets.slice(0, 3);
  };

  const bullets = getBulletItems();

  // Redirect to booking wizard with parameters encoded as query parameters
  const handleBookingRedirect = () => {
    if (vertical === "special") {
      router.push(localizeHref("/book/special-services", locale));
      return;
    }
    
    // Construct query parameters representing current calculator choices
    const queryParts = [];
    if (vertical === "commercial") {
      queryParts.push(`area=${surfaceArea}`);
    } else {
      queryParts.push(`bedrooms=${bedrooms}`);
      queryParts.push(`bathrooms=${bathrooms}`);
      if (vertical === "hospitality") {
        queryParts.push(`linen=${linenChange}`);
      }
    }
    queryParts.push(`frequency=${frequency}`);
    queryParts.push(`time=${preferredTime}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    
    // Perform localized redirection to the correct vertical booking slug
    const targetUrl = localizeHref(`/book/${vertical}${queryString}`, locale);
    router.push(targetUrl);
  };

  return (
    <div className="max-w-md w-full flex flex-col gap-6 relative z-10 select-none">
      {/* Estimate Preview Card */}
      <div className="border border-border p-8 bg-bg rounded-lg shadow-md transition-all duration-300">
        <span className="text-caption text-accent block mb-2">{calcText.title}</span>
        <span className="font-display text-display-lg text-ink font-bold block leading-none mb-1">
          {pricing.priceStr}
        </span>
        <span className="text-body-sm text-ink-subtle block mb-6">
          {vertical === "aviation" || vertical === "yacht"
            ? calcText.bespokeDesc
            : vertical === "special"
            ? calcText.biohazardDesc
            : calcText.subtitle}
        </span>
        
        <div className="space-y-4 border-t border-border pt-6 min-h-[140px] flex flex-col justify-center">
          {bullets.map((bullet, idx) => (
            <div key={idx} className="flex items-center gap-3 animate-fade-in">
              <div className="h-2 w-2 rounded-full bg-accent shrink-0"></div>
              <span className="text-body-sm font-medium text-ink-muted leading-snug">{bullet}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calculator Configurator Panel */}
      <div className="border border-border p-6 bg-bg-subtle rounded-lg shadow-sm space-y-4">
        {/* Division Selector */}
        <div>
          <label className="text-[10px] text-ink-muted font-bold uppercase tracking-wider block mb-1">
            {calcText.selectService}
          </label>
          <select
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
            className="w-full border border-border bg-bg text-ink p-2.5 rounded text-body-sm focus:border-accent outline-none font-semibold cursor-pointer"
          >
            <option value="commercial">{calcText.divCommercial}</option>
            <option value="domestic">{calcText.divDomestic}</option>
            <option value="hospitality">{calcText.divHospitality}</option>
            <option value="aviation">{calcText.divAviation}</option>
            <option value="yacht">{calcText.divYacht}</option>
            <option value="special">{calcText.divSpecial}</option>
          </select>
        </div>

        {/* Dynamic Parameters block based on Vertical selection */}
        {vertical === "commercial" && (
          <div className="animate-fade-in space-y-2">
            <div className="flex justify-between items-center text-[10px] text-ink-muted font-bold uppercase tracking-wider">
              <span>{calcText.surfaceAreaLabel}</span>
              <span className="text-accent font-mono">{surfaceArea} m²</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={surfaceArea}
              onChange={(e) => setSurfaceArea(Number(e.target.value))}
              className="w-full accent-accent bg-bg border border-border rounded-lg h-2 cursor-pointer outline-none"
            />
          </div>
        )}

        {(vertical === "domestic" || vertical === "hospitality") && (
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            <div>
              <label className="text-[10px] text-ink-muted font-bold uppercase tracking-wider block mb-1">
                {calcText.bedroomsLabel}
              </label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full border border-border bg-bg text-ink p-2 rounded text-body-sm focus:border-accent outline-none font-semibold cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-ink-muted font-bold uppercase tracking-wider block mb-1">
                {calcText.bathroomsLabel}
              </label>
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full border border-border bg-bg text-ink p-2 rounded text-body-sm focus:border-accent outline-none font-semibold cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {vertical === "hospitality" && (
          <div className="flex items-center gap-3 pt-1 animate-fade-in">
            <input
              type="checkbox"
              id="calcLinenCheckbox"
              checked={linenChange}
              onChange={(e) => setLinenChange(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-bg text-accent focus:ring-accent cursor-pointer accent-accent"
            />
            <label htmlFor="calcLinenCheckbox" className="text-body-xs font-semibold text-ink-muted cursor-pointer select-none">
              {calcText.linenLabel}
            </label>
          </div>
        )}

        {/* Standard controls shown for standard verticals */}
        {["commercial", "domestic", "hospitality"].includes(vertical) && (
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            <div>
              <label className="text-[10px] text-ink-muted font-bold uppercase tracking-wider block mb-1">
                {calcText.frequencyLabel}
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full border border-border bg-bg text-ink p-2 rounded text-body-sm focus:border-accent outline-none font-semibold cursor-pointer"
              >
                <option value="one-off">{mainT("booking.oneOff")}</option>
                <option value="weekly">
                  {vertical === "hospitality" 
                    ? mainT("booking.weeklySave10") 
                    : mainT("booking.weeklySave15")}
                </option>
                {vertical !== "hospitality" && (
                  <option value="bi-weekly">{mainT("booking.biWeeklySave10")}</option>
                )}
                {vertical !== "hospitality" && (
                  <option value="monthly">{mainT("booking.monthlySave5")}</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-ink-muted font-bold uppercase tracking-wider block mb-1">
                {calcText.timingLabel}
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full border border-border bg-bg text-ink p-2 rounded text-body-sm focus:border-accent outline-none font-semibold cursor-pointer"
              >
                <option value="business-hours">{mainT("booking.businessHours")}</option>
                {vertical === "commercial" && (
                  <option value="after-hours">{mainT("booking.afterHours")}</option>
                )}
                {vertical !== "hospitality" && (
                  <option value="weekends">{mainT("booking.weekends")}</option>
                )}
              </select>
            </div>
          </div>
        )}

        {/* Dynamic CTA button based on service selection */}
        <button
          type="button"
          onClick={handleBookingRedirect}
          className="w-full bg-accent hover:bg-accent-hover text-ink-inverse text-caption font-bold py-3 rounded-md transition-all shadow-sm select-none text-center cursor-pointer uppercase tracking-wider"
        >
          {vertical === "aviation" || vertical === "yacht"
            ? calcText.requestQuoteButton
            : vertical === "special"
            ? calcText.callDispatchButton
            : calcText.bookButton}
        </button>
      </div>
    </div>
  );
}
