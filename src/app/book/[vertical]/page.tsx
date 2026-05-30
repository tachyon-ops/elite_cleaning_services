"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { localizeHref } from "@/lib/i18n";
import { Plane, Ship, Building2, Home, Shield, Check, Calendar, ChevronRight, Lock, CreditCard, Mail, Phone, Clock } from "lucide-react";
import { getAvailableSlots, sendOtp, verifyOtp, createBooking, getActiveCategories } from "@/app/actions/booking";

const T: Record<string, Record<string, string>> = {
  de: {
    bookingFlow: "Buchungsablauf",
    intake: "Angaben",
    schedule: "Termin",
    quote: "Angebot",
    verify: "Verifizieren",
    payment: "Zahlung",
    describeReqs: "Beschreiben Sie Ihren Auftrag",
    defineScope: "Definieren Sie den Leistungsumfang für garantierte lokale Partner-Preise.",
    continueSchedule: "Weiter zur Terminwahl",
    back: "Zurück",
    continueQuote: "Weiter zum Angebot",
    selectDateWindow: "Wählen Sie Datum und Zeitfenster",
    subcontractorCapacity: "Kapazitätsprüfung der Subunternehmer in der Region Zürich.",
    serviceDate: "Servicedatum",
    chooseDate: "Datum wählen...",
    availableSlot: "Verfügbares Zeitfenster",
    checkingDispatches: "Prüfe Verfügbarkeit...",
    fullyBooked: "AUSGEBUCHT",
    secureWithOtp: "Mit OTP-Code sichern",
    bespokeQuoteRequired: "Individuelle Offerte erforderlich",
    aviationYachtQuoteDesc: "Reinigungen für Luftfahrt und Yachten erfordern eine manuelle Prüfung.",
    reviewPending: "PRÜFUNG LÄUFT",
    subcontractorNetworkNote: "Wir betreiben ein geprüftes Partnernetzwerk mit spezifischen Preisstufen für Privatflugzeuge und Schiffe.",
    dispatchDeskNote: "Unsere Zentrale in Zürich prüft Ihre Angaben. Eine Offerte wird Ihnen innerhalb von 4 Stunden per E-Mail zugestellt.",
    quoteStatus: "Offertenstatus",
    quotePending: "Prüfung ausstehend",
    lockedInQuote: "Garantierter Partnerpreis",
    qualityPledgeNote: "Alle Einsätze sind voll versichert und durch unser Qualitätsversprechen gedeckt.",
    baseFee: "Grundgebühr Reinigung",
    sizeAdjustment: "Grössenzuschlag",
    linenLaundry: "Wäscheservice (Bettwäsche)",
    frequencyDiscount: "Rabatt für Häufigkeit",
    totalAmount: "Gesamtbetrag",
    stripeDeposit: "Stripe-Anzahlung (30% zur Sicherung)",
    guestVerification: "Verifizierung als Gast",
    secureCredentialsNote: "Sichern Sie Ihre Buchungsdetails und Quittungen.",
    fullName: "Vollständiger Name",
    phoneNumber: "Telefonnummer",
    emailAddress: "E-Mail-Adresse",
    sendingCode: "Code wird gesendet...",
    sendOtp: "OTP-CODE SENDEN",
    testingCodeTriggered: "Test-Code generiert",
    enterVerificationCode: "Geben Sie den Verifizierungscode ein:",
    enter6DigitCode: "6-stelligen Code eingeben",
    verifying: "Verifizieren...",
    verifyCode: "CODE VERIFIZIEREN",
    editEmail: "E-Mail-Adresse bearbeiten",
    confirmRequestSubmission: "Anfrage senden bestätigen",
    specifyCoordinatesNote: "Geben Sie den genauen Standort des Hangars/Liegeplatzes an, um Ihre Anfrage zu senden.",
    exactLocation: "Genaue Hangar- / FBO- / Liegeplatz-Angabe",
    noDepositRequired: "KEINE ANZAHLUNG ERFORDERLICH",
    bespokeReviewedNote: "Individuelle Anfragen werden manuell geprüft. Ihre Karte wird jetzt nicht belastet.",
    customQuoteEmailNote: "Sobald das Angebot vorliegt, erhalten Sie einen E-Mail-Link, um den Preis zu bestätigen und die Anzahlung von 30% zu leisten.",
    simulatedStripe: "Simulierte Stripe-Anzahlung",
    depositRequiredNote: "Eine Anzahlung von 30% ist erforderlich, um den Auftrag zu sichern.",
    serviceLocation: "Adresse des Einsatzortes",
    secureStripeGateway: "SICHERE STRIPE-ZAHLUNG",
    cardholderName: "Name des Karteninhabers",
    cardNumber: "Kartennummer",
    cvc: "CVC",
    processing: "Wird verarbeitet...",
    submitBespoke: "INDIVIDUELLE ANFRAGE SENDEN",
    payDeposit: "ANZAHLUNG LEISTEN",
    requestSubmitted: "Anfrage gesendet",
    bookingConfirmed: "Buchung bestätigt",
    thankYouAviation: "Vielen Dank. Ihre individuelle Anfrage wurde zur Prüfung weitergeleitet. Wir informieren Sie unter:",
    thankYouRegular: "Vielen Dank. Ihre Anzahlung von 30% wurde verarbeitet. Ein zertifiziertes Partner-Team wurde für Sie reserviert an der Adresse:",
    scheduled: "Geplant:",
    morningSlot: "Vormittag",
    afternoonSlot: "Nachmittag",
    quoteSentEmail: "Eine Kopie Ihrer Angaben wurde gesendet an: {email}. Ihr Angebot folgt in Kürze.",
    pdfReceiptSent: "Ein PDF-Beleg und eine Kalendereinladung (.ics) wurden gesendet an: {email}.",
    returnHome: "ZURÜCK ZUR STARTSEITE",
    officeType: "Bürotyp",
    surfaceArea: "Fläche (m²)",
    frequencies: "Häufigkeit",
    prefTime: "Bevorzugte Zeit",
    specialReqs: "Spezielle Anforderungen",
    propertyType: "Unterkunftsart",
    bedrooms: "Schlafzimmer",
    bathrooms: "Badezimmer",
    turnoverFreq: "Wechsel-Häufigkeit",
    linenLaunService: "Professionellen Wäscheservice anfordern (+CHF 35)",
    keyHandling: "Schlüsselübergabe",
    aircraftType: "Flugzeugtyp",
    tailNumber: "Registrierungsnummer (Tail Number)",
    airportFbo: "Flughafen FBO / Hangar",
    detScope: "Umfang der Flugzeugaufbereitung",
    specInstructions: "Besondere Anweisungen",
    vesselType: "Bootstyp",
    vesselLength: "Schiffslänge (Fuss)",
    marinaLoc: "Marina / Liegeplatz",
    servScope: "Service-Umfang",
    oneOff: "Einmalig",
    weekly: "Wöchentlich",
    biWeekly: "Zweiwöchentlich",
    monthly: "Monatlich",
    priceOnRequest: "PREIS AUF ANFRAGE",
    oneOffClean: "Einmalige Reinigung",
    weeklySave15: "Wöchentlich (15% Rabatt)",
    biWeeklySave10: "Zweiwöchentlich (10% Rabatt)",
    monthlySave5: "Monatlich (5% Rabatt)",
    turnoverAsRequested: "Pro-Wechsel (auf Anfrage)",
    weeklySave10: "Wöchentlich (10% Rabatt)",
    quoteDrivenDispatch: "ANGEBOTSBASIERTE DISPONIERUNG",
    bespokeInquiry: "Individuelle Anfrage",
    bespokeInquiryDesc: "Spezialreinigungen für Luftfahrt, Yachten oder nach Zwischenfällen erfordern eine Überprüfung des Angebots.",
    returnConciergeChat: "Zurück zum Concierge-Chat",
    corporateOffice: "Firmen- / Standardbüro",
    studioCreative: "Studio & Kreativbereich",
    retailShowroom: "Einzelhandel / Showroom",
    gymFitness: "Fitnessstudio / Sportbereich",
    restaurantKitchen: "Restaurant / Küchenbereich",
    businessHours: "Geschäftszeiten",
    afterHours: "Ausserhalb der Geschäftszeiten",
    weekends: "Wochenende",
    specialReqsPlaceholder: "Sicherheits-Codes, Handhabung empfindlicher Geräte...",
    airbnbApartment: "Airbnb-Wohnung",
    bedBreakfast: "Bed & Breakfast",
    holidayLetChalet: "Ferienwohnung / Chalet",
    lockboxOnSite: "Schlüsseldepot vor Ort",
    smartlockApi: "Smartlock API-Zugang",
    inPersonHandoff: "Persönliche Übergabe",
    lightJet: "Light Cabin Business Jet",
    midSizeJet: "Mid-size Cabin Business Jet",
    heavyJet: "Heavy Cabin Business Jet",
    turboprop: "Turboprop-Flugzeug",
    helicopter: "Helikopter",
    exteriorWash: "Aussenwäsche & Politur",
    interiorDetail: "Tiefenreinigung der Kabineninnenausstattung",
    cockpitDetail: "Cockpit- & Instrumentenreinigung",
    carpetShampoo: "Teppich- & Polsterdampfreinigung",
    cabinRestock: "Kabinenauffüllung & Pantry-Vorbereitung",
    specInstructionsAviationPlaceholder: "Zugangs-Autorisierungsanforderungen, spezifische Kabinenmaterialien...",
    motorYacht: "Motoryacht",
    sailingYacht: "Segelyacht",
    catamaranYacht: "Katamaran",
    tenderYacht: "Beiboot / Runabout",
    teakClean: "Teakdeck-Reinigung & Behandlung",
    hullPolish: "Gelcoat- & Rumpfpolitur",
    yachtInteriorDetail: "Kabineninnenreinigung & Desinfektion",
    deckWash: "Komplette Deckswäsche & Edelstahlpflege",
    decommission: "Vorbereitung auf die Winterlagerung",
    specInstructionsYachtPlaceholder: "Liegeplatznummer, Hafensicherheitscodes, Persenningpflege...",
    specialInstructionsPets: "Besondere Anweisungen / Haustiere",
    specialInstructionsPetsPlaceholder: "Zugangscodes, Schlüsselort, Haustiere im Haus, Prioritätsräume...",
    aviationLocationPlaceholder: "z.B. Hangar 3, Jet Aviation FBO, Flughafen Zürich",
    yachtLocationPlaceholder: "z.B. Steg B, Liegeplatz 42, Hafen Horgen",
    addressPlaceholder: "Seestrasse 10, 8002 Zürich",
    failedFetchSlots: "Fehler beim Laden der Zeitfenster",
    invalidEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein",
    failedSendCode: "Fehler beim Senden des Codes",
    enterVerificationCodeError: "Bitte geben Sie den Verifizierungscode ein",
    verificationFailed: "Verifizierung fehlgeschlagen",
    enterAddressError: "Bitte geben Sie die Adresse des Einsatzortes ein",
    failedFinalizeBooking: "Fehler beim Abschliessen der Buchung"
  },
  fr: {
    bookingFlow: "Flux de réservation",
    intake: "Saisie",
    schedule: "Planification",
    quote: "Devis",
    verify: "Vérification",
    payment: "Paiement",
    describeReqs: "Décrivez vos besoins",
    defineScope: "Définissez l'étendue du service pour obtenir un tarif sous-traitant local garanti.",
    continueSchedule: "Continuer vers la planification",
    back: "Retour",
    continueQuote: "Continuer vers le devis",
    selectDateWindow: "Sélectionnez la date et le créneau",
    subcontractorCapacity: "Vérification de la disponibilité dans la région de Zurich.",
    serviceDate: "Date de service",
    chooseDate: "Choisir une date...",
    availableSlot: "Créneau disponible",
    checkingDispatches: "Vérification des disponibilités...",
    fullyBooked: "COMPLET",
    secureWithOtp: "Sécuriser avec le code OTP",
    bespokeQuoteRequired: "Devis personnalisé requis",
    aviationYachtQuoteDesc: "Les nettoyages pour l'aviation et le nautisme nécessitent un examen par un répartiteur.",
    reviewPending: "EXAMEN EN COURS",
    subcontractorNetworkNote: "Nous gérons un réseau de sous-traitants certifiés avec des grilles tarifaires spécifiques pour les avions privés et les bateaux.",
    dispatchDeskNote: "Notre bureau de répartition à Zurich examinera vos coordonnées et détails. Un devis personnalisé vous sera envoyé par e-mail sous **4 heures**.",
    quoteStatus: "Statut du devis",
    quotePending: "Devis en attente",
    lockedInQuote: "Tarif sous-traitant garanti",
    qualityPledgeNote: "Toutes les interventions sont entièrement assurées et couvertes par notre engagement qualité.",
    baseFee: "Frais de nettoyage de base",
    sizeAdjustment: "Ajustement taille/portée",
    linenLaundry: "Blanchisserie (draps)",
    frequencyDiscount: "Remise sur la fréquence",
    totalAmount: "Montant total",
    stripeDeposit: "Acompte Stripe (30% pour valider)",
    guestVerification: "Vérification de l'invité",
    secureCredentialsNote: "Sécurisez vos détails de réservation et reçus.",
    fullName: "Nom complet",
    phoneNumber: "Numéro de téléphone",
    emailAddress: "Adresse e-mail",
    sendingCode: "Envoi du code...",
    sendOtp: "ENVOYER LE CODE OTP",
    testingCodeTriggered: "Code de test local généré",
    enterVerificationCode: "Saisissez le code de vérification :",
    enter6DigitCode: "Saisissez le code à 6 chiffres",
    verifying: "Vérification...",
    verifyCode: "VÉRIFIER LE CODE",
    editEmail: "Modifier l'adresse e-mail",
    confirmRequestSubmission: "Confirmer l'envoi de la demande",
    specifyCoordinatesNote: "Précisez l'emplacement exact du hangar/quai pour envoyer votre demande.",
    exactLocation: "Emplacement exact du hangar / FBO / quai",
    noDepositRequired: "AUCUN ACOMPTE REQUIS POUR L'INSTANT",
    bespokeReviewedNote: "Les interventions personnalisées sont examinées manuellement. Votre carte ne sera pas débitée à ce stade.",
    customQuoteEmailNote: "Une fois que le répartiteur aura établi votre devis personnalisé, vous recevrez un lien e-mail sécurisé pour valider le prix et payer l'acompte de 30%.",
    simulatedStripe: "Acompte Stripe simulé",
    depositRequiredNote: "Un acompte de 30% est requis pour valider l'intervention du sous-traitant.",
    serviceLocation: "Adresse de l'intervention",
    secureStripeGateway: "PASSERELLE STRIPE SÉCURISÉE",
    cardholderName: "Nom sur la carte",
    cardNumber: "Numéro de carte",
    cvc: "CVC",
    processing: "Traitement...",
    submitBespoke: "SOUMETTRE LA DEMANDE PERSONNALISÉE",
    payDeposit: "PAYER L'ACOMPTE",
    requestSubmitted: "Demande soumise",
    bookingConfirmed: "Réservation confirmée",
    thankYouAviation: "Merci. Votre demande personnalisée a été transmise à notre bureau pour examen. Nous vous contacterons à :",
    thankYouRegular: "Merci. Votre acompte de 30% a été traité. Une équipe de sous-traitants certifiés a été affectée à l'adresse suivante :",
    scheduled: "Planifié :",
    morningSlot: "Créneau matin",
    afternoonSlot: "Créneau après-midi",
    quoteSentEmail: "Une copie de vos détails a été envoyée à : {email}. Vous recevrez votre devis par e-mail sous 4 heures.",
    pdfReceiptSent: "Un reçu PDF et une invitation d'agenda .ics ont été envoyés à : {email}.",
    returnHome: "RETOUR À L'ACCUEIL",
    officeType: "Type de bureau",
    surfaceArea: "Surface (m²)",
    frequencies: "Fréquence",
    prefTime: "Moment préféré",
    specialReqs: "Besoins particuliers",
    propertyType: "Type de propriété",
    bedrooms: "Chambres",
    bathrooms: "Salles de bain",
    turnoverFreq: "Fréquence de rotation",
    linenLaunService: "Demander le service de blanchisserie pour les draps (+CHF 35)",
    keyHandling: "Remise des clés",
    aircraftType: "Type d'appareil",
    tailNumber: "Numéro d'immatriculation (Tail Number)",
    airportFbo: "FBO de l'aéroport / Hangar",
    detScope: "Étendue du nettoyage aéronautique",
    specInstructions: "Instructions spéciales",
    vesselType: "Type de navire",
    vesselLength: "Longueur du navire (pieds)",
    marinaLoc: "Marina / Emplacement",
    servScope: "Étendue de l'intervention",
    oneOff: "Unique",
    weekly: "Hebdomadaire",
    biWeekly: "Toutes les 2 semaines",
    monthly: "Mensuel",
    priceOnRequest: "PRIX SUR DEMANDE",
    oneOffClean: "Nettoyage unique",
    weeklySave15: "Hebdomadaire (15% de remise)",
    biWeeklySave10: "Toutes les 2 semaines (10% de remise)",
    monthlySave5: "Mensuel (5% de remise)",
    turnoverAsRequested: "Par rotation (sur demande)",
    weeklySave10: "Hebdomadaire (10% de remise)",
    quoteDrivenDispatch: "DEVIS SUR MESURE",
    bespokeInquiry: "Demande personnalisée",
    bespokeInquiryDesc: "Les nettoyages spécialisés pour l'aviation, le nautisme ou après sinistre nécessitent un examen du devis.",
    returnConciergeChat: "Retour au chat conciergerie",
    corporateOffice: "Bureau d'entreprise / Standard",
    studioCreative: "Studio & Espace créatif",
    retailShowroom: "Boutique / Showroom",
    gymFitness: "Salle de sport / Fitness",
    restaurantKitchen: "Restaurant / Espace cuisine",
    businessHours: "Heures de bureau",
    afterHours: "En dehors des heures",
    weekends: "Week-ends",
    specialReqsPlaceholder: "Codes de sécurité, manipulation de matériel sensible...",
    airbnbApartment: "Appartement Airbnb",
    bedBreakfast: "Chambre d'hôtes",
    holidayLetChalet: "Location de vacances / Chalet",
    lockboxOnSite: "Boîte à clés sur place",
    smartlockApi: "Accès API Smartlock",
    inPersonHandoff: "Remise en main propre",
    lightJet: "Jet d'affaires cabine légère",
    midSizeJet: "Jet d'affaires cabine moyenne",
    heavyJet: "Jet d'affaires cabine lourde",
    turboprop: "Avion à turbopropulseur",
    helicopter: "Hélicoptère",
    exteriorWash: "Lavage & polissage extérieur",
    interiorDetail: "Nettoyage approfondi de l'intérieur de la cabine",
    cockpitDetail: "Nettoyage du cockpit & des instruments",
    carpetShampoo: "Nettoyage à la vapeur des tapis & tissus",
    cabinRestock: "Ravitaillement de la cabine & préparation de l'office",
    specInstructionsAviationPlaceholder: "Autorisations d'accès requises, matériaux spécifiques de la cabine...",
    motorYacht: "Yacht à moteur",
    sailingYacht: "Voilier",
    catamaranYacht: "Catamaran",
    tenderYacht: "Annexe / Canot",
    teakClean: "Lavage & traitement du pont en teck",
    hullPolish: "Polissage de la coque & gelcoat",
    yachtInteriorDetail: "Nettoyage intérieur de la cabine & désinfection",
    deckWash: "Lavage complet & polissage inox",
    decommission: "Préparation à l'hivernage de fin de saison",
    specInstructionsYachtPlaceholder: "Numéro de place, codes d'accès au port, entretien de la bâche...",
    specialInstructionsPets: "Instructions spéciales / Animaux",
    specialInstructionsPetsPlaceholder: "Codes d'accès, emplacement des clés, animaux à la maison, pièces prioritaires...",
    aviationLocationPlaceholder: "ex. Hangar 3, Jet Aviation FBO, Aéroport de Zurich",
    yachtLocationPlaceholder: "ex. Jetée B, Emplacement 42, Port de Horgen",
    addressPlaceholder: "Rue de la Gare 10, 8002 Zurich",
    failedFetchSlots: "Échec de la récupération des créneaux",
    invalidEmail: "Veuillez saisir une adresse e-mail valide",
    failedSendCode: "Échec de l'envoi du code",
    enterVerificationCodeError: "Veuillez saisir le code de vérification",
    verificationFailed: "Échec de la vérification",
    enterAddressError: "Veuillez saisir l'adresse de l'intervention",
    failedFinalizeBooking: "Échec de la finalisation de la réservation"
  },
  en: {
    bookingFlow: "Booking Flow",
    intake: "Intake",
    schedule: "Schedule",
    quote: "Quote",
    verify: "Verify",
    payment: "Payment",
    describeReqs: "Describe your requirements",
    defineScope: "Define the scope of service for locked-in local subcontractor pricing.",
    continueSchedule: "Continue to Schedule",
    back: "Back",
    continueQuote: "Continue to Quote",
    selectDateWindow: "Select date and window",
    subcontractorCapacity: "Subcontractor capacity check within Zürich region.",
    serviceDate: "Service Date",
    chooseDate: "Choose a date...",
    availableSlot: "Available Slot",
    checkingDispatches: "Checking dispatches...",
    fullyBooked: "FULLY BOOKED",
    secureWithOtp: "Secure with OTP Verification",
    bespokeQuoteRequired: "Bespoke Quote Required",
    aviationYachtQuoteDesc: "Aviation and Yachting cleanings require custom dispatch reviews.",
    reviewPending: "REVIEW PENDING",
    subcontractorNetworkNote: "We operate a vetted subcontractor network with custom pricing tiers for private aircraft interiors and marine vessels.",
    dispatchDeskNote: "Our Zürich dispatch desk will review your intake coordinates and tail/slip details. A custom quote will be compiled and sent to you via email within **4 hours**.",
    quoteStatus: "Service Quote Status",
    quotePending: "Quote Pending",
    lockedInQuote: "Locked-in Subcontractor Quote",
    qualityPledgeNote: "All dispatches are fully insured and backed by our quality pledge.",
    baseFee: "Base cleanup fee",
    sizeAdjustment: "Size/Scope adjustment",
    linenLaundry: "Linen service laundry",
    frequencyDiscount: "Frequency discount",
    totalAmount: "Total Amount",
    stripeDeposit: "Stripe Deposit (30% to secure)",
    guestVerification: "Guest verification",
    secureCredentialsNote: "Secure your booking details and receipt credentials.",
    fullName: "Full Name",
    phoneNumber: "Phone Number",
    emailAddress: "Email Address",
    sendingCode: "Sending Code...",
    sendOtp: "SEND OTP CODE",
    testingCodeTriggered: "Local Testing Code Triggered",
    enterVerificationCode: "Enter verification code:",
    enter6DigitCode: "Enter 6-Digit Code",
    verifying: "Verifying...",
    verifyCode: "VERIFY CODE",
    editEmail: "Edit email address",
    confirmRequestSubmission: "Confirm Request Submission",
    specifyCoordinatesNote: "Specify the target hangar/slip coordinates to submit your bespoke request.",
    exactLocation: "Exact Hangar / FBO / Slip Location",
    noDepositRequired: "NO DEPOSIT REQUIRED NOW",
    bespokeReviewedNote: "Bespoke dispatches are reviewed manually. We do not charge your credit card at this stage.",
    customQuoteEmailNote: "Once the dispatcher compiles your custom subcontract quote, you will receive a secure email link to review the price and secure the 30% booking deposit.",
    simulatedStripe: "Simulated Stripe deposit",
    depositRequiredNote: "A 30% deposit is required to lock in the subcontractor dispatch.",
    serviceLocation: "Service Location Address",
    secureStripeGateway: "SECURE STRIPE GATEWAY",
    cardholderName: "Cardholder Name",
    cardNumber: "Card Number",
    cvc: "CVC",
    processing: "Processing...",
    submitBespoke: "SUBMIT BESPOKE REQUEST",
    payDeposit: "PAY DEPOSIT",
    requestSubmitted: "Request Submitted",
    bookingConfirmed: "Booking Confirmed",
    thankYouAviation: "Thank you. Your bespoke request has been sent to our desk for review. We will notify you at:",
    thankYouRegular: "Thank you. Your 30% deposit has been processed. A certified subcontractor team has been assigned for dispatch to:",
    scheduled: "Scheduled:",
    morningSlot: "Morning Slot",
    afternoonSlot: "Afternoon Slot",
    quoteSentEmail: "A copy of your intake details has been sent to: {email}. Look out for your quote email within 4 hours.",
    pdfReceiptSent: "A copy of your PDF receipt and .ics calendar invite has been sent to: {email}.",
    returnHome: "RETURN HOME",
    officeType: "Office Type",
    surfaceArea: "Surface Area (m²)",
    frequencies: "Frequencies",
    prefTime: "Preferred Time",
    specialReqs: "Special Requirements",
    propertyType: "Property Type",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    turnoverFreq: "Turnover Frequency",
    linenLaunService: "Request professional linen laundering service (+CHF 35)",
    keyHandling: "Key Handling",
    aircraftType: "Aircraft Type",
    tailNumber: "Tail Number / Registration",
    airportFbo: "Airport FBO / Hangar Location",
    detScope: "Detailing Service Scope",
    specInstructions: "Special Instructions",
    vesselType: "Vessel Type",
    vesselLength: "Vessel Length (Feet)",
    marinaLoc: "Marina / Mooring Location",
    servScope: "Servicing Scope",
    oneOff: "One-off",
    weekly: "Weekly",
    biWeekly: "Bi-weekly",
    monthly: "Monthly",
    priceOnRequest: "QUOTE ON REQUEST",
    oneOffClean: "One-off clean",
    weeklySave15: "Weekly (Save 15%)",
    biWeeklySave10: "Bi-weekly (Save 10%)",
    monthlySave5: "Monthly (Save 5%)",
    turnoverAsRequested: "Per-turnover (As requested)",
    weeklySave10: "Weekly scheduling (Save 10%)",
    quoteDrivenDispatch: "QUOTE DRIVEN DISPATCH",
    bespokeInquiry: "Bespoke Inquiry",
    bespokeInquiryDesc: "Specialty aviation, marine yachting, or post-incident cleanups require dispatcher quote reviews.",
    returnConciergeChat: "Return to Concierge Chat",
    corporateOffice: "Corporate/Standard Office",
    studioCreative: "Studio & Creative Space",
    retailShowroom: "Retail / Showroom",
    gymFitness: "Gym / Fitness Suite",
    restaurantKitchen: "Restaurant / Kitchen Space",
    businessHours: "Business hours",
    afterHours: "After hours",
    weekends: "Weekends",
    specialReqsPlaceholder: "Security codes, sensitive equipment handling...",
    airbnbApartment: "Airbnb Apartment",
    bedBreakfast: "Bed & Breakfast",
    holidayLetChalet: "Holiday Let / Chalet",
    lockboxOnSite: "Lockbox on-site",
    smartlockApi: "Smartlock API access",
    inPersonHandoff: "In-person handoff",
    lightJet: "Light Cabin Business Jet",
    midSizeJet: "Mid-size Cabin Business Jet",
    heavyJet: "Heavy Cabin Business Jet",
    turboprop: "Turboprop Aircraft",
    helicopter: "Helicopter",
    exteriorWash: "Exterior Wash & Polish",
    interiorDetail: "Deep Cabin Interior Detailing",
    cockpitDetail: "Cockpit & Instrument Cleaning",
    carpetShampoo: "Carpet & Upholstery Steam Clean",
    cabinRestock: "Cabin Restocking & Galley Prep",
    specInstructionsAviationPlaceholder: "Access authorization requirements, specific cabin materials...",
    motorYacht: "Motor Yacht",
    sailingYacht: "Sailing Yacht",
    catamaranYacht: "Catamaran",
    tenderYacht: "Tender / Runabout",
    teakClean: "Teak Deck Scrub & Treatment",
    hullPolish: "Gelcoat & Hull Polishing",
    yachtInteriorDetail: "Cabin Interior Detailing & Sanitization",
    deckWash: "Full Washdown & Stainless Steel Brightening",
    decommission: "End-of-season Winterization Prep",
    specInstructionsYachtPlaceholder: "Slip number, harbor security clearance codes, canvas care...",
    specialInstructionsPets: "Special Instructions / Pets",
    specialInstructionsPetsPlaceholder: "Access codes, key location, pets in house, priority rooms...",
    aviationLocationPlaceholder: "e.g. Hangar 3, Jet Aviation FBO, Zürich Airport",
    yachtLocationPlaceholder: "e.g. Pier B, Slip 42, Horgen Harbor",
    addressPlaceholder: "Seestrasse 10, 8002 Zürich",
    failedFetchSlots: "Failed to fetch slots",
    invalidEmail: "Please enter a valid email address",
    failedSendCode: "Failed to send code",
    enterVerificationCodeError: "Please enter the verification code",
    verificationFailed: "Verification failed",
    enterAddressError: "Please enter the service location address",
    failedFinalizeBooking: "Failed to finalize booking"
  }
};

