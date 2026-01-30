import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Laporan from "./pages/Laporan";
import Kewangan from "./pages/Kewangan";
import Galeri from "./pages/Galeri";
import Kalendar from "./pages/Kalendar";
import Profil from "./pages/Profil";
import Notifikasi from "./pages/Notifikasi";
import Dokumen from "./pages/Dokumen";
import Undian from "./pages/Undian";
import Direktori from "./pages/Direktori";
import HubungiKami from "./pages/HubungiKami";
import Aduan from "./pages/Aduan";
import ImbasQR from "./pages/ImbasQR";
import Tetapan from "./pages/Tetapan";
import NotFound from "./pages/NotFound";

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
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
  }

  return (
    <BrowserRouter>
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </ErrorBoundary>
);

export default App;
