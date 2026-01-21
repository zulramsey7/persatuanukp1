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
  Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
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
  }, []);

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
                  <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Notifikasi</p>
                    <p className="text-xs text-muted-foreground">Terima notifikasi terkini</p>
                  </div>
                </div>
                <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>
            </div>
          </FloatingCard>
        </section>

        {/* Support & About */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">Lain-lain</h2>
          <FloatingCard className="p-0 overflow-hidden">
            <div className="divide-y divide-border">
              <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Privasi & Polisi</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Bantuan</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
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