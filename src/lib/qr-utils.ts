export interface MemberData {
  type: string;
  id: string;
  uuid?: string;
  name: string;
  noRumah: string;
  status: string;
  verified: string;
}

/**
 * Validates the structure and type of scanned QR data
 */
export function validateMemberQRData(jsonString: string): { isValid: boolean; data?: MemberData; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.type !== "PPUP_MEMBER") {
      return { isValid: false, error: "QR code tidak sah. Bukan kod ahli PPUP." };
    }

    if (!data.id || !data.name) {
      return { isValid: false, error: "Maklumat QR tidak lengkap." };
    }

    return { isValid: true, data: data as MemberData };
  } catch (e) {
    return { isValid: false, error: "Format QR code tidak dikenali." };
  }
}
