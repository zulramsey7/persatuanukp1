import { describe, it, expect } from "vitest";
import { validateMemberQRData } from "../lib/qr-utils";

describe("QR Utilities", () => {
  describe("validateMemberQRData", () => {
    it("should validate a correct member QR code", () => {
      const validData = JSON.stringify({
        type: "PPUP_MEMBER",
        id: "001",
        name: "Ahmad",
        noRumah: "A-1-1",
        status: "active",
        verified: "2026-03-01"
      });
      
      const result = validateMemberQRData(validData);
      expect(result.isValid).toBe(true);
      expect(result.data?.id).toBe("001");
      expect(result.data?.name).toBe("Ahmad");
    });

    it("should reject non-PPUP QR codes", () => {
      const invalidData = JSON.stringify({
        type: "OTHER_SYSTEM",
        id: "123"
      });
      
      const result = validateMemberQRData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("QR code tidak sah. Bukan kod ahli PPUP.");
    });

    it("should reject malformed JSON", () => {
      const result = validateMemberQRData("not-json");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Format QR code tidak dikenali.");
    });

    it("should reject incomplete data", () => {
      const incompleteData = JSON.stringify({
        type: "PPUP_MEMBER",
        id: "001"
        // missing name
      });
      
      const result = validateMemberQRData(incompleteData);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Maklumat QR tidak lengkap.");
    });
  });
});
