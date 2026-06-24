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

const SYSTEM_PROMPT = `You are the Mondar Assistant, a premium, luxury Swiss dispatch concierge.
Your brand is "Mondar" (recently rebranded from "Elite Cleaning Services").
Always maintain a highly professional, helpful, and luxury tone suitable for premium Swiss cleaning dispatches.

Here are the details of our services and pricing:
- Home & Villa Cleaning (Domestic): From CHF 80 (Base rate)
- Offices & Commercial (Commercial): From CHF 150 (Per m² base)
- Airbnb & Hospitality (Hospitality): From CHF 120 (Flat rate per turnover)
- Aviation & Yacht Detailing: Bespoke quote-on-request (compiled within 4 hours). We service private jets, turboprops, and helicopters at Swiss hangars/FBOs (including Zurich Airport FBO), and vessels/yachts on Lake Zurich and other Swiss lakes.
- Move-Out & End Clean (Moveout): Deep cleaning with a handover guarantee for apartment and house returns to landlords (Quote on Request).
- Building Care (Building-care): Common-area cleaning, entrances, and staircase care for premium residential buildings (B2B recurring, Quote on Request).
- Restaurant & Kitchen (Restaurant): Certified kitchen extraction compliance (Tier A) and nightly after-hours maintenance (Tier B) for restaurants (B2B, Quote on Request).

If the user wants to book or get a quote, guide them to use our dynamic booking intake wizard directly from the home page.
Keep your responses concise, clear, and elegant. Speak the same language as the user (English, German, French, etc.).`;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; limit: number } {
  const now = Date.now();
  let record = rateLimitMap.get(ip);

  if (!record) {
    record = {
      minuteCount: 0,
      minuteReset: now + 60000,
      dailyCount: 0,
      dailyReset: now + 24 * 60 * 60 * 1000,
    };
  }

  // Reset minute window
  if (now > record.minuteReset) {
    record.minuteCount = 0;
    record.minuteReset = now + 60000;
  }

  // Reset daily window
  if (now > record.dailyReset) {
    record.dailyCount = 0;
    record.dailyReset = now + 24 * 60 * 60 * 1000;
  }

  const limit = 50;
  const remaining = Math.max(0, limit - record.dailyCount);

  // Enforce 5 requests per minute and 50 per day
  if (record.minuteCount >= 5 || record.dailyCount >= limit) {
    rateLimitMap.set(ip, record);
    return { allowed: false, remaining, limit };
  }

  return { allowed: true, remaining, limit };
}

function incrementRateLimit(ip: string) {
  const record = rateLimitMap.get(ip);
  if (record) {
    record.minuteCount += 1;
    record.dailyCount += 1;
    rateLimitMap.set(ip, record);
  }
}

