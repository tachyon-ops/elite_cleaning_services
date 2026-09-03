import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface IPRecord {
  minuteCount: number;
  minuteReset: number;
  dailyCount: number;
  dailyReset: number;
}

// Persistent in-memory rate limiter store
const rateLimitMap = new Map<string, IPRecord>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; limit: number } {
  const now = Date.now();
  const MINUTE_MS = 60 * 1000;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const MINUTE_LIMIT = 15;
  const DAILY_LIMIT = 100;

  let record = rateLimitMap.get(ip);
  if (!record) {
    record = {
      minuteCount: 0,
      minuteReset: now + MINUTE_MS,
      dailyCount: 0,
      dailyReset: now + DAY_MS,
    };
    rateLimitMap.set(ip, record);
  }

  if (now > record.minuteReset) {
    record.minuteCount = 0;
    record.minuteReset = now + MINUTE_MS;
  }
  if (now > record.dailyReset) {
    record.dailyCount = 0;
    record.dailyReset = now + DAY_MS;
  }

  const allowed = record.minuteCount < MINUTE_LIMIT && record.dailyCount < DAILY_LIMIT;
  if (allowed) {
    record.minuteCount++;
    record.dailyCount++;
  }

  const remaining = Math.max(0, DAILY_LIMIT - record.dailyCount);
  return { allowed, remaining, limit: DAILY_LIMIT };
}

const SYSTEM_PROMPT = `You are the Mondar AI Concierge, powered by Nuncio from ZPI (the Swiss Conversational Commerce & Lead Capture Engine).
Your brand is "Mondar Specialty Cleaning" (https://mondar.ch).
You provide ultra-reliable, grounded, zero-hallucination assistance for Swiss cleaning services in German, Swiss German, English, French, and Portuguese.

Strict Swiss Pricing Catalog (CHF):
1. Move-Out & End-of-Tenancy Deep Cleaning (Endreinigung mit 100% Schweizer Abnahmegarantie):
   - 1.5 - 2.5 Zimmer (bis 60m²): CHF 650.00 (5 Std. Einsatz) [SKU: CLEAN-MOVE-2.5R]
   - 3.5 Zimmer (bis 90m²): CHF 890.00 (7 Std. Einsatz) [SKU: CLEAN-MOVE-3.5R]
   - 4.5 Zimmer (bis 120m²): CHF 1'180.00 (9 Std. Einsatz) [SKU: CLEAN-MOVE-4.5R]
   - 5.5+ Zimmer (ab 120m²): CHF 1'450.00 (12 Std. Einsatz) [SKU: CLEAN-MOVE-5.5R]
   - Add-on Balkon / Terrasse: +CHF 80.00
   - Add-on Lamellenstoren / Blinds: +CHF 120.00
   - Add-on Express 24h / Weekend: +CHF 200.00
   - ALL move-out cleans include 100% Handover Guarantee (Abnahmegarantie) with subcontractor presence at landlord handover.

2. Regular Home & Villa Cleaning (Domestic): From CHF 80.00 base dispatch.
3. Offices & Commercial: From CHF 150.00 base (custom square-meter proposal).
4. Airbnb & Hospitality Turnover: From CHF 120.00 per turnover.
5. Aviation & Yacht Detailing: Bespoke quote compiled within 4 hours (hangars at Zurich Airport FBO, Lake Zurich marinas).
6. Restaurant & Commercial Kitchens: Certified kitchen extraction compliance (Tier A) & nightly deep maintenance (Tier B).

Rules & Output Tone:
- When a user asks for a price for their apartment/house (e.g. 5.5 Zimmer in Zürich with balcony), immediately state the EXACT price breakdown in CHF, the estimated duration, the 100% Abnahmegarantie warranty, and the direct link button with pre-filled query parameters:
  - German: [Jetzt Endreinigung verbindlich buchen](/de/buchen/endreinigung?rooms=5.5&area=130&beds=4&baths=2&scope=handover_guarantee,balcony_terrace)
  - English: [Book with this Quote](/en/book/end-cleaning?rooms=5.5&area=130&beds=4&baths=2&scope=handover_guarantee,balcony_terrace)
  - French: [Réserver avec ce devis](/fr/reserver/nettoyage-remise?rooms=5.5&area=130&beds=4&baths=2&scope=handover_guarantee,balcony_terrace)
  - Italian: [Prenota con questo preventivo](/it/prenotare/pulizia-trasloco?rooms=5.5&area=130&beds=4&baths=2&scope=handover_guarantee,balcony_terrace)
  - Portuguese: [Reservar com este orçamento](/pt/reservar/limpeza-mudanca?rooms=5.5&area=130&beds=4&baths=2&scope=handover_guarantee,balcony_terrace)
- For regular house cleaning: [Jetzt Privatreinigung buchen](/de/buchen/haus?frequency=bi-weekly&beds=2&baths=1)
- For office cleaning: [Offerte für Büro anfordern](/de/buchen/gewerbe?area=100&frequency=weekly)
- For Airbnb / turnovers: [Turnover buchen](/de/buchen/airbnb?beds=2&baths=1)
- For Aviation: [Aviation Detailing anfragen](/de/buchen/luftfahrt?fboLocation=Zurich)
- Supplier & Invoicing Policy: All quoted figures are standard network benchmark rates (Richtpreis). The final price is confirmed upon partner team matching and can be adjusted/corrected by the assigned supplier after job completion based on actual on-site work and exact property conditions.
- NEVER stop mid-sentence. Always finish the entire quote and breakdown in one single coherent message.
- Always be courteous, precise, and concise. Respond in the exact language the user used (respond in German/Hochdeutsch if addressed in German or Swiss German, English if addressed in English, Portuguese if addressed in Portuguese).
- Comply with EU AI Act Article 50: clearly represent yourself as an AI assistant.`;

