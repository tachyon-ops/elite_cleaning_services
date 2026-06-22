import { describe, it, expect, afterAll } from "vitest";
import { db } from "@/lib/db";
import { applyProvider } from "@/app/actions/provider";
import { reviewApplication } from "@/app/actions/admin";

describe("Subcontractor Partner Onboarding TDD", () => {
  const applicantEmail = "onboard-test@swisscleaners.ch";
  let applicationId: string | null = null;
  let companyName = "Swiss Onboard Test GmbH";
  let slug = "swiss-onboard-test-gmbh";

  afterAll(async () => {
    // Clean up created records
    if (applicationId) {
      await db.providerApplication.deleteMany({
        where: { id: applicationId }
      });
    }

    const provider = await db.provider.findUnique({
      where: { slug }
    });

    if (provider) {
      await db.providerTeam.deleteMany({
        where: { providerId: provider.id }
      });
      await db.providerListing.deleteMany({
        where: { providerId: provider.id }
      });
      await db.user.deleteMany({
        where: { providerCompanyId: provider.id }
      });
      await db.provider.delete({
        where: { id: provider.id }
      });
    }
  });

  it("should successfully submit application with custom moat preferences", async () => {
    const res = await applyProvider({
      companyName,
      applicantEmail,
      applicantName: "Hermann Meier",
      legalEntityType: "gmbh",
      verticalsRequested: ["domestic", "yacht"],
      region: "Zürich",
      motivation: "We want to expand to Yachting.",
      calendarSync: "google",
      bookingMode: "instant",
      recurringSupport: "yes_dedicated",
      chatPreference: "opt_in"
    });

    expect(res.success).toBe(true);
    expect(res.applicationId).toBeDefined();
    applicationId = res.applicationId || null;

    // Verify application stored in DB
    const app = await db.providerApplication.findUnique({
      where: { id: applicationId! }
    });

    expect(app).not.toBeNull();
    expect(app?.companyName).toBe(companyName);
    
    // Check parsed JSON data
    const data = JSON.parse(app?.applicationData || "{}");
    expect(data.motivation).toBe("We want to expand to Yachting.");
    expect(data.calendarSync).toBe("google");
    expect(data.bookingMode).toBe("instant");
    expect(data.recurringSupport).toBe("yes_dedicated");
    expect(data.chatPreference).toBe("opt_in");
  });

  it("should successfully approve application and auto-provision resources", async () => {
    if (!applicationId) return;

    const reviewRes = await reviewApplication({
      applicationId,
      status: "approved",
      decisionNotes: "Vetted successfully against Swiss commercial registry."
    });

    expect(reviewRes.success).toBe(true);

    // Verify application status updated
    const app = await db.providerApplication.findUnique({
      where: { id: applicationId }
    });
    expect(app?.status).toBe("approved");
    expect(app?.decisionNotes).toBe("Vetted successfully against Swiss commercial registry.");

    // Verify Provider provisioned
    const provider = await db.provider.findUnique({
      where: { slug },
      include: {
        teams: true,
        listings: true,
        staff: true
      }
    });

    expect(provider).not.toBeNull();
    expect(provider?.name).toBe(companyName);
    expect(provider?.onboardingStatus).toBe("active");

    // Verify default team created with requested verticals
    expect(provider?.teams).toHaveLength(1);
    const team = provider?.teams[0];
    expect(team?.name).toBe("Primary Dispatch Team");
    expect(team?.region).toBe("Zürich");
    const categories = JSON.parse(team?.serviceCategories || "[]");
    expect(categories).toContain("domestic");
    expect(categories).toContain("yacht");

    // Verify listings created for both requested verticals
    expect(provider?.listings).toHaveLength(2);
    const listingSlugs = provider?.listings.map(l => l.categorySlug);
    expect(listingSlugs).toContain("domestic");
    expect(listingSlugs).toContain("yacht");

    // Verify staff login user created
    expect(provider?.staff).toHaveLength(1);
    const user = provider?.staff[0];
    expect(user?.email).toBe(applicantEmail);
    expect(user?.role).toBe("provider_staff");
  });
});