export default function BookingPage() {
  const { locale } = useLanguage();
  const localeT = T[locale] || T.en;
  const t = (key: keyof typeof T.en) => localeT[key] || T.en[key];

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
              <h2 className="text-display-sm font-display font-medium text-ink">{t("selectDateWindow")}</h2>
              <p className="text-body-sm text-ink-muted">{t("subcontractorCapacity")}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="flex flex-col gap-2">
                  <label className="text-caption text-ink font-semibold uppercase">{t("serviceDate")}</label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-border bg-bg p-3 rounded-md text-body-md focus:border-accent outline-none"
                  >
                    <option value="">{t("chooseDate")}</option>
                    {getNext14Days().map((d) => (
                      <option key={d} value={d}>
                        {new Date(d).toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric" })}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDate && (
                  <div className="flex flex-col gap-2">
                    <label className="text-caption text-ink font-semibold uppercase">{t("availableSlot")}</label>
                    {loading ? (
                      <span className="text-body-sm text-ink-subtle">{t("checkingDispatches")}</span>
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
                              <span className="text-caption text-red-500 uppercase">{t("fullyBooked")}</span>
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
                  {t("back")}
                </button>
                <button
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
                  t("thankYouAviation").replace("Thank you.", `Thank you, ${contact.name}.`).replace("Merci.", `Merci, ${contact.name}.`).replace("Vielen Dank.", `Vielen Dank, ${contact.name}.`)
                ) : (
                  t("thankYouRegular").replace("Thank you.", `Thank you, ${contact.name}.`).replace("Merci.", `Merci, ${contact.name}.`).replace("Vielen Dank.", `Vielen Dank, ${contact.name}.`)
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
