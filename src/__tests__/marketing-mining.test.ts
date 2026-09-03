import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { classifyLead } from "@/lib/mining/lead-classifier";
import { parseShabXml } from "@/lib/mining/shab-client";
import {
  getMiningLeads,
  updateMiningLead,
  updateMiningLeadStatus,
  convertLeadToDraftBooking,
} from "@/app/actions/mining";

describe("Commercial Lead Mining & Qualification Engine (Option C)", () => {
  const testPubId = "test-pub-shab-001";
  let createdLeadId: string | null = null;
  let createdBookingId: string | null = null;

  beforeAll(async () => {
    // Clean up any lingering test lead
    await db.miningLead.deleteMany({
      where: { publicationId: testPubId },
    });
  });

  afterAll(async () => {
    if (createdBookingId) {
      await db.booking.deleteMany({ where: { id: createdBookingId } });
    }
    if (createdLeadId) {
      await db.miningLead.deleteMany({ where: { id: createdLeadId } });
    }
  });

  describe("1. Lead Classification & Intent Scoring", () => {
    it("should assign high priority score to medical practices and law firms", () => {
      const result = classifyLead({
        companyName: "Dr. Keller Zahnarzt & Praxisklinik AG",
        purpose: "Betrieb einer zahnmedizinischen Praxis und Klinik sowie Erbringung aller damit zusammenhängenden Dienstleistungen.",
        legalForm: "Aktiengesellschaft",
        canton: "ZH",
      });

      expect(result.detectedVertical).toBe("commercial");
      expect(result.priorityScore).toBeGreaterThanOrEqual(75);
      expect(result.confidence).toBe("high");
      expect(result.reasoning.some((r) => r.includes("Target sector"))).toBe(true);
    });

    it("should classify office relocations with old address into moveout vertical with high intent", () => {
      const result = classifyLead({
        companyName: "Nexis Software Solutions GmbH",
        purpose: "Entwicklung von Softwarelösungen und IT-Consulting.",
        legalForm: "GmbH",
        changeType: "seat+domicile",
        hasOldAddress: true,
        canton: "ZG",
      });

      expect(result.detectedVertical).toBe("moveout");
      expect(result.priorityScore).toBeGreaterThanOrEqual(70);
      expect(result.reasoning.some((r) => r.includes("Office relocation in progress"))).toBe(true);
    });

    it("should detect hospitality / gastronomy businesses", () => {
      const result = classifyLead({
        companyName: "Alpenblick Restaurant & Bar GmbH",
        purpose: "Betrieb eines Restaurants, Cafés und Catering-Dienstleistungen.",
        legalForm: "GmbH",
        canton: "LU",
      });

      expect(result.detectedVertical).toBe("hospitality");
      expect(result.priorityScore).toBeGreaterThanOrEqual(65);
    });

    it("should penalize holding companies and letterbox entities", () => {
      const result = classifyLead({
        companyName: "Alpine Capital Holding AG",
        purpose: "Reine Holding. Erwerb, dauernde Verwaltung und Veräusserung von Beteiligungen an in- und ausländischen Unternehmen. Finanzierungen aller Art.",
        legalForm: "AG",
        canton: "ZG",
      });

      expect(result.priorityScore).toBeLessThan(50);
      expect(result.reasoning.some((r) => r.includes("Holding"))).toBe(true);
    });
  });

  describe("2. SHAB XML Parsing", () => {
    it("should parse HR02 mutation XML with seat and domicile change", () => {
      const sampleXml = `
        <publication>
          <meta>
            <id>pub-12345</id>
            <publicationDate>2026-09-02T08:00:00.000Z</publicationDate>
            <cantons>ZH</cantons>
            <subRubric>HR02</subRubric>
          </meta>
          <content>
            <company>
              <name>Stadthaus Consulting AG</name>
              <uid>CHE-123.456.789</uid>
              <legalForm>Aktiengesellschaft</legalForm>
            </company>
            <purpose>Erbringung von Beratungsdienstleistungen für KMU und Grossunternehmen.</purpose>
            <publicationText>
              Stadthaus Consulting AG, in Dietikon, CHE-123.456.789, Aktiengesellschaft.
              Sitz neu: Zürich.
              Domizil neu: Bahnhofstrasse 100, 8001 Zürich. (bisher: Badenerstrasse 50, 8953 Dietikon).
            </publicationText>
          </content>
        </publication>
      `;

      const candidate = parseShabXml("pub-12345", sampleXml);
      expect(candidate).not.toBeNull();
      expect(candidate?.companyName).toBe("Stadthaus Consulting AG");
      expect(candidate?.uid).toBe("CHE-123.456.789");
      expect(candidate?.subRubric).toBe("HR02");
      expect(candidate?.changeType).toBe("seat+domicile");
      expect(candidate?.newSeat).toBe("Zürich");
      expect(candidate?.newAddress).toContain("Bahnhofstrasse 100, 8001 Zürich");
      expect(candidate?.oldAddress).toContain("Badenerstrasse 50, 8953 Dietikon");
      expect(candidate?.sourceUrl).toBe("https://shab.ch/#!/search/publications/detail/pub-12345");
    });

    it("should ignore HR02 publications with no seat or domicile change (e.g. board member change)", () => {
      const sampleXml = `
        <publication>
          <meta>
            <id>pub-board-only</id>
            <publicationDate>2026-09-02T08:00:00.000Z</publicationDate>
            <cantons>ZH</cantons>
            <subRubric>HR02</subRubric>
          </meta>
          <content>
            <company>
              <name>Static Firm GmbH</name>
              <uid>CHE-987.654.321</uid>
              <legalForm>GmbH</legalForm>
            </company>
            <publicationText>
              Ausgeschiedene Personen und erloschene Unterschriften: Meier, Hans, Mitglied der Geschäftsleitung.
            </publicationText>
          </content>
        </publication>
      `;

      const candidate = parseShabXml("pub-board-only", sampleXml);
      expect(candidate).toBeNull();
    });

    it("should parse HR01 new incorporation XML", () => {
      const sampleXml = `
        <publication>
          <meta>
            <id>pub-new-001</id>
            <publicationDate>2026-09-02T08:00:00.000Z</publicationDate>
            <cantons>BE</cantons>
            <subRubric>HR01</subRubric>
          </meta>
          <content>
            <company>
              <name>Berner Tech Studio GmbH</name>
              <uid>CHE-444.555.666</uid>
              <legalForm>GmbH</legalForm>
            </company>
            <purpose>Erbringung von Software-Entwicklungsdienstleistungen.</purpose>
            <publicationText>
              Berner Tech Studio GmbH, in Bern, CHE-444.555.666.
              Domizil: Bundesplatz 5, 3011 Bern.
            </publicationText>
          </content>
        </publication>
      `;

      const candidate = parseShabXml("pub-new-001", sampleXml);
      expect(candidate).not.toBeNull();
      expect(candidate?.companyName).toBe("Berner Tech Studio GmbH");
      expect(candidate?.subRubric).toBe("HR01");
      expect(candidate?.changeType).toBe("incorporation");
      expect(candidate?.newAddress).toContain("Bundesplatz 5, 3011 Bern");
    });
  });

  describe("3. Lead Management & 1-Click Quote Pipeline Actions", () => {
    it("should create a mining lead record in the database", async () => {
      const created = await db.miningLead.create({
        data: {
          source: "shab",
          subRubric: "HR02",
          publicationId: testPubId,
          publicationDate: new Date(),
          canton: "ZH",
          uid: "CHE-999.888.777",
          companyName: "Test Relocating Lawyers AG",
          legalForm: "AG",
          changeType: "seat+domicile",
          newSeat: "Zürich",
          newAddress: "Talstrasse 20, 8001 Zürich",
          oldAddress: "Seestrasse 10, 8700 Küsnacht",
          purpose: "Rechtsberatung und Vertretung von Parteien vor Gerichten.",
          priorityScore: 85,
          detectedVertical: "commercial",
          status: "new",
        },
      });

      expect(created.id).toBeDefined();
      createdLeadId = created.id;
    });

    it("should query mining leads with filters and statistics", async () => {
      const res = await getMiningLeads({
        canton: "ZH",
        status: "new",
      });

      expect(res.success).toBe(true);
      expect(res.leads).toBeDefined();
      expect(res.stats).toBeDefined();
      expect(res.stats.totalAllTime).toBeGreaterThanOrEqual(1);

      const found = res.leads.find((l: any) => l.publicationId === testPubId);
      expect(found).toBeDefined();
      expect(found.companyName).toBe("Test Relocating Lawyers AG");
    });

    it("should update lead status and outreach notes", async () => {
      expect(createdLeadId).not.toBeNull();
      const res = await updateMiningLeadStatus(
        createdLeadId!,
        "contacted",
        "Spoke with Managing Partner, requested quote for 350m2 office move-in clean."
      );

      expect(res.success).toBe(true);
      expect(res.lead.status).toBe("contacted");
      expect(res.lead.contactNotes).toContain("Managing Partner");
      expect(res.lead.contactedAt).toBeDefined();
    });

    it("should save direct contact phone, email, person, and website", async () => {
      expect(createdLeadId).not.toBeNull();
      const res = await updateMiningLead(createdLeadId!, {
        contactPhone: "+41 44 211 55 00",
        contactEmail: "info@relocating-lawyers.ch",
        contactPerson: "Dr. Thomas Keller",
        website: "https://relocating-lawyers.ch",
      });

      expect(res.success).toBe(true);
      expect(res.lead.contactPhone).toBe("+41 44 211 55 00");
      expect(res.lead.contactEmail).toBe("info@relocating-lawyers.ch");
      expect(res.lead.contactPerson).toBe("Dr. Thomas Keller");
      expect(res.lead.website).toBe("https://relocating-lawyers.ch");
    });

    it("should convert lead to draft commercial booking with 1-click", async () => {
      expect(createdLeadId).not.toBeNull();
      const res = await convertLeadToDraftBooking(createdLeadId!);

      expect(res.success).toBe(true);
      expect(res.bookingId).toBeDefined();
      createdBookingId = res.bookingId;

      // Verify lead status updated to quoted
      const lead = await db.miningLead.findUnique({ where: { id: createdLeadId! } });
      expect(lead?.status).toBe("quoted");
      expect(lead?.convertedBookingId).toBe(createdBookingId);

      // Verify draft booking was created
      const booking = await db.booking.findUnique({ where: { id: createdBookingId! } });
      expect(booking).not.toBeNull();
      expect(booking?.status).toBe("quote_pending");
      expect(booking?.vertical).toBe("commercial");
      expect(booking?.locationAddress).toContain("Talstrasse 20");

      const intakeObj = JSON.parse(booking?.intake || "{}");
      expect(intakeObj.companyName).toBe("Test Relocating Lawyers AG");
      expect(intakeObj.source).toBe("commercial_mining");
    });
  });
});