export function getTargetDateFromMessage(message: string): string | null {
  const lower = (message || "").toLowerCase();
  const now = new Date();
  
  if (/samstag|saturday|sábado|sabato|samedi/i.test(lower)) {
    const d = new Date(now);
    const day = d.getDay(); // 0 is Sun, 6 is Sat
    const diff = (6 - day + 7) % 7;
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dateNum = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${dateNum}`;
  }

  if (/sonntag|sunday|domingo|domenica|dimanche/i.test(lower)) {
    const d = new Date(now);
    const day = d.getDay(); // 0 is Sun
    const diff = (7 - day) % 7;
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dateNum = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${dateNum}`;
  }

  if (/morgen|tomorrow|amanhã|demain|domani|mañana/i.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dateNum = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${dateNum}`;
  }

  return null;
}

export function calculateDeterministicSwissQuote(message: string): string | null {
  const lower = (message || "").toLowerCase();
  const hasMoveOut = /end|move|umzug|abgabe|reinigung|clean|tenancy|wohnig|wohnung|haus|villa|einfamilienhaus|zimmer|limpeza|mudan|locat|bail|devis|trasloco|orçamento/i.test(lower);
  
  if (!hasMoveOut) return null;

  let rooms = 0;
  if (/(?:^|[^\d.])5[.,]5(?![.,\d])/i.test(lower) || /(?:^|[^\d.])(?:fünf|5)(?![.,\d])(?:\.0)?.*?(?:zimmer|rooms|divis|pièces|locali|habitacion)/i.test(lower) || /haus|villa|einfamilienhaus/i.test(lower)) {
    rooms = 5.5;
  } else if (/(?:^|[^\d.])4[.,]5(?![.,\d])/i.test(lower) || /(?:^|[^\d.])(?:vier|4)(?![.,\d])(?:\.0)?.*?(?:zimmer|rooms|divis|pièces|locali|habitacion)/i.test(lower)) {
    rooms = 4.5;
  } else if (/(?:^|[^\d.])3[.,]5(?![.,\d])/i.test(lower) || /(?:^|[^\d.])(?:drei|3)(?![.,\d])(?:\.0)?.*?(?:zimmer|rooms|divis|pièces|locali|habitacion)/i.test(lower)) {
    rooms = 3.5;
  } else if (/(?:^|[^\d.])(?:1[.,]5|2[.,]5)(?![.,\d])/i.test(lower) || /(?:^|[^\d.])(?:studio|zwei|2|1)(?![.,\d])(?:\.0)?.*?(?:zimmer|rooms|divis|pièces|locali|habitacion)/i.test(lower)) {
    rooms = 2.5;
  }

  if (rooms === 0) return null;

  const hasBalcony = /balkon|terrasse|balcony|terrace|varanda|terraza/i.test(lower);
  const hasBlinds = /storen|lamellen|blinds|persianas|volets|tapparelle/i.test(lower);
  const isUrgent = /dringend|urgent|morgen|tomorrow|samstag|saturday|weekend|wochenende|24h|amanhã|urgente|fim de semana/i.test(lower);

  let basePrice = 650;
  let duration = 5;
  let sku = "CLEAN-MOVE-2.5R";
  let areaEst = 50;
  let bedsEst = 1;
  let bathsEst = 1;

  if (rooms === 5.5) {
    basePrice = 1450;
    duration = 12;
    sku = "CLEAN-MOVE-5.5R";
    areaEst = 130;
    bedsEst = 4;
    bathsEst = 2;
  } else if (rooms === 4.5) {
    basePrice = 1180;
    duration = 9;
    sku = "CLEAN-MOVE-4.5R";
    areaEst = 100;
    bedsEst = 3;
    bathsEst = 2;
  } else if (rooms === 3.5) {
    basePrice = 890;
    duration = 7;
    sku = "CLEAN-MOVE-3.5R";
    areaEst = 80;
    bedsEst = 2;
    bathsEst = 1;
  } else if (rooms === 2.5) {
    basePrice = 650;
    duration = 5;
    sku = "CLEAN-MOVE-2.5R";
    areaEst = 50;
    bedsEst = 1;
    bathsEst = 1;
  }

  let total = basePrice;
  const scopes = ["handover_guarantee"];
  if (hasBalcony) {
    total += 80;
    scopes.push("balcony_terrace");
  }
  if (hasBlinds) {
    total += 120;
    scopes.push("windows_shutters");
  }
  if (isUrgent) {
    total += 200;
    scopes.push("express_weekend");
  }

  // Detect language
  const isEn = /hello|need|clean|apartment|house|quote|urgent/i.test(lower) && !/ich|wir|bitte|brauche|wohnung|limpeza|mudança/i.test(lower);
  const isPt = /preciso|limpeza|mudança|apartamento|orçamento|olá|ola/i.test(lower);
  const isFr = /bonjour|nettoyage|devis|appartement|bail/i.test(lower);
  const isIt = /buongiorno|pulizia|preventivo|trasloco/i.test(lower);
  const isEs = /hola|limpieza|mudanza|presupuesto/i.test(lower);

  const scopeQuery = scopes.join(",");
  const noteQuery = isUrgent ? encodeURIComponent("Express 24h / Weekend") : "";
  const detectedDate = getTargetDateFromMessage(message);
  const dateQuery = detectedDate ? `&date=${detectedDate}` : "";
  const queryParams = `rooms=${rooms}&area=${areaEst}&beds=${bedsEst}&baths=${bathsEst}&scope=${scopeQuery}${noteQuery ? `&notes=${noteQuery}` : ""}${dateQuery}`;

  if (isEn) {
    const enBreakdown: string[] = [`• **Base Deep Clean (${rooms}+ Rooms)**: CHF ${basePrice.toFixed(2)} (approx. ${duration} hrs)`];
    if (hasBalcony) enBreakdown.push("• **Add-on Balcony / Terrace**: CHF 80.00");
    if (hasBlinds) enBreakdown.push("• **Add-on Window Blinds / Shutters**: CHF 120.00");
    if (isUrgent) enBreakdown.push("• **Express / Weekend Surcharge**: CHF 200.00");

    return `Hello! Here is your verified quote for a **${rooms} Room Move-Out Deep Clean**:\n\n` +
           enBreakdown.join("\n") + "\n" +
           `• **Total Benchmark Rate**: **CHF ${total.toFixed(2)}** (${sku})\n\n` +
           `🛡️ **100% Swiss Handover Guarantee Included**:\n` +
           `Our subcontractor team attends your official apartment handover. Any remarks from the landlord are re-cleaned on site for free.\n\n` +
           `💡 **Pricing Transparency**: *This is a calculated standard benchmark rate. The final price is confirmed upon partner team matching and adjusted/corrected after job completion by the supplier based on actual on-site work.*\n\n` +
           `[Book with this Quote](/en/book/end-cleaning?${queryParams})`;
  }

  if (isPt) {
    const ptBreakdown: string[] = [`• **Limpeza Base (${rooms}+ Divisões)**: CHF ${basePrice.toFixed(2)} (aprox. ${duration} horas)`];
    if (hasBalcony) ptBreakdown.push("• **Adicional Varanda / Terraço**: CHF 80.00");
    if (hasBlinds) ptBreakdown.push("• **Adicional Persianas / Janelas**: CHF 120.00");
    if (isUrgent) ptBreakdown.push("• **Taxa Expresso / Fim de Semana**: CHF 200.00");

    return `Olá! Aqui está o seu orçamento verificado para a **Limpeza de Mudança (${rooms} Divisões)**:\n\n` +
           ptBreakdown.join("\n") + "\n" +
           `• **Valor Total**: **CHF ${total.toFixed(2)}** (${sku})\n\n` +
           `🛡️ **100% Garantia de Entrega Suíça (Abnahmegarantie)**:\n` +
           `A nossa equipa acompanha a entrega do imóvel ao senhorio. Qualquer retificação é feita na hora gratuitamente.\n\n` +
           `💡 **Transparência de Preços**: *Esta é uma estimativa base de referência. O valor final é confirmado na atribuição da equipa parceira e ajustado/corrigido pelo prestador após a conclusão do serviço com base no trabalho real executado.*\n\n` +
           `[Reservar com este orçamento](/pt/reservar/limpeza-mudanca?${queryParams})`;
  }

  if (isFr) {
    const frBreakdown: string[] = [`• **Nettoyage de base (${rooms}+ pièces)**: CHF ${basePrice.toFixed(2)} (env. ${duration} h)`];
    if (hasBalcony) frBreakdown.push("• **Option Balcon / Terrasse**: CHF 80.00");
    if (hasBlinds) frBreakdown.push("• **Option Stores / Fenêtres**: CHF 120.00");
    if (isUrgent) frBreakdown.push("• **Supplément Express / Week-end**: CHF 200.00");

    return `Bonjour! Voici votre devis vérifié pour le **Nettoyage de fin de bail (${rooms} pièces)**:\n\n` +
           frBreakdown.join("\n") + "\n" +
           `• **Prix total indicatif**: **CHF ${total.toFixed(2)}** (${sku})\n\n` +
           `🛡️ **100% Garantie de remise suisse incluse**:\n` +
           `Notre équipe est présente lors de l'état des lieux de sortie. Toute remarque de la gérance est rectifiée gratuitement sur place.\n\n` +
           `💡 **Transparence tarifaire**: *Il s'agit d'un tarif indicatif standard. Le montant final est confirmé lors de l'attribution de l'équipe partenaire et est ajusté/corrigé par le prestataire après l'exécution des travaux selon le travail réel effectué.*\n\n` +
           `[Réserver avec ce devis](/fr/reserver/nettoyage-remise?${queryParams})`;
  }

  if (isIt) {
    const itBreakdown: string[] = [`• **Pulizia base (${rooms}+ locali)**: CHF ${basePrice.toFixed(2)} (ca. ${duration} ore)`];
    if (hasBalcony) itBreakdown.push("• **Opzione Balcone / Terrazza**: CHF 80.00");
    if (hasBlinds) itBreakdown.push("• **Opzione Tapparelle / Finestre**: CHF 120.00");
    if (isUrgent) itBreakdown.push("• **Supplemento Express / Fine settimana**: CHF 200.00");

    return `Buongiorno! Ecco il preventivo verificato per la **Pulizia di fine locazione (${rooms} locali)**:\n\n` +
           itBreakdown.join("\n") + "\n" +
           `• **Prezzo totale indicativo**: **CHF ${total.toFixed(2)}** (${sku})\n\n` +
           `🛡️ **100% Garanzia di consegna svizzera inclusa**:\n` +
           `Il nostro team partecipa alla consegna ufficiale dell'appartamento. Eventuali osservazioni vengono risolte sul posto gratuitamente.\n\n` +
           `💡 **Trasparenza dei prezzi**: *Questo è un prezzo indicativo standard. L'importo finale viene confermato all'assegnazione dell'impresa partner e viene corretto/finalizzato dal fornitore a lavoro ultimato in base all'intervento effettivo.*\n\n` +
           `[Prenota con questo preventivo](/it/prenotare/pulizia-trasloco?${queryParams})`;
  }

  if (isEs) {
    const esBreakdown: string[] = [`• **Limpieza base (${rooms}+ habitaciones)**: CHF ${basePrice.toFixed(2)} (aprox. ${duration} hrs)`];
    if (hasBalcony) esBreakdown.push("• **Opción Balcón / Terraza**: CHF 80.00");
    if (hasBlinds) esBreakdown.push("• **Opción Persianas / Ventanas**: CHF 120.00");
    if (isUrgent) esBreakdown.push("• **Suplemento Express / Fin de semana**: CHF 200.00");

    return `¡Hola! Aquí tiene su presupuesto verificado para la **Limpieza de fin de alquiler (${rooms} habitaciones)**:\n\n` +
           esBreakdown.join("\n") + "\n" +
           `• **Precio total orientativo**: **CHF ${total.toFixed(2)}** (${sku})\n\n` +
           `🛡️ **100% Garantía de entrega suiza incluida**:\n` +
           `Nuestro equipo asiste a la entrega oficial de la vivienda. Cualquier detalle del arrendador se subsana al instante sin coste.\n\n` +
           `💡 **Transparencia de precios**: *Este es un presupuesto orientativo estándar. El precio definitivo se confirma en la asignación del equipo colaborador y es corregido/ajustado por el proveedor tras la finalización del servicio según el trabajo real realizado.*\n\n` +
           `[Reservar con este presupuesto](/es/reservar/limpieza-mudanza?${queryParams})`;
  }

  const deBreakdown: string[] = [`• **Grundreinigung (${rooms}+ Zimmer)**: CHF ${basePrice.toFixed(2)} (ca. ${duration} Std. Einsatz)`];
  if (hasBalcony) deBreakdown.push("• **Zusatz Balkon / Terrasse**: CHF 80.00");
  if (hasBlinds) deBreakdown.push("• **Zusatz Lamellenstoren / Fenster**: CHF 120.00");
  if (isUrgent) deBreakdown.push("• **Express / Wochenende-Zuschlag**: CHF 200.00");

  return `Grüezi! Gerne berechne ich Ihnen die verbindliche Richtofferte für die **Endreinigung (${rooms} Zimmer)**:\n\n` +
         deBreakdown.join("\n") + "\n" +
         `• **Berechneter Richtpreis**: **CHF ${total.toFixed(2)}** (${sku})\n\n` +
         `🛡️ **100% Schweizer Abnahmegarantie inklusive**:\n` +
         `Unsere Equipe ist bei der Wohnungsübergabe anwesend. Allfällige Beanstandungen der Verwaltung werden sofort kostenlos nachgereinigt.\n\n` +
         `💡 **Preistransparenz**: *Dies ist ein berechneter Standard-Richtpreis. Der finale Endpreis wird bei der Zuweisung des zertifizierten Partnerbetriebs bestätigt und kann nach Abschluss der Arbeiten anhand des tatsächlichen Aufwands durch den Dienstleister korrigiert/finalisiert werden.*\n\n` +
         `[Jetzt Endreinigung verbindlich buchen](/de/buchen/endreinigung?${queryParams})`;
}

