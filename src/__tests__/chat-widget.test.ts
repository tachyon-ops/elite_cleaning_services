import { describe, it, expect } from "vitest";
import { calculateDeterministicSwissQuote, getOfflineReply } from "@/app/api/chat/route";

describe("Chat Widget Quote Calculation & Booking Link Pre-filling", () => {
  it("calculates accurate quote and generated localized URL with prefilled query params for 5.5 Zimmer in German", () => {
    const message = "Ich brauche eine Endreinigung für 5.5 Zimmer mit Balkon und es ist dringend / am Wochenende";
    const quote = calculateDeterministicSwissQuote(message);

    expect(quote).not.toBeNull();
    expect(quote).toContain("Endreinigung (5.5 Zimmer)");
    expect(quote).toContain("Grundreinigung (5.5+ Zimmer)");
    expect(quote).toContain("CHF 1180.00");
    expect(quote).toContain("Zusatz Balkon / Terrasse");
    expect(quote).toContain("Inbegriffen");
    expect(quote).toContain("Express / Wochenende-Zuschlag");
    expect(quote).toContain("CHF 200.00");
    expect(quote).toContain("CHF 1380.00");
    expect(quote).toContain("100% Schweizer Abnahmegarantie");
    expect(quote).toContain("scope=handover_guarantee,balcony_terrace,express_weekend");
  });

  it("calculates accurate quote with next Saturday date pre-filled when user requests Saturday", () => {
    const message = "Dringend! Brauche per morgen samstag eine Endreinigung für 5.5 Zimmer mit Abnahmegarantie und Balkon!";
    const quote = calculateDeterministicSwissQuote(message);

    expect(quote).not.toBeNull();
    expect(quote).toContain("Endreinigung (5.5 Zimmer)");
    expect(quote).toContain("Express / Wochenende-Zuschlag");
    expect(quote).toContain("&date=");
    expect(quote).toContain("scope=handover_guarantee,balcony_terrace,express_weekend");
  });

  it("calculates accurate quote in English for 3.5 rooms with balcony", () => {
    const message = "Hello, I need a quote for a 3.5 room apartment move-out clean with balcony";
    const quote = calculateDeterministicSwissQuote(message);

    expect(quote).not.toBeNull();
    expect(quote).toContain("3.5 Room Move-Out Deep Clean");
    expect(quote).toContain("CHF 770.00");
    expect(quote).toContain("Add-on Balcony / Terrace");
    expect(quote).toContain("Included (CHF 0.00)");
    expect(quote).toContain("[Book with this Quote](/en/book/end-cleaning?rooms=3.5&area=80&beds=2&baths=1&scope=handover_guarantee,balcony_terrace)");
  });

  it("calculates accurate quote in Portuguese for 4.5 rooms", () => {
    const message = "Olá! Preciso de orçamento para limpeza de mudança para apartamento de 4.5 divisões";
    const quote = calculateDeterministicSwissQuote(message);

    expect(quote).not.toBeNull();
    expect(quote).toContain("Limpeza de Mudança (4.5 Divisões)");
    expect(quote).toContain("CHF 960.00");
    expect(quote).toContain("100% Garantia de Entrega Suíça");
    expect(quote).toContain("[Reservar com este orçamento](/pt/reservar/limpeza-mudanca?rooms=4.5&area=100&beds=3&baths=2&scope=handover_guarantee)");
  });

  it("returns offline reply for generic pricing requests with localized links", () => {
    const reply = getOfflineReply("preis für reinigung?");
    expect(reply).toContain("Mondar Preisübersicht");
    expect(reply).toContain("/de/buchen/endreinigung");
    expect(reply).toContain("/de/buchen/haus");
    expect(reply).toContain("/de/buchen/gewerbe");
  });
});
