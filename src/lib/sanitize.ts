/**
 * Security utilities for input sanitization
 * Prevents XSS attacks and malicious input
 */

/**
 * Sanitize string input to prevent XSS attacks
 * Removes dangerous HTML and script tags
 */
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return '';

  // Convert to string if needed
  let str = String(input).trim();

  // Remove script tags and event handlers
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  str = str.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Escape HTML special characters
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return str;
};

/**
 * Sanitize email input
 * Basic email validation and sanitization
 */
export const sanitizeEmail = (email: string | null | undefined): string => {
  if (!email) return '';

  // Remove whitespace
  let sanitized = String(email).trim().toLowerCase();

  // Sanitize the email
  return sanitizeInput(sanitized);
};

/**
 * Sanitize phone number
 * Keeps only digits and common separators
 */
export const sanitizePhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';

  // Keep only digits, +, -, (, ), and spaces
  return String(phone)
    .replace(/[^\d+\-() ]/g, '');
};

/**
 * Sanitize file name
 * Prevents path traversal and dangerous characters
 */
export const sanitizeFileName = (fileName: string | null | undefined): string => {
  if (!fileName) return 'file';

  // Remove path separators and dangerous characters
  let sanitized = String(fileName)
    .replace(/\.\./g, '') // Remove ..
    .replace(/[\/\\]/g, '') // Remove slashes
    .replace(/[<>:"|?*]/g, '') // Remove Windows forbidden chars
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();

  // Keep only alphanumeric, dots, hyphens, underscores
  sanitized = sanitized.replace(/[^\w\s.-]/g, '');

  return sanitized || 'file';
};

/**
 * Validate file type
 * Check against whitelist of allowed types
 */
export const isAllowedFileType = (
  fileName: string,
  allowedTypes: readonly string[] = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']
): boolean => {
  if (!fileName) return false;

  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return allowedTypes.includes(ext);
};

/**
 * Validate file size
 * Returns true if file is within max size
 */
export const isValidFileSize = (
  fileSizeBytes: number,
  maxSizeMB: number = 10
): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSizeBytes <= maxSizeBytes;
};

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '';

  const str = String(url).trim().toLowerCase();

  // Block dangerous protocols
  if (str.startsWith('javascript:') || str.startsWith('data:') || str.startsWith('vbscript:')) {
    return '';
  }

  // Allow only http, https, mailto, and tel
  if (!str.match(/^(https?|mailto|tel):/i) && !str.startsWith('/')) {
    return '';
  }

  return str;
};

/**
 * Sanitize text area input
 * More lenient than general input (allows newlines)
 */
export const sanitizeTextArea = (input: string | null | undefined): string => {
  if (!input) return '';

  let str = String(input).trim();

  // Remove script tags
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove dangerous event handlers
  str = str.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Encode HTML but preserve newlines
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return str;
};

/**
 * Validate Malaysian phone number
 */
export const isValidMalaysianPhone = (phone: string): boolean => {
  const mobileRegex = /^(\+?6?01[0-46-9]\d{7,8}|01[0-46-9]\d{7,8})$/;
  const landlineRegex = /^(\+?60\d{1,2}\d{6,8}|\0\d{1,2}\d{6,8})$/;

  return mobileRegex.test(phone) || landlineRegex.test(phone);
};

/**
 * Validate Malaysian house number (simple)
 */
export const isValidHouseNumber = (houseNo: string): boolean => {
  // Allow alphanumeric, hyphens, slashes, commas, and spaces
  return /^[a-zA-Z0-9\s,\/-]+$/.test(houseNo) && houseNo.length > 0;
};