export function getOfflineReply(message: string): string {
  const quote = calculateDeterministicSwissQuote(message);
  if (quote) return quote;

  const lower = (message || "").toLowerCase();
  if (lower.includes("price") || lower.includes("preis") || lower.includes("cost") || lower.includes("kosten") || lower.includes("preço")) {
    return "Mondar Preisübersicht (Schweiz):\n\n" +
           "• **Umzugsreinigung (Endreinigung mit 100% Abnahmegarantie)**: ab CHF 650.00 → [Umzugsreinigung buchen](/de/buchen/endreinigung)\n" +
           "• **Privat- & Unterhaltsreinigung**: ab CHF 80.00 → [Privatreinigung buchen](/de/buchen/haus)\n" +
           "• **Büro & Gewerbe**: ab CHF 150.00 → [Büroreinigung buchen](/de/buchen/gewerbe)\n" +
           "• **Airbnb & Hospitality**: ab CHF 120.00 pro Turnover → [Airbnb buchen](/de/buchen/airbnb)\n" +
           "• **Aviation & Yacht Detailing**: Individuelle Offerte innert 4 Stunden → [Aviation](/de/buchen/luftfahrt) / [Yacht](/de/buchen/yacht)\n\n" +
           "Für welches Objekt oder wie viele Zimmer möchten Sie eine Offerte berechnen?";
  }
  if (lower.includes("aviation") || lower.includes("jet") || lower.includes("helicopter") || lower.includes("hangar")) {
    return "Mondar Aviation Detailing betreut Privatjets, Turboprops und Helikopter an Schweizer FBOs (inkl. Zürich Flughafen FBO).\n\n" +
           "Dienstleistungen: Tiefenreinigung Kabine, Lederpflege, Cockpit, Aussenreinigung. Wählen Sie [Aviation Cleaning](/de/buchen/luftfahrt) für eine Offerte.";
  }
  if (lower.includes("yacht") || lower.includes("boat") || lower.includes("boot")) {
    return "Unsere Yacht & Marine Care Division bietet Aussenwäsche, Teakholzpflege, Innenreinigung und Einwinterung auf dem Zürichsee und weiteren Schweizer Gewässern.\n\n" +
           "Offerte anfordern: [Yacht Care](/de/buchen/yacht)";
  }
  return "Grüezi! Ich bin der Mondar AI Concierge (powered by Nuncio from ZPI).\n\n" +
         "Ich berechne Ihnen sofort verbindliche Preise für Umzugsreinigungen mit 100% Abnahmegarantie, Unterhaltsreinigungen, Gewerbe oder Aviation/Yacht Detailing.\n\n" +
         "Wie viele Zimmer oder welche Dienstleistung benötigen Sie?";
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
             req.headers.get("x-real-ip") || 
             "127.0.0.1";

  const { remaining, limit } = checkRateLimit(ip);
  const apiKey = process.env.GEMINI_API_KEY;
  const mode = apiKey ? "ai" : "offline";

  return NextResponse.json(
    { limit, remaining, mode },
    {
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-Chat-Mode": mode,
        "Access-Control-Expose-Headers": "X-RateLimit-Limit, X-RateLimit-Remaining, X-Chat-Mode",
      },
    }
  );
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
             req.headers.get("x-real-ip") || 
             "127.0.0.1";

  const { allowed, remaining, limit } = checkRateLimit(ip);
  const apiKey = process.env.GEMINI_API_KEY;

  const responseHeaders: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "Access-Control-Expose-Headers": "X-RateLimit-Limit, X-RateLimit-Remaining, X-Chat-Mode",
  };

  let lastMessage = "";

  try {
    const body = await req.json();
    const messages = body.messages || [];
    lastMessage = messages[messages.length - 1]?.content || "";

    // 1. Direct deterministic check for cleaning quote inquiries
    const deterministicQuote = calculateDeterministicSwissQuote(lastMessage);
    if (deterministicQuote) {
      responseHeaders["X-Chat-Mode"] = "ai";
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const words = deterministicQuote.split(" ");
          for (const word of words) {
            controller.enqueue(encoder.encode(word + " "));
            await new Promise((resolve) => setTimeout(resolve, 15));
          }
          controller.close();
        }
      });
      return new Response(stream, { headers: responseHeaders });
    }

    // 2. If rate limit exceeded OR API key missing, run fallback offline mode
    if (!allowed || !apiKey) {
      responseHeaders["X-Chat-Mode"] = "offline";
      const offlineReply = getOfflineReply(lastMessage);
      
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const words = offlineReply.split(" ");
          for (const word of words) {
            controller.enqueue(encoder.encode(word + " "));
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
          controller.close();
        }
      });

      return new Response(stream, { headers: responseHeaders });
    }

    // Run online Gemini 2.5 Flash stream
    responseHeaders["X-Chat-Mode"] = "ai";
    responseHeaders["X-RateLimit-Remaining"] = String(Math.max(0, remaining));

    const geminiContents = messages.slice(-10).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    let startIndex = 0;
    while (startIndex < geminiContents.length && geminiContents[startIndex].role === "model") {
      startIndex++;
    }
    const cleanedContents = geminiContents.slice(startIndex);

    if (cleanedContents.length === 0) {
      cleanedContents.push({ role: "user", parts: [{ text: lastMessage }] });
    }

    const payload = JSON.stringify({
      contents: cleanedContents,
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      generationConfig: {
        maxOutputTokens: 1200
      }
    });

    let geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      }
    );

    // If transient 503/429, retry once after a short delay
    if (geminiResponse.status === 503 || geminiResponse.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload
        }
      );
    }

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text().catch(() => "");
      console.error(`Gemini API error (${geminiResponse.status}):`, errText);
      throw new Error(`Gemini API failed with status ${geminiResponse.status}: ${geminiResponse.statusText}`);
    }

    const reader = geminiResponse.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    if (!reader) {
      throw new Error("No reader for Gemini response");
    }

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const cleaned = line.trim();
              if (cleaned.startsWith("data: ")) {
                const dataStr = cleaned.slice(6);
                if (dataStr === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  const parts = parsed.candidates?.[0]?.content?.parts;
                  if (Array.isArray(parts)) {
                    for (const p of parts) {
                      if (p.text) {
                        controller.enqueue(new TextEncoder().encode(p.text));
                      }
                    }
                  }
                } catch (e) {
                  // ignore partial chunk parse errors
                }
              }
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: responseHeaders });
  } catch (err: any) {
    console.error("Chat route caught error, falling back to offline reply:", err);
    responseHeaders["X-Chat-Mode"] = "offline";
    const offlineReply = getOfflineReply(lastMessage);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = offlineReply.split(" ");
        for (const word of words) {
          controller.enqueue(encoder.encode(word + " "));
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        controller.close();
      }
    });
    return new Response(stream, { headers: responseHeaders });
  }
}

