import { useState, useEffect, useRef, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  QrCode, 
  Camera as CameraIcon, 
  User, 
  Home, 
  Phone, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ArrowLeft,
  Scan,
  AlertTriangle,
  Zap,
  ZapOff,
  History,
  Keyboard,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Camera as CapacitorCamera } from "@capacitor/camera";

interface MemberData {
  type: string;
  id: string;
  uuid?: string;
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

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-muted-foreground/5 transition-all hover:bg-muted/80">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-1">{label}</p>
        <p className="font-semibold text-sm truncate text-foreground">{value}</p>
      </div>
    </div>
  );
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
  
  // New features state
  const [torchOn, setTorchOn] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualId, setManualId] = useState("");
  const [isVerifyingManual, setIsVerifyingManual] = useState(false);
  const [scanHistory, setScanHistory] = useState<(ProfileData & { scannedAt: Date, memberId: string })[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Audio for beep (using base64 to avoid external assets)
  const beepRef = useRef<HTMLAudioElement | null>(null);
  
  // Layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Initialize beep sound
    const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFRm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YT9vT18AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
    audio.volume = 0.5;
    beepRef.current = audio;
  }, []);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, loading, navigate]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current = null;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
    setTorchOn(false);
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const playBeep = () => {
    if (beepRef.current) {
      // eslint-disable-next-line no-console
      beepRef.current.play().catch((e: unknown) => console.log('Audio play failed:', e));
    }
  };

  const startScanner = async () => {
    setError(null);
    setScannedData(null);
    setMemberProfile(null);
    setVerificationStatus("pending");
    setIsScanning(true);
    setShowManualEntry(false);

    try {
      if (Capacitor.isNativePlatform()) {
        try {
          const perm = await CapacitorCamera.checkPermissions();
          if (perm.camera !== "granted") {
            const res = await CapacitorCamera.requestPermissions();
            if (res.camera !== "granted") {
              setError("Akses kamera ditolak. Sila benarkan dalam tetapan peranti.");
              setIsScanning(false);
              return;
            }
          }
        } catch (e) {
          // Camera permission error silently handled
          // eslint-disable-next-line no-console
          console.error('Camera permission error:', e);
        }
      }
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.7);
            return {
              width: qrboxSize,
              height: qrboxSize
            };
          },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          playBeep();
          await handleScanSuccess(decodedText);
          await stopScanner();
        },
        () => {} // Silent on non-match
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error starting scanner:', err);
      setError('Tidak dapat mengakses kamera. Sila benarkan akses kamera.');
      setIsScanning(false);
      toast.error('Gagal mengakses kamera');
    }
  };

  const toggleTorch = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        const newState = !torchOn;
        await scannerRef.current.applyVideoConstraints({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          advanced: [{ torch: newState } as Record<string, unknown>]
        });
        setTorchOn(newState);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error toggling torch:', err);
        toast.error('Lampu suluh tidak disokong pada peranti ini');
      }
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;

    setIsVerifyingManual(true);
    setError(null);
    setVerificationStatus("pending");

    try {
      // Clean ID (e.g. 001 -> 1)
      const memberNum = manualId.padStart(3, '0');
      
      // Fetch all profiles to find by order (legacy) OR find by custom logic
      // Since we don't have a direct 'member_id' column, we use the sequential order as fallback
      const { data: profiles, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      const memberIndex = parseInt(manualId, 10) - 1;
      const profile = profiles && profiles[memberIndex];

      if (profile) {
        setMemberProfile(profile);
        setScannedData({
          type: "PPUP_MEMBER",
          id: memberNum,
          name: profile.nama_penuh,
          noRumah: profile.no_rumah,
          status: profile.status_ahli,
          verified: new Date().toISOString()
        });
        setVerificationStatus("valid");
        addToHistory(profile, memberNum);
        setShowManualEntry(false);
        toast.success("Ahli dijumpai!");
      } else {
        setError("Tiada ahli dijumpai dengan ID tersebut.");
        setVerificationStatus("invalid");
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Manual verify error:', err);
      setError('Gagal menyemak ID ahli.');
    } finally {
      setIsVerifyingManual(false);
    }
  };

  const addToHistory = (profile: ProfileData, memberId: string) => {
    setScanHistory(prev => {
      // Avoid duplicates in history
      const exists = prev.find(h => h.id === profile.id);
      if (exists) return prev;
      
      const newEntry = { ...profile, scannedAt: new Date(), memberId };
      return [newEntry, ...prev].slice(0, 10); // Keep last 10
    });
  };

  const handleScanSuccess = async (decodedText: string) => {
    try {
      const data: MemberData = JSON.parse(decodedText);
      
      if (data.type !== "PPUP_MEMBER") {
        setError("QR code tidak sah. Bukan kod ahli PPUP.");
        setVerificationStatus("invalid");
        toast.error("QR Code Tidak Sah");
        return;
      }

      setScannedData(data);

      // Verify member from database
      let profile = null;
      let fetchError = null;

      if (data.uuid) {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.uuid)
          .single();
          
        profile = profiles;
        fetchError = error;
      } else {
        // Fallback to legacy logic (sequential ID)
        const memberNumber = parseInt(data.id, 10);
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: true });
          
        if (!error && profiles) {
           profile = profiles[memberNumber - 1];
        }
        fetchError = error;
      }

      if (fetchError) {
        // eslint-disable-next-line no-console
        console.error('Error fetching profile:', fetchError);
        setError('Gagal mengesahkan ahli dari pangkalan data.');
        setVerificationStatus('invalid');
        return;
      }

      // Check if profile exists and name matches
      if (profile && profile.nama_penuh === data.name) {
        setMemberProfile(profile);
        setVerificationStatus("valid");
        addToHistory(profile, data.id);
        toast.success("Pengesahan Berjaya");
      } else {
        setError("Maklumat ahli tidak sepadan dengan rekod.");
        setVerificationStatus("invalid");
        toast.error("Maklumat Tidak Sepadan");
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error parsing QR data:', err);
      setError('Format QR code tidak dikenali.');
      setVerificationStatus('invalid');
      toast.error('Format QR Tidak Sah');
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
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Imbas QR Ahli</h1>
                    <p className="text-muted-foreground">Pengesahan keahlian secara pantas</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowHistory(!showHistory)}
                    className={showHistory ? "bg-primary/10 text-primary border-primary/50" : ""}
                    title="Sejarah Imbasan"
                  >
                    <History className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setShowManualEntry(!showManualEntry);
                      if (isScanning) stopScanner();
                    }}
                    className={showManualEntry ? "bg-primary/10 text-primary border-primary/50" : ""}
                    title="Kemasukan Manual"
                  >
                    <Keyboard className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* History List */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Sejarah Imbasan Sesi Ini
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 pb-4">
                      {scanHistory.length === 0 ? (
                        <p className="text-center py-4 text-sm text-muted-foreground">Tiada sejarah imbasan lagi</p>
                      ) : (
                        <div className="space-y-1">
                          {scanHistory.map((item) => (
                            <div 
                              key={item.id} 
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => {
                                setMemberProfile(item);
                                setScannedData({
                                  type: "PPUP_MEMBER",
                                  id: item.memberId,
                                  name: item.nama_penuh,
                                  noRumah: item.no_rumah,
                                  status: item.status_ahli,
                                  verified: item.scannedAt.toISOString()
                                });
                                setVerificationStatus("valid");
                                setShowHistory(false);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{item.nama_penuh}</p>
                                  <p className="text-xs text-muted-foreground">ID: {item.memberId} • {item.no_rumah}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-muted-foreground">
                                  {item.scannedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <Badge variant="outline" className="text-[10px] h-4 px-1">Sah</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Manual Entry */}
            <AnimatePresence>
              {showManualEntry && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-6"
                >
                  <Card className="border-primary/20 shadow-lg">
                    <CardHeader className="bg-primary/5 py-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Keyboard className="w-5 h-5 text-primary" />
                        Carian Ahli Secara Manual
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <form onSubmit={handleManualVerify} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="manual-id">Nombor ID Ahli (cth: 1, 5, 12)</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="manual-id"
                                placeholder="Masukkan ID Ahli..."
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                                className="pl-10"
                                type="number"
                                autoFocus
                              />
                            </div>
                            <Button type="submit" disabled={isVerifyingManual || !manualId.trim()}>
                              {isVerifyingManual ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                "Cari Ahli"
                              )}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Gunakan fungsi ini jika QR code tidak dapat diimbas atau rosak.
                        </p>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scanner Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="overflow-hidden border-2 border-primary/5">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-blue-500/5 to-primary/10 py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CameraIcon className="w-5 h-5 text-primary" />
                      Pengimbas QR Code
                    </CardTitle>
                    {isScanning && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleTorch}
                        className="h-8 gap-2 bg-background/50 backdrop-blur-sm"
                      >
                        {torchOn ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                        {torchOn ? "Lampu Mati" : "Lampu Hidup"}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                  {!isScanning && !scannedData && !error && (
                    <div className="text-center py-16 px-6">
                      <div className="relative w-32 h-32 mx-auto mb-8">
                        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-25" />
                        <div className="relative w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                          <Scan className="w-16 h-16 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Sedia untuk Mengimbas</h3>
                      <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                        Halakan kamera peranti anda ke arah QR Code pada Kad Ahli Digital untuk pengesahan pantas.
                      </p>
                      <Button onClick={startScanner} size="lg" className="gap-3 px-8 h-12 rounded-xl shadow-lg shadow-primary/20">
                        <CameraIcon className="w-5 h-5" />
                        Mula Imbasan
                      </Button>
                    </div>
                  )}

                  {/* QR Scanner Container */}
                  <div className="relative">
                    <div 
                      id={scannerContainerId} 
                      className={`overflow-hidden transition-all duration-500 ${isScanning ? 'h-[350px] sm:h-[400px] opacity-100' : 'h-0 opacity-0'}`}
                    />
                    
                    {/* Scanner Overlay */}
                    {isScanning && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-[250px] h-[250px] border-2 border-primary/50 rounded-2xl relative">
                          {/* Corner Markers */}
                          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                          
                          {/* Scanning Line */}
                          <motion.div 
                            className="absolute left-0 right-0 h-1 bg-primary/60 shadow-[0_0_15px_rgba(var(--primary),0.8)]"
                            animate={{ top: ["5%", "95%", "5%"] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {isScanning && (
                    <div className="p-6 bg-muted/30 border-t flex flex-col items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-primary font-medium animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        Mencari QR Code...
                      </div>
                      <Button variant="outline" onClick={stopScanner} className="w-full sm:w-auto px-12">
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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-6"
                >
                  <Card className="border-emerald-500/50 bg-emerald-500/5 overflow-hidden shadow-xl shadow-emerald-500/10">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white relative overflow-hidden">
                      {/* Decorative background circle */}
                      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                      
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl tracking-tight">Ahli Disahkan</h3>
                          <p className="text-emerald-100 text-sm opacity-90">Rekod keahlian ditemui & aktif</p>
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        {/* Member ID Header */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-muted-foreground/10">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">ID Keahlian</p>
                            <p className="font-mono text-2xl font-black text-primary">
                              {scannedData?.id}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Status</p>
                            <Badge 
                              className={memberProfile.status_ahli === "active" 
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white px-3" 
                                : "bg-amber-500 hover:bg-amber-600 text-white px-3"}
                            >
                              {memberProfile.status_ahli === "active" ? "AKTIF" : "MENUNGGU"}
                            </Badge>
                          </div>
                        </div>

                        {/* Detailed Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <InfoItem 
                            icon={<User className="w-4 h-4" />} 
                            label="Nama Penuh" 
                            value={memberProfile.nama_penuh} 
                          />
                          <InfoItem 
                            icon={<Home className="w-4 h-4" />} 
                            label="No. Rumah" 
                            value={memberProfile.no_rumah} 
                          />
                          <InfoItem 
                            icon={<Phone className="w-4 h-4" />} 
                            label="No. Telefon" 
                            value={memberProfile.no_telefon || "Tiada Maklumat"} 
                          />
                          <InfoItem 
                            icon={<Shield className="w-4 h-4" />} 
                            label="Ahli Sejak" 
                            value={new Date(memberProfile.created_at).toLocaleDateString('ms-MY', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })} 
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                          <Button onClick={resetScanner} className="flex-1 h-12 gap-2 shadow-lg shadow-primary/20">
                            <RefreshCw className="w-4 h-4" />
                            Imbas Seterusnya
                          </Button>
                        </div>
                      </div>
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
