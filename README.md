# Persatuan Penduduk Taman Ukay Perdana UP1

Aplikasi pengurusan komuniti digital untuk Persatuan Penduduk Taman Ukay Perdana UP1 (PPUP1). Platform lengkap untuk pengurusan ahli, kewangan, aktiviti, dan komunikasi komuniti.

## Ciri-ciri Utama

### 👥 Pengurusan Keahlian
- Pendaftaran ahli dalam talian
- Pengesahan status keahlian secara digital
- Imbasan QR Code untuk pengesahan kehadiran
- Direktori ahli dengan carian

### 💰 Pengurusan Kewangan
- Yuran bulanan (RM5/ahli/bulan)
- Semakan status pembayaran
- Rekod pendapatan & perbelanjaan
- Laporan kewangan automatik

### 📅 Aktiviti & Acara
- Kalendar acara komuniti
- Pendaftaran aktiviti dalam talian
- Galeri foto aktiviti
- Notifikasi pengingat

### 🗳️ Sistem Undian
- Pengundian dalam talian
- Keputusan secara langsung
- Sejarah undian

### 📱 Aplikasi Mudah Alih
- **PWA** - Boleh install di telefon
- **Android App** - APK tersedia untuk muat turun
- Notifikasi push untuk pengumuman
- Imbasan QR tanpa peranti tambahan

### 🛡️ Keselamatan
- Autentikasi JWT dengan Supabase
- Peranan pengguna (Pengerusi, Setiausaha, Bendahari, AJK, Ahli)
- Pengesahan QR Code dengan enkripsi
- Audit log untuk aktiviti pentadbir

## Teknologi Digunakan

| Teknologi | Kegunaan |
|-----------|----------|
| **Vite** | Build tool & dev server |
| **React 18** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI components |
| **Supabase** | Database & Auth |
| **Capacitor** | Android app |
| **Framer Motion** | Animations |

## Keperluan Sistem

- **Node.js**: 18.0 atau lebih tinggi
- **npm**: 8.0 atau lebih tinggi
- **Android Studio**: Untuk build APK (pilihan)

## Panduan Pemasangan

### 1. Klon Repositori

```bash
git clone <URL_REPO>
cd persatuanukp1-main
```

### 2. Pasang Dependensi

```bash
npm install
```

### 3. Tetapkan Environment Variables

Cipta fail `.env` di root direktori:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:8080`

## Build untuk Pengeluaran

### Web (PWA)

```bash
npm run build
```

Output akan dijana dalam folder `dist/`.

### Android APK

```bash
# Build dan sync dengan Android
npm run build:android

# Buka dalam Android Studio
npm run android:open

# Atau build debug APK terus
npm run android:build:debug
```

Lihat `BUILD_INSTRUCTIONS.md` untuk panduan terperinci.

## Struktur Projek

```
persatuanukp1-main/
├── src/
│   ├── components/     # UI components
│   │   ├── ui/         # shadcn/ui components
│   │   ├── dashboard/  # Dashboard widgets
│   │   └── landing/    # Landing page sections
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities & constants
│   ├── integrations/   # Supabase client
│   └── assets/         # Static assets
├── android/            # Capacitor Android project
├── supabase/           # Database migrations
├── public/             # Public assets
├── dist/               # Build output
└── netlify.toml        # Netlify config
```

## Peranan Pengguna

| Peranan | Capaian |
|---------|---------|
| **Pengerusi** | Penuh - Urus ahli, kewangan, tetapan |
| **Setiausaha** | Urus ahli, buat pengumuman |
| **Bendahari** | Urus kewangan, yuran |
| **AJK** | Lihat laporan, bantu urusan |
| **Ahli** | Lihat profil, bayar yuran, sertai aktiviti |

## Keselamatan

- ✅ Strict TypeScript mode diaktifkan
- ✅ Content Security Policy (CSP) dikonfigurasi
- ✅ HTTPS enforcement
- ✅ Input sanitization
- ✅ XSS protection

## Deployment

### Netlify (Disyorkan)

1. Sambung repositori ke Netlify
2. Tetapkan build command: `npm run build`
3. Publish directory: `dist`
4. Konfigurasi dalam `netlify.toml` sedia ada

### Manual

```bash
# Build untuk pengeluaran
npm run build

# Upload folder dist/ ke hosting static
```

## Penyumbang

Dibangunkan untuk Persatuan Penduduk Taman Ukay Perdana UP1.

## Lesen

Hak Cipta © 2026 Persatuan UKP1. Semua hak terpelihara.