function getOfflineReply(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("price") || lower.includes("cost") || lower.includes("chf") || lower.includes("tarif")) {
    return "At Mondar, our pricing depends on the service vertical:\n\n" +
           "- **Home & Villa Cleaning**: From CHF 80 (Base rate)\n" +
           "- **Offices & Commercial**: From CHF 150 (Per m² base)\n" +
           "- **Airbnb & Hospitality**: From CHF 120 (Flat rate per turnover)\n" +
           "- **Aviation & Yacht**: Bespoke quote-on-request (compiled within 4 hours)\n" +
           "- **Move-Out & End Clean**: Custom quote with handover guarantee\n" +
           "- **Building Care**: Custom quote for premium common-area care\n" +
           "- **Restaurant & Kitchen**: Custom quote for certified extraction compliance (Tier A) or nightly maintenance (Tier B)\n\n" +
           "Would you like me to help you start a booking for any of these divisions?";
  }
  if (lower.includes("book") || lower.includes("reserv") || lower.includes("intake") || lower.includes("quote")) {
    return "To book a service, you can use our dynamic booking intake wizard directly from the home page. " +
           "Select your desired cleaning division (such as Aviation, Yacht, Commercial, Domestic, Move-Out, Building Care, or Restaurant), fill out the brief intake coordinates, choose a scheduling window, and secure your booking.\n\n" +
           "Standard cleanings can be confirmed instantly, while specialty/B2B divisions receive a locked-in quote via email within 4 hours.";
  }
  if (lower.includes("aviation") || lower.includes("jet") || lower.includes("helicopter") || lower.includes("hangar")) {
    return "Mondar operates a dedicated Aviation Detailing division. We service private jets, turboprops, and helicopter interiors in Swiss hangars and FBOs (including Zurich Airport FBO).\n\n" +
           "Services include deep cabin detailing, leather treatment, cockpit cleaning, exterior wash, and galley restocking. Simply select the Aviation vertical in our booking intake to request a quote.";
  }
  if (lower.includes("yacht") || lower.includes("boat") || lower.includes("marine") || lower.includes("ship")) {
    return "Our Yacht & Marine Care division provides premium exterior washdowns, teak cleaning/treatments, interior detailing, and end-of-season winterization. We have active service coverage and marina access across Lake Zurich and surrounding Swiss lakes.\n\n" +
           "You can specify your vessel length, type, and slip coordinates directly in our booking form.";
  }
  if (lower.includes("building") || lower.includes("staircase") || lower.includes("common-area") || lower.includes("common area")) {
    return "Our Building Care division provides premium common-area cleaning, entrances, and staircase care for premium residential and mixed-use buildings. We establish fixed recurring weekday rounds to maintain prestige properties. Simply select the Building Care vertical on the home page to start your intake.";
  }
  if (lower.includes("restaurant") || lower.includes("kitchen") || lower.includes("extraction") || lower.includes("hood")) {
    return "Mondar serves hospitality operators with certified Kitchen & Extraction compliance cleaning (Tier A, which includes fire prevention certification required by insurers) and after-hours nightly kitchen maintenance (Tier B). Request a quote by selecting the Restaurant & Kitchen vertical in the booking form.";
  }
  if (lower.includes("move-out") || lower.includes("moveout") || lower.includes("handover") || lower.includes("tenancy")) {
    return "We offer professional Move-Out & End Cleanings. Every move-out clean comes with our Handover Guarantee, meaning our subcontractors will be present during the apartment handover to ensure your landlord accepts the return. Select the Move-Out vertical in the booking form to request a quote.";
  }
  if (lower.includes("who") || lower.includes("what is mondar") || lower.includes("company") || lower.includes("broker")) {
    return "Mondar is a premium, Swiss-based booking platform and brokerage layer for specialty cleaning services. " +
           "We act as a single point of contact, managing the digital storefront, scheduling, quality audits, liability insurance, and payments, while dispatching the physical service to our curated, fully vetted network of Swiss subcontractor partners.";
  }
  return "Hello! I am the Mondar Assistant, your direct concierge for premium Swiss cleaning dispatches. " +
         "I can answer questions about our specialty cleaning divisions (Aviation, Yacht, Commercial, Domestic, Move-Out, Building Care, and Restaurant), help clarify our pricing structures, or guide you through our booking process.\n\n" +
         "How can I assist you with your cleaning requirements today?";
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
    "Transfer-Encoding": "chunked",
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "Access-Control-Expose-Headers": "X-RateLimit-Limit, X-RateLimit-Remaining, X-Chat-Mode",
  };

  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    // 1. If rate limit exceeded OR API key missing, run fallback offline mode
    if (!allowed || !apiKey) {
      responseHeaders["X-Chat-Mode"] = "offline";
      const offlineReply = getOfflineReply(lastMessage);
      
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const words = offlineReply.split(" ");
          for (const word of words) {
            controller.enqueue(encoder.encode(word + " "));
            await new Promise((resolve) => setTimeout(resolve, 35));
          }
          controller.close();
        }
      });

      return new Response(stream, { headers: responseHeaders });
    }

    // 2. Otherwise, run online Gemini 1.5 Flash stream
    responseHeaders["X-Chat-Mode"] = "ai";
    incrementRateLimit(ip);
    
    // Decrement the remaining count for the headers sent in this response
    responseHeaders["X-RateLimit-Remaining"] = String(Math.max(0, remaining - 1));

    const geminiContents = messages.slice(-6).map((m: any) => ({
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

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: cleanedContents,
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          generationConfig: {
            maxOutputTokens: 350
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API failed: ${geminiResponse.statusText}`);
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
                  const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                  if (text) {
                    controller.enqueue(new TextEncoder().encode(text));
                  }
                } catch (e) {
                  // ignore parse errors for partial chunks
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
    // If anything fails during the Gemini request, fall back to offline mode
    responseHeaders["X-Chat-Mode"] = "offline";
    const offlineReply = getOfflineReply("");
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = offlineReply.split(" ");
        for (const word of words) {
          controller.enqueue(encoder.encode(word + " "));
          await new Promise((resolve) => setTimeout(resolve, 35));
        }
        controller.close();
      }
    });
    return new Response(stream, { headers: responseHeaders });
  }
}
