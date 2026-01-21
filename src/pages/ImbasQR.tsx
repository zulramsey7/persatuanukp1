import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSideMenu, MobileBottomNav } from "@/components/dashboard/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  QrCode, 
  Camera, 
  User, 
  Home, 
  Phone, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ArrowLeft,
  Scan,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MemberData {
  type: string;
  id: string;
  name: string;
  noRumah: string;
  status: string;
  verified: string;
}

interface ProfileData {
  id: string;
  nama_penuh: string;
  no_rumah: string;
  no_telefon: string | null;
  email: string;
  status_ahli: string;
  avatar_url: string | null;
  created_at: string;
}

export default function ImbasQR() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<MemberData | null>(null);
  const [memberProfile, setMemberProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "valid" | "invalid">("pending");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader";
  
  // Layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setError(null);
    setScannedData(null);
    setMemberProfile(null);
    setVerificationStatus("pending");

    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await handleScanSuccess(decodedText);
          stopScanner();
        },
        () => {}
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError("Tidak dapat mengakses kamera. Sila benarkan akses kamera.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
  };

  const handleScanSuccess = async (decodedText: string) => {
    try {
      const data: MemberData = JSON.parse(decodedText);
      
      if (data.type !== "PPUP_MEMBER") {
        setError("QR code tidak sah. Bukan kod ahli PPUP.");
        setVerificationStatus("invalid");
        return;
      }

      setScannedData(data);

      // Verify member from database
      const memberNumber = parseInt(data.id, 10);
      const { data: profiles, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        setError("Gagal mengesahkan ahli dari pangkalan data.");
        setVerificationStatus("invalid");
        return;
      }

      // Find member by sequential number
      const profile = profiles?.[memberNumber - 1];

      if (profile && profile.nama_penuh === data.name) {
        setMemberProfile(profile);
        setVerificationStatus("valid");
      } else {
        setError("Maklumat ahli tidak sepadan dengan rekod.");
        setVerificationStatus("invalid");
      }
    } catch (err) {
      console.error("Error parsing QR data:", err);
      setError("Format QR code tidak dikenali.");
      setVerificationStatus("invalid");
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setMemberProfile(null);
    setError(null);
    setVerificationStatus("pending");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block">
        <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>
      
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
        <DashboardHeader 
          onMenuToggle={() => setMobileMenuOpen(true)} 
          showMenu={mobileMenuOpen}
          unreadNotifications={0}
          isDarkMode={isDarkMode}
          onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        />
        <MobileSideMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Button
                variant="ghost"
                onClick={() => navigate("/admin")}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Admin
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Imbas QR Ahli</h1>
                  <p className="text-muted-foreground">Pengesahan keahlian secara pantas</p>
                </div>
              </div>
            </motion.div>

            {/* Scanner Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Pengimbas QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {!isScanning && !scannedData && !error && (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Scan className="w-12 h-12 text-primary" />
                      </div>
                      <p className="text-muted-foreground mb-6">
                        Tekan butang di bawah untuk mula mengimbas QR code Kad Ahli Digital
                      </p>
                      <Button onClick={startScanner} size="lg" className="gap-2">
                        <Camera className="w-5 h-5" />
                        Mula Imbas
                      </Button>
                    </div>
                  )}

                  {/* QR Scanner Container */}
                  <div 
                    id={scannerContainerId} 
                    className={`rounded-xl overflow-hidden ${isScanning ? 'block' : 'hidden'}`}
                  />

                  {isScanning && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Halakan kamera ke QR code pada Kad Ahli Digital
                      </p>
                      <Button variant="outline" onClick={stopScanner}>
                        Batal Imbasan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Error State */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-6"
                >
                  <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                          <XCircle className="w-6 h-6 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-destructive mb-1">Pengesahan Gagal</h3>
                          <p className="text-sm text-muted-foreground">{error}</p>
                        </div>
                      </div>
                      <Button onClick={resetScanner} variant="outline" className="w-full mt-4">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Cuba Lagi
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verification Result */}
            <AnimatePresence>
              {verificationStatus === "valid" && memberProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-6"
                >
                  <Card className="border-emerald-500/50 bg-emerald-500/5 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-8 h-8" />
                        <div>
                          <h3 className="font-bold text-lg">Ahli Disahkan</h3>
                          <p className="text-emerald-100 text-sm">Keahlian adalah sah dan aktif</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      {/* Member Info */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b">
                          <span className="text-sm text-muted-foreground">No. Ahli</span>
                          <span className="font-mono font-bold text-lg">
                            {scannedData?.id}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <User className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Nama Penuh</p>
                              <p className="font-medium">{memberProfile.nama_penuh}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Home className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">No. Rumah</p>
                              <p className="font-medium">{memberProfile.no_rumah}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Phone className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">No. Telefon</p>
                              <p className="font-medium">{memberProfile.no_telefon || "-"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Shield className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Status Keahlian</p>
                              <Badge 
                                variant={memberProfile.status_ahli === "active" ? "default" : "secondary"}
                                className={memberProfile.status_ahli === "active" ? "bg-emerald-500" : ""}
                              >
                                {memberProfile.status_ahli === "active" ? "Aktif" : 
                                 memberProfile.status_ahli === "pending" ? "Menunggu" : "Tidak Aktif"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <p className="text-xs text-muted-foreground text-center">
                            Ahli sejak {new Date(memberProfile.created_at).toLocaleDateString('ms-MY', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <Button onClick={resetScanner} className="w-full mt-6">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Imbas Ahli Lain
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Panduan Penggunaan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                      <span>Minta ahli untuk membuka Kad Ahli Digital di aplikasi mereka</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                      <span>Tekan butang "Mula Imbas" dan halakan kamera ke QR code</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                      <span>Sistem akan mengesahkan keahlian secara automatik</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
        
        <MobileBottomNav />
      </div>
    </div>
  );
}
