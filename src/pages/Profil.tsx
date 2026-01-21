import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Home,
  Edit,
  LogOut,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  CreditCard
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  pengerusi: "Pengerusi",
  naib_pengerusi: "Naib Pengerusi",
  setiausaha: "Setiausaha",
  penolong_setiausaha: "Penolong Setiausaha",
  bendahari: "Bendahari",
  ajk: "Ahli Jawatankuasa",
  ahli: "Ahli"
};

const Profil = () => {
  const { user, profile, roles, loading, signOut, refreshProfile } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nama_penuh: "",
    no_telefon: "",
    no_rumah: ""
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?mode=login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        nama_penuh: profile.nama_penuh || "",
        no_telefon: profile.no_telefon || "",
        no_rumah: profile.no_rumah || ""
      });
    }
  }, [profile]);

  const handleBack = () => {
    const from = (location.state as any)?.from;
    if (from === "/tetapan") {
      navigate("/tetapan");
    } else {
      navigate("/dashboard");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nama_penuh: formData.nama_penuh.trim(),
          no_telefon: formData.no_telefon.trim() || null,
          no_rumah: formData.no_rumah.trim()
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Profil telah dikemaskini.",
      });

      setEditDialogOpen(false);
      await refreshProfile();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Ralat",
        description: "Gagal menyimpan profil.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Log Keluar Berjaya",
      description: "Sehingga jumpa lagi!",
    });
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Aktif
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-600 text-sm font-medium">
            <Clock className="w-4 h-4" />
            Menunggu Pengesahan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-600 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Tidak Aktif
          </span>
        );
    }
  };

  const isAdmin = roles.some(r => ["pengerusi", "bendahari", "ajk"].includes(r.role));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 pb-24">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={handleBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Profil Saya</h1>
            <p className="text-muted-foreground text-sm">Urus maklumat peribadi</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 space-y-4">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FloatingCard className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{profile?.nama_penuh || "Nama Tidak Ditetapkan"}</h2>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {roles.length > 0 ? roles.map((r, i) => (
                      <span 
                        key={i} 
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
                      >
                        <Shield className="w-3 h-3" />
                        {ROLE_LABELS[r.role]}
                      </span>
                    )) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        <UserIcon className="w-3 h-3" />
                        Ahli
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Edit className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl">
                  <DialogHeader>
                    <DialogTitle>Edit Profil</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="nama">Nama Penuh</Label>
                      <Input
                        id="nama"
                        value={formData.nama_penuh}
                        onChange={(e) => setFormData({ ...formData, nama_penuh: e.target.value })}
                        className="rounded-xl mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefon">No. Telefon</Label>
                      <Input
                        id="telefon"
                        value={formData.no_telefon}
                        onChange={(e) => setFormData({ ...formData, no_telefon: e.target.value })}
                        placeholder="012-3456789"
                        className="rounded-xl mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rumah">No. Rumah</Label>
                      <Input
                        id="rumah"
                        value={formData.no_rumah}
                        onChange={(e) => setFormData({ ...formData, no_rumah: e.target.value })}
                        placeholder="123"
                        className="rounded-xl mt-1"
                      />
                    </div>
                    <Button 
                      onClick={handleSaveProfile} 
                      className="w-full rounded-xl"
                      disabled={saving || !formData.nama_penuh.trim() || !formData.no_rumah.trim()}
                    >
                      {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status Keahlian</span>
              {profile && getStatusBadge(profile.status_ahli)}
            </div>
          </FloatingCard>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <FloatingCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground truncate">{profile?.email || "-"}</p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">No. Telefon</p>
                <p className="font-medium text-foreground">{profile?.no_telefon || "-"}</p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Home className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">No. Rumah</p>
                <p className="font-medium text-foreground">{profile?.no_rumah || "-"}</p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">No. Ahli</p>
                <p className="font-bold text-foreground text-lg font-mono">
                  {(profile?.member_number || profile?.no_ahli) ? String(profile?.member_number || profile?.no_ahli).padStart(5, '0') : "-"}
                </p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Ahli Sejak</p>
                <p className="font-medium text-foreground">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ms-MY', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : "-"}
                </p>
              </div>
            </div>
          </FloatingCard>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 pt-2"
        >
          {isAdmin && (
            <Button
              variant="outline"
              className="w-full rounded-2xl h-12 justify-start gap-3"
              onClick={() => navigate("/admin")}
            >
              <Settings className="w-5 h-5" />
              Panel Admin
            </Button>
          )}

          <Button
            variant="destructive"
            className="w-full rounded-2xl h-12 justify-start gap-3"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Log Keluar
          </Button>
        </motion.div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Profil;
