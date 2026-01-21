/**
 * Application Constants
 * Centralized configuration for status values, roles, and other constants
 */

// ============ USER ROLES ============
export const USER_ROLES = {
  PENGERUSI: 'pengerusi',
  BENDAHARI: 'bendahari',
  AJK: 'ajk',
  AHLI: 'ahli',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  [USER_ROLES.PENGERUSI]: 'Pengerusi',
  [USER_ROLES.BENDAHARI]: 'Bendahari',
  [USER_ROLES.AJK]: 'AJK',
  [USER_ROLES.AHLI]: 'Ahli',
};

// ============ MEMBER STATUS ============
export const MEMBER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  [MEMBER_STATUS.PENDING]: 'Menunggu Pengesahan',
  [MEMBER_STATUS.ACTIVE]: 'Aktif',
  [MEMBER_STATUS.INACTIVE]: 'Tidak Aktif',
};

export const MEMBER_STATUS_COLORS: Record<string, string> = {
  [MEMBER_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [MEMBER_STATUS.ACTIVE]: 'bg-green-100 text-green-800',
  [MEMBER_STATUS.INACTIVE]: 'bg-gray-100 text-gray-800',
};

// ============ PAYMENT STATUS ============
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  DIBAYAR: 'dibayar',
  GAGAL: 'gagal',
  OVERDUE: 'overdue',
} as const;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  [PAYMENT_STATUS.PENDING]: 'Belum Dibayar',
  [PAYMENT_STATUS.DIBAYAR]: 'Dibayar',
  [PAYMENT_STATUS.GAGAL]: 'Gagal',
  [PAYMENT_STATUS.OVERDUE]: 'Lewat Pembayaran',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  [PAYMENT_STATUS.PENDING]: 'bg-orange-100 text-orange-800',
  [PAYMENT_STATUS.DIBAYAR]: 'bg-green-100 text-green-800',
  [PAYMENT_STATUS.GAGAL]: 'bg-red-100 text-red-800',
  [PAYMENT_STATUS.OVERDUE]: 'bg-red-200 text-red-900',
};

// ============ ACTIVITY STATUS ============
export const ACTIVITY_STATUS = {
  AKTIF: 'aktif',
  SELESAI: 'selesai',
  DIBATALKAN: 'dibatalkan',
} as const;

export const ACTIVITY_STATUS_LABELS: Record<string, string> = {
  [ACTIVITY_STATUS.AKTIF]: 'Aktif',
  [ACTIVITY_STATUS.SELESAI]: 'Selesai',
  [ACTIVITY_STATUS.DIBATALKAN]: 'Dibatalkan',
};

// ============ DOCUMENT CATEGORIES ============
export const DOCUMENT_CATEGORIES = {
  MINIT: 'minit-mesyuarat',
  KEWANGAN: 'kewangan',
  PERATURAN: 'peraturan',
  SURAT: 'surat-rasmi',
  LAPORAN: 'laporan',
  LAIN: 'lain-lain',
} as const;

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  [DOCUMENT_CATEGORIES.MINIT]: 'Minit Mesyuarat',
  [DOCUMENT_CATEGORIES.KEWANGAN]: 'Kewangan',
  [DOCUMENT_CATEGORIES.PERATURAN]: 'Peraturan',
  [DOCUMENT_CATEGORIES.SURAT]: 'Surat Rasmi',
  [DOCUMENT_CATEGORIES.LAPORAN]: 'Laporan',
  [DOCUMENT_CATEGORIES.LAIN]: 'Lain-lain',
};

// ============ EXPENSE CATEGORIES ============
export const EXPENSE_CATEGORIES = {
  UTILITI: 'utiliti',
  PENTADBIRAN: 'pentadbiran',
  PEMELIHARAAN: 'pemeliharaan',
  ACARA: 'acara',
  LAIN: 'lain-lain',
} as const;

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  [EXPENSE_CATEGORIES.UTILITI]: 'Utiliti',
  [EXPENSE_CATEGORIES.PENTADBIRAN]: 'Pentadbiran',
  [EXPENSE_CATEGORIES.PEMELIHARAAN]: 'Pemeliharaan',
  [EXPENSE_CATEGORIES.ACARA]: 'Acara',
  [EXPENSE_CATEGORIES.LAIN]: 'Lain-lain',
};

// ============ NOTIFICATION TYPES ============
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
  ERROR: 'error',
} as const;

// ============ FILE UPLOAD ============
export const FILE_UPLOAD_CONFIG = {
  MAX_SIZE_MB: 10,
  ALLOWED_TYPES: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp'],
  IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  DOCUMENT_TYPES: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
} as const;

// ============ PAGINATION ============
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

// ============ VALIDATION RULES ============
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  HOUSE_NUMBER_MAX_LENGTH: 50,
} as const;

// ============ API SETTINGS ============
export const API_CONFIG = {
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const;

// ============ MONTHS (Malay) ============
export const MONTHS_MALAY = [
  'Januari',
  'Februari',
  'Mac',
  'April',
  'Mei',
  'Jun',
  'Julai',
  'Ogos',
  'September',
  'Oktober',
  'November',
  'Disember',
] as const;

// ============ DAYS (Malay) ============
export const DAYS_MALAY = [
  'Ahad',
  'Isnin',
  'Selasa',
  'Rabu',
  'Khamis',
  'Jumaat',
  'Sabtu',
] as const;

// ============ QUERY KEYS (for React Query) ============
export const QUERY_KEYS = {
  PROFILE: 'profile',
  MEMBERS: 'members',
  YURAN: 'yuran',
  ACTIVITIES: 'activities',
  DOCUMENTS: 'documents',
  GALLERY: 'gallery',
  NOTIFICATIONS: 'notifications',
  FINANCE: 'finance',
  POLLS: 'polls',
} as const;
