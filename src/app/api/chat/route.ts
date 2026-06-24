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
              "- **Aviation & Yacht**: Bespoke quote-on-request (compiled by our Zürich dispatch desk within 4 hours)\n\n" +
              "Would you like me to help you start a booking for any of these divisions?";
    } else if (lower.includes("book") || lower.includes("reserv") || lower.includes("intake") || lower.includes("quote")) {
      reply = "To book a service, you can use our dynamic booking intake wizard directly from the home page. " +
              "Select your desired cleaning division (such as Aviation, Yacht, Commercial, or Domestic), fill out the brief intake coordinates, choose a scheduling window, and secure your booking.\n\n" +
              "Standard cleanings can be confirmed instantly, while specialty divisions receive a locked-in quote via email within 4 hours.";
    } else if (lower.includes("aviation") || lower.includes("jet") || lower.includes("helicopter") || lower.includes("hangar")) {
      reply = "Mondar operates a dedicated Aviation Detailing division. We service private jets, turboprops, and helicopter interiors in Swiss hangars and FBOs (including Zurich Airport FBO).\n\n" +
              "Services include deep cabin detailing, leather treatment, cockpit cleaning, exterior wash, and galley restocking. Simply select the Aviation vertical in our booking intake to request a quote.";
    } else if (lower.includes("yacht") || lower.includes("boat") || lower.includes("marine") || lower.includes("ship")) {
      reply = "Our Yacht & Marine Care division provides premium exterior washdowns, teak cleaning/treatments, interior detailing, and end-of-season winterization. We have active service coverage and marina access across Lake Zurich and surrounding Swiss lakes.\n\n" +
              "You can specify your vessel length, type, and slip coordinates directly in our booking form.";
    } else if (lower.includes("who") || lower.includes("what is mondar") || lower.includes("company") || lower.includes("broker")) {
      reply = "Mondar is a premium, Swiss-based booking platform and brokerage layer for specialty cleaning services. " +
              "We act as a single point of contact, managing the digital storefront, scheduling, quality audits, liability insurance, and payments, while dispatching the physical service to our curated, fully vetted network of Swiss subcontractor partners.";
    } else {
      reply = "Hello! I am the Mondar Assistant, your direct concierge for premium Swiss cleaning dispatches. " +
              "I can answer questions about our specialty cleaning divisions (Aviation, Yacht, Commercial, Domestic, and Special Services), help clarify our pricing structures, or guide you through our booking process.\n\n" +
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
