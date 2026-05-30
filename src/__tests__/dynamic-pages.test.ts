import { db } from "../lib/db";
import { checkAndSeedDb } from "../lib/db/seed-checker";
import { resolveAlternateLocaleUrl, updatePageTranslation } from "../app/actions/page-translations";

describe("Dynamic Pages & Slugs Translation System", () => {
  beforeAll(async () => {
    // Seed the database to ensure pages exist
    await checkAndSeedDb();
  });

  describe("Seeding & DB Presence", () => {
    it("should verify that privacy, terms, and cookies pages are seeded", async () => {
      const pageKeys = ["privacy", "terms", "cookies"];
      for (const key of pageKeys) {
        const page = await db.page.findUnique({
          where: { key },
          include: { translations: true }
        });
        expect(page).not.toBeNull();
        expect(page?.translations.length).toBe(7); // 7 locales
      }
    });

    it("should match correct slugs for German and French privacy pages", async () => {
      const deTranslation = await db.pageTranslation.findFirst({
        where: {
          locale: "de",
          page: { key: "privacy" }
        }
      });
      expect(deTranslation?.slug).toBe("rechtliches/datenschutz");
      expect(deTranslation?.title).toBe("Datenschutzerklärung");

      const frTranslation = await db.pageTranslation.findFirst({
        where: {
          locale: "fr",
          page: { key: "privacy" }
        }
      });
      expect(frTranslation?.slug).toBe("juridique/confidentialite");
      expect(frTranslation?.title).toBe("Politique de confidentialité");
    });
  });

  describe("Slug URL Alternate Locale Resolver", () => {
    it("should resolve dynamic database-backed page slugs correctly on locale switch", async () => {
      // 1. Switch French privacy to German (should be prefix-less rechtliches/datenschutz)
      const res1 = await resolveAlternateLocaleUrl("/fr/juridique/confidentialite", "de");
      expect(res1).toBe("/rechtliches/datenschutz");

      // 2. Switch German privacy to English (should be /en/legal/privacy)
      const res2 = await resolveAlternateLocaleUrl("/rechtliches/datenschutz", "en");
      expect(res2).toBe("/en/legal/privacy");

      // 3. Switch English cookies to French (should be /fr/juridique/cookies)
      const res3 = await resolveAlternateLocaleUrl("/en/legal/cookies", "fr");
      expect(res3).toBe("/fr/juridique/cookies");
    });

    it("should resolve static navigation paths correctly on locale switch", async () => {
      // 1. Switch providers to French partners
      const res1 = await resolveAlternateLocaleUrl("/providers", "fr");
      expect(res1).toBe("/fr/partenaires");

      // 2. Switch French book to English book
      const res2 = await resolveAlternateLocaleUrl("/fr/reserver/domestic", "en");
      expect(res2).toBe("/en/book/domestic");

      // 3. Switch German partner (default locale de) to Portuguese
      const res3 = await resolveAlternateLocaleUrl("/partner", "pt");
      expect(res3).toBe("/pt/parceiros");
    });

    it("should fallback gracefully if path is unrecognized", async () => {
      const res = await resolveAlternateLocaleUrl("/random/unrecognized/path", "fr");
      expect(res).toBe("/fr/random/unrecognized/path");
    });
  });
});
