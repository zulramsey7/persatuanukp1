import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import {
  ArrowLeft,
  Settings,
  Moon,
  Sun,
  Lock,
  LogOut,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  Loader2,
  BellOff,
  Info,
  Mail,
  MessageCircle,
  ExternalLink
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(6, "Kata laluan mesti sekurang-kurangnya 6 aksara"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Kata laluan tidak sepadan",
  path: ["confirmPassword"],
});

const Tetapan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut, profile } = useAuth();
  const { permission, requestPermission, isSupported } = useNotifications();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check current theme
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark" || 
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDarkMode(isDark);
    
    // Check notification status
    setNotificationsEnabled(permission === "granted");
  }, [permission]);

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
      const result = await requestPermission();
      setNotificationsEnabled(result === "granted");
    } else {
      setNotificationsEnabled(false);
      toast({
        title: "Info",
        description: "Notifikasi pelayar telah dinyahaktifkan. Sila semak tetapan pelayar anda untuk menyekat akses sepenuhnya.",
      });
    }
  };

  const toggleTheme = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validated = passwordSchema.parse(passwordForm);
      
      const { error } = await supabase.auth.updateUser({
        password: validated.password
      });

      if (error) throw error;

      toast({
        title: "Berjaya",
        description: "Kata laluan telah dikemaskini.",
      });
      setChangePasswordOpen(false);
      setPasswordForm({ password: "", confirmPassword: "" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Ralat",
          description: error.message || "Gagal mengemaskini kata laluan.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 pb-24">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Tetapan</h1>
            <p className="text-muted-foreground text-sm">Urus akaun dan aplikasi</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 space-y-6">
        {/* Account Settings */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">Akaun</h2>
          <FloatingCard className="p-0 overflow-hidden">
            <div className="divide-y divide-border">
              <button 
                onClick={() => navigate("/profil", { state: { from: "/tetapan" } })}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {profile?.nama_penuh?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{profile?.nama_penuh || "Pengguna"}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email || "Tiada emel"}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">Kata Laluan</p>
                        <p className="text-xs text-muted-foreground">Tukar kata laluan akaun</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tukar Kata Laluan</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Kata Laluan Baru</Label>
                      <Input
                        id="password"
                        type="password"
                        value={passwordForm.password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                      />
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Sahkan Kata Laluan</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="••••••••"
                      />
                      {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Mengemaskini...
                        </>
                      ) : "Simpan Kata Laluan"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </FloatingCard>
        </section>

        {/* App Settings */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">Aplikasi</h2>
          <FloatingCard className="p-0 overflow-hidden">
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Tema Gelap</p>
                    <p className="text-xs text-muted-foreground">Tukar penampilan aplikasi</p>
                  </div>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    notificationsEnabled 
                      ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Notifikasi Pelayar</p>
                    <p className="text-xs text-muted-foreground">
                      {isSupported 
                        ? (permission === "denied" ? "Akses disekat oleh pelayar" : "Terima notifikasi di skrin")
                        : "Tidak disokong pada pelayar ini"}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={notificationsEnabled} 
                  onCheckedChange={handleNotificationToggle}
                  disabled={!isSupported || permission === "denied"}
                />
              </div>
            </div>
          </FloatingCard>
        </section>

        {/* Support & About */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">Lain-lain</h2>
          <FloatingCard className="p-0 overflow-hidden">
            <div className="divide-y divide-border">
              {/* Privasi & Polisi Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">Privasi & Polisi</p>
                        <p className="text-xs text-muted-foreground">Bagaimana kami mengurus data anda</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] sm:max-w-[500px] h-[80vh] flex flex-col p-0">
                  <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Privasi & Polisi</DialogTitle>
                    <DialogDescription>Kemas kini terakhir: Mac 2026</DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="flex-1 p-6 pt-2">
                    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                      <section>
                        <h3 className="font-bold text-foreground mb-1">1. Pengenalan</h3>
                        <p>Persatuan Penduduk Taman Ukay Perdana (PPUP) komited untuk melindungi privasi data peribadi ahli kami mengikut Akta Perlindungan Data Peribadi 2010 (PDPA).</p>
                      </section>
                      <section>
                        <h3 className="font-bold text-foreground mb-1">2. Data yang Dikumpul</h3>
                        <p>Kami mengumpul maklumat yang anda berikan semasa mendaftar, termasuk:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>Nama penuh dan No. Kad Pengenalan</li>
                          <li>Alamat kediaman di Taman Ukay Perdana</li>
                          <li>No. telefon dan alamat emel</li>
                          <li>Maklumat ahli keluarga (untuk tujuan keselamatan)</li>
                        </ul>
                      </section>
                      <section>
                        <h3 className="font-bold text-foreground mb-1">3. Tujuan Pengumpulan</h3>
                        <p>Data anda digunakan untuk:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>Pengurusan keahlian dan rekod persatuan</li>
                          <li>Penghantaran notifikasi pengumuman penting</li>
                          <li>Sistem keselamatan QR dan kawalan akses</li>
                          <li>Pengurusan yuran dan laporan kewangan</li>
                        </ul>
                      </section>
                      <section>
                        <h3 className="font-bold text-foreground mb-1">4. Keselamatan Data</h3>
                        <p>Semua maklumat disimpan secara digital menggunakan infrastruktur awan yang selamat. Kami tidak akan menjual atau berkongsi maklumat anda kepada pihak ketiga tanpa kebenaran bertulis anda, kecuali jika diwajibkan oleh undang-undang.</p>
                      </section>
                      <section>
                        <h3 className="font-bold text-foreground mb-1">5. Hak Anda</h3>
                        <p>Anda mempunyai hak untuk mengakses, mengemas kini, atau memohon untuk memadamkan data peribadi anda melalui aplikasi ini atau dengan menghubungi setiausaha persatuan.</p>
                      </section>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              {/* Bantuan Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">Bantuan & FAQ</p>
                        <p className="text-xs text-muted-foreground">Soalan lazim dan sokongan</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] sm:max-w-[500px] h-[80vh] flex flex-col p-0">
                  <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Pusat Bantuan</DialogTitle>
                    <DialogDescription>Dapatkan jawapan pantas untuk soalan anda</DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="flex-1 p-6 pt-2">
                    <div className="space-y-6">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="faq-1">
                          <AccordionTrigger className="text-left text-sm font-medium">Bagaimana cara membayar yuran?</AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground">
                            Pergi ke Dashboard &gt; Kewangan. Anda boleh memuat naik resit pembayaran bank atau melakukan pembayaran terus (jika tersedia) melalui butang yang disediakan.
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="faq-2">
                          <AccordionTrigger className="text-left text-sm font-medium">Apa itu Kad Digital?</AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground">
                            Kad Digital adalah identiti ahli anda yang mengandungi kod QR unik. Ia digunakan untuk pengesahan masuk di pondok pengawal atau semasa acara persatuan.
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="faq-3">
                          <AccordionTrigger className="text-left text-sm font-medium">Bagaimana mengemas kini profil?</AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground">
                            Klik pada menu Tetapan, pilih profil anda di bahagian atas, dan tekan butang "Edit" untuk mengemas kini maklumat peribadi.
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="faq-4">
                          <AccordionTrigger className="text-left text-sm font-medium">Lupa kata laluan?</AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground">
                            Jika anda masih boleh log masuk, anda boleh tukar di bahagian Tetapan &gt; Kata Laluan. Jika tidak, sila hubungi admin untuk set semula kata laluan anda.
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      <div className="space-y-3">
                        <h3 className="font-bold text-sm text-foreground">Masih Perlukan Bantuan?</h3>
                        <div className="grid grid-cols-1 gap-2">
                          <Button variant="outline" className="justify-start gap-2 h-12" asChild>
                            <a href="https://wa.me/60173304906" target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="w-5 h-5 text-green-500" />
                              WhatsApp Sokongan (AJK)
                            </a>
                          </Button>
                          <Button variant="outline" className="justify-start gap-2 h-12" asChild>
                            <a href="mailto:persatuanukayperdana@gmail.com">
                              <Mail className="w-5 h-5 text-blue-500" />
                              Email Admin
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              {/* Tentang Kami Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Info className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">Tentang PPUP</p>
                        <p className="text-xs text-muted-foreground">Mengenai persatuan penduduk kami</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Mengenai PPUP</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="aspect-video rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                      <img 
                        src="placeholder.svg" 
                        alt="Taman Ukay Perdana" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Persatuan Penduduk Taman Ukay Perdana (PPUP) ditubuhkan untuk memupuk semangat kejiranan, menjaga kebajikan penduduk, serta memastikan keselamatan dan keselesaan komuniti kita sentiasa terjamin.
                    </p>
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Misi Kami</p>
                      <p className="text-sm italic">"Komuniti Harmoni, Keselamatan Terjamin, Kejiranan Bestari"</p>
                    </div>
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <a href="https://ukayperdana.netlify.app/" target="_blank" rel="noopener noreferrer">
                        Lawati Laman Web Rasmi
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </FloatingCard>
        </section>

        {/* Logout */}
        <Button 
          variant="destructive" 
          className="w-full h-12 rounded-xl mt-4"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Keluar
        </Button>

        <p className="text-center text-xs text-muted-foreground pt-4">
          Versi 1.0.0 • Persatuan Penduduk Ukay Perdana
        </p>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Tetapan;