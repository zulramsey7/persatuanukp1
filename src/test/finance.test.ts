import { describe, it, expect } from "vitest";
import { formatCurrency, calculatePercentageChange, isValidJson } from "../lib/finance-utils";

describe("Finance Utilities", () => {
  describe("formatCurrency", () => {
    it("should format numbers as MYR correctly", () => {
      // Note: Intl.NumberFormat might use non-breaking spaces
      const result = formatCurrency(1234.56).replace(/\u00A0/g, " ");
      expect(result).toMatch(/RM\s?1,234.56/);
    });

    it("should handle zero correctly", () => {
      const result = formatCurrency(0).replace(/\u00A0/g, " ");
      expect(result).toMatch(/RM\s?0.00/);
    });
  });

  describe("calculatePercentageChange", () => {
    it("should calculate positive increase correctly", () => {
      expect(calculatePercentageChange(150, 100)).toBe(50);
    });

    it("should calculate decrease correctly", () => {
      expect(calculatePercentageChange(75, 100)).toBe(-25);
    });

    it("should handle previous value of zero", () => {
      expect(calculatePercentageChange(100, 0)).toBe(100);
      expect(calculatePercentageChange(0, 0)).toBe(0);
    });
  });

  describe("isValidJson", () => {
    it("should return true for valid JSON", () => {
      const validJson = JSON.stringify({ type: "PPUP_MEMBER", id: "001" });
      expect(isValidJson(validJson)).toBe(true);
    });

    it("should return false for invalid JSON", () => {
      expect(isValidJson("not a json")).toBe(false);
      expect(isValidJson("{ incomplete: json ")).toBe(false);
    });
  });
});
