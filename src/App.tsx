import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NotificationListener } from "@/components/NotificationListener";
import { Skeleton } from "@/components/ui/skeleton";
import { lazy, Suspense } from "react";

// Lazy load pages for better performance (Code Splitting)
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Laporan = lazy(() => import("./pages/Laporan"));
const Kewangan = lazy(() => import("./pages/Kewangan"));
const Galeri = lazy(() => import("./pages/Galeri"));
const Kalendar = lazy(() => import("./pages/Kalendar"));
const Profil = lazy(() => import("./pages/Profil"));
const Notifikasi = lazy(() => import("./pages/Notifikasi"));
const Dokumen = lazy(() => import("./pages/Dokumen"));
const Undian = lazy(() => import("./pages/Undian"));
const Direktori = lazy(() => import("./pages/Direktori"));
const HubungiKami = lazy(() => import("./pages/HubungiKami"));
const Aduan = lazy(() => import("./pages/Aduan"));
const ImbasQR = lazy(() => import("./pages/ImbasQR"));
const Tetapan = lazy(() => import("./pages/Tetapan"));
const BorangBantuanAdmin = lazy(() => import("./pages/BorangBantuanAdmin"));
const BorangBantuan = lazy(() => import("./pages/BorangBantuan"));
const PermohonanBantuanAdmin = lazy(() => import("./pages/PermohonanBantuanAdmin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 p-4 bg-background">
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-8 w-48" />
    </div>
    <div className="w-full max-w-md space-y-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  </div>
);

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/laporan" element={<Laporan />} />
          <Route path="/imbas-qr" element={<ImbasQR />} />
          <Route path="/kewangan" element={<Kewangan />} />
          <Route path="/galeri" element={<Galeri />} />
          <Route path="/kalendar" element={<Kalendar />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/notifikasi" element={<Notifikasi />} />
          <Route path="/dokumen" element={<Dokumen />} />
          <Route path="/undian" element={<Undian />} />
          <Route path="/direktori" element={<Direktori />} />
          <Route path="/hubungi-kami" element={<HubungiKami />} />
          <Route path="/aduan" element={<Aduan />} />
          <Route path="/tetapan" element={<Tetapan />} />
          <Route path="/borang-bantuan-admin" element={<BorangBantuanAdmin />} />
          <Route path="/permohonan-bantuan-admin" element={<PermohonanBantuanAdmin />} />
          <Route path="/borang-bantuan/:id" element={<BorangBantuan />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <NotificationListener />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </ErrorBoundary>
);

export default App;
