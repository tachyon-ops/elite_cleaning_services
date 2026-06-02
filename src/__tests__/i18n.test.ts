import { getTranslationsForLocale, translate, localizeHref, resolveVerticalSlug } from "../lib/i18n";

describe("i18n-utils", () => {
  describe("getTranslationsForLocale", () => {
    it("should return the correct dictionary or fallback to English", () => {
      const enDict = getTranslationsForLocale("en");
      expect(enDict.nav.services).toBe("Services");

      const deDict = getTranslationsForLocale("de");
      expect(deDict.nav.services).toBe("Dienstleistungen");

      const frDict = getTranslationsForLocale("fr");
      expect(frDict.nav.getQuote).toBe("DEMANDER UN DEVIS");

      const itDict = getTranslationsForLocale("it");
      expect(itDict.nav.getQuote).toBe("RICHIEDI UN PREVENTIVO");

      const rmDict = getTranslationsForLocale("rm");
      expect(rmDict.nav.getQuote).toBe("DUMANDAR INA OFFERTA");

      const esDict = getTranslationsForLocale("es");
      expect(esDict.nav.getQuote).toBe("SOLICITAR PRESUPUESTO");

      const ptDict = getTranslationsForLocale("pt");
      expect(ptDict.nav.getQuote).toBe("SOLICITAR ORÇAMENTO");

      const invalidDict = getTranslationsForLocale("ru");
      expect(invalidDict.nav.getQuote).toBe("GET A QUOTE"); // fallback to English
    });
  });

  describe("translate resolver", () => {
    const mockDict = {
      nav: {
        services: "Services",
      },
      hero: {
        title: "Main Title",
      },
    };

    it("should resolve dotted keys successfully", () => {
      expect(translate("nav.services", mockDict)).toBe("Services");
      expect(translate("hero.title", mockDict)).toBe("Main Title");
    });

    it("should fallback to English dictionary if key is missing in input dictionary", () => {
      expect(translate("nonexistent.key", mockDict)).toBe("nonexistent.key");
      expect(translate("nav.nonexistent", mockDict)).toBe("nav.nonexistent");
    });
  });

  describe("localizeHref helper", () => {
    it("should return localized path for default locale 'de' (prefixed and slug-localized)", () => {
      expect(localizeHref("/", "de")).toBe("/de");
      expect(localizeHref("/book/domestic", "de")).toBe("/de/buchen/haus");
      expect(localizeHref("/book/moveout", "de")).toBe("/de/buchen/endreinigung");
      expect(localizeHref("/providers", "de")).toBe("/de/partner");
    });

    it("should return prefixed and slug-localized path for other locales", () => {
      expect(localizeHref("/", "pt")).toBe("/pt");
      expect(localizeHref("/book/domestic", "pt")).toBe("/pt/reservar/domestica");
      expect(localizeHref("/book/moveout", "pt")).toBe("/pt/reservar/limpeza-mudanca");
      expect(localizeHref("/providers", "pt")).toBe("/pt/parceiros");
      expect(localizeHref("/", "es")).toBe("/es");
      expect(localizeHref("/book/domestic", "en")).toBe("/en/book/domestic");
      expect(localizeHref("/book/moveout", "en")).toBe("/en/book/end-cleaning");
    });


    it("should ignore hashes, external links, and special links", () => {
      expect(localizeHref("#how-it-works", "pt")).toBe("#how-it-works");
      expect(localizeHref("https://google.com", "pt")).toBe("https://google.com");
      expect(localizeHref("tel:+41441234567", "pt")).toBe("tel:+41441234567");
      expect(localizeHref("mailto:info@elite.ch", "pt")).toBe("mailto:info@elite.ch");
    });
  });

  describe("Cookie Consent Banner Translations", () => {
    it("should check that each locale has correct translation keys", () => {
      const locales = ["de", "en", "fr", "it", "rm", "es", "pt"];
      for (const loc of locales) {
        const dict = getTranslationsForLocale(loc);
        expect(dict.cookieBanner).toBeDefined();
        expect(dict.cookieBanner.text.toLowerCase()).toContain("cook");
        expect(dict.cookieBanner.accept).toBeDefined();
        expect(dict.cookieBanner.necessary).toBeDefined();
      }
    });
  });

  describe("resolveVerticalSlug helper", () => {
    it("should resolve localized slugs back to their internal name", () => {
      expect(resolveVerticalSlug("domestica", "pt")).toBe("domestic");
      expect(resolveVerticalSlug("haus", "de")).toBe("domestic");
      expect(resolveVerticalSlug("gewerbe", "de")).toBe("commercial");
      expect(resolveVerticalSlug("yate", "es")).toBe("yacht");
      expect(resolveVerticalSlug("endreinigung", "de")).toBe("moveout");
      expect(resolveVerticalSlug("end-cleaning", "en")).toBe("moveout");
    });

    it("should return the slug as-is if already internal or unrecognized", () => {
      expect(resolveVerticalSlug("domestic", "pt")).toBe("domestic");
      expect(resolveVerticalSlug("aviation", "en")).toBe("aviation");
      expect(resolveVerticalSlug("unrecognized-slug", "pt")).toBe("unrecognized-slug");
    });
  });
});
