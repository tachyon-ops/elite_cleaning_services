import { describe, it, expect } from "vitest";
import { getTranslationsForLocale, translate } from "../lib/i18n";

describe("i18n-utils", () => {
  describe("getTranslationsForLocale", () => {
    it("should return the correct dictionary or fallback to English", () => {
      const enDict = getTranslationsForLocale("en");
      expect(enDict.nav.services).toBe("Services");

      const deDict = getTranslationsForLocale("de");
      expect(deDict.nav.services).toBe("Dienstleistungen");

      const invalidDict = getTranslationsForLocale("fr");
      expect(invalidDict.nav.services).toBe("Services"); // fallback to English
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
});
