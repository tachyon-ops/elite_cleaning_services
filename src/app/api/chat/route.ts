import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";
    
    let reply = "";
    const lower = lastMessage.toLowerCase();
    
    if (lower.includes("price") || lower.includes("cost") || lower.includes("chf") || lower.includes("tarif")) {
      reply = "At Mondar, our pricing depends on the service vertical:\n\n" +
              "- **Home & Villa Cleaning**: From CHF 80 (Base rate)\n" +
              "- **Offices & Commercial**: From CHF 150 (Per m² base)\n" +
              "- **Airbnb & Hospitality**: From CHF 120 (Flat rate per turnover)\n" +
              "- **Aviation & Yacht**: Bespoke quote-on-request (compiled within 4 hours)\n" +
              "- **Move-Out & End Clean**: Custom quote with handover guarantee\n" +
              "- **Building Care**: Custom quote for premium common-area care\n" +
              "- **Restaurant & Kitchen**: Custom quote for certified extraction compliance (Tier A) or nightly maintenance (Tier B)\n\n" +
              "Would you like me to help you start a booking for any of these divisions?";
    } else if (lower.includes("book") || lower.includes("reserv") || lower.includes("intake") || lower.includes("quote")) {
      reply = "To book a service, you can use our dynamic booking intake wizard directly from the home page. " +
              "Select your desired cleaning division (such as Aviation, Yacht, Commercial, Domestic, Move-Out, Building Care, or Restaurant), fill out the brief intake coordinates, choose a scheduling window, and secure your booking.\n\n" +
              "Standard cleanings can be confirmed instantly, while specialty/B2B divisions receive a locked-in quote via email within 4 hours.";
    } else if (lower.includes("aviation") || lower.includes("jet") || lower.includes("helicopter") || lower.includes("hangar")) {
      reply = "Mondar operates a dedicated Aviation Detailing division. We service private jets, turboprops, and helicopter interiors in Swiss hangars and FBOs (including Zurich Airport FBO).\n\n" +
              "Services include deep cabin detailing, leather treatment, cockpit cleaning, exterior wash, and galley restocking. Simply select the Aviation vertical in our booking intake to request a quote.";
    } else if (lower.includes("yacht") || lower.includes("boat") || lower.includes("marine") || lower.includes("ship")) {
      reply = "Our Yacht & Marine Care division provides premium exterior washdowns, teak cleaning/treatments, interior detailing, and end-of-season winterization. We have active service coverage and marina access across Lake Zurich and surrounding Swiss lakes.\n\n" +
              "You can specify your vessel length, type, and slip coordinates directly in our booking form.";
    } else if (lower.includes("building") || lower.includes("staircase") || lower.includes("common-area") || lower.includes("common area")) {
      reply = "Our Building Care division provides premium common-area cleaning, entrances, and staircase care for premium residential and mixed-use buildings. We establish fixed recurring weekday rounds to maintain prestige properties. Simply select the Building Care vertical on the home page to start your intake.";
    } else if (lower.includes("restaurant") || lower.includes("kitchen") || lower.includes("extraction") || lower.includes("hood")) {
      reply = "Mondar serves hospitality operators with certified Kitchen & Extraction compliance cleaning (Tier A, which includes fire prevention certification required by insurers) and after-hours nightly kitchen maintenance (Tier B). Request a quote by selecting the Restaurant & Kitchen vertical in the booking form.";
    } else if (lower.includes("move-out") || lower.includes("moveout") || lower.includes("handover") || lower.includes("tenancy")) {
      reply = "We offer professional Move-Out & End Cleanings. Every move-out clean comes with our Handover Guarantee, meaning our subcontractors will be present during the apartment handover to ensure your landlord accepts the return. Select the Move-Out vertical in the booking form to request a quote.";
    } else if (lower.includes("who") || lower.includes("what is mondar") || lower.includes("company") || lower.includes("broker")) {
      reply = "Mondar is a premium, Swiss-based booking platform and brokerage layer for specialty cleaning services. " +
              "We act as a single point of contact, managing the digital storefront, scheduling, quality audits, liability insurance, and payments, while dispatching the physical service to our curated, fully vetted network of Swiss subcontractor partners.";
    } else {
      reply = "Hello! I am the Mondar Assistant, your direct concierge for premium Swiss cleaning dispatches. " +
              "I can answer questions about our specialty cleaning divisions (Aviation, Yacht, Commercial, Domestic, Move-Out, Building Care, and Restaurant), help clarify our pricing structures, or guide you through our booking process.\n\n" +
              "How can I assist you with your cleaning requirements today?";
    }
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = reply.split(" ");
        for (const word of words) {
          controller.enqueue(encoder.encode(word + " "));
          await new Promise((resolve) => setTimeout(resolve, 35));
        }
        controller.close();
      }
    });
    
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
