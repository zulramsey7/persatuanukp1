import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Send,
  XCircle,
  User
} from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";

interface BorangBantuan {
  id: string;
  tajuk: string;
  deskripsi: string | null;
  kategori: string;
  tarikh_mula: string;
  tarikh_tamat: string;
  status: string;
}

interface PermohonanBantuan {
  id: string;
  borang_id: string;
  user_id: string;
  status: string;
  catatan_admin: string | null;
  tarikh_mohon: string;
  tarikh_proses: string | null;
}


const BorangBantuan = () => {
  const { id } = useParams<{ id: string }>();
  const [borang, setBorang] = useState<BorangBantuan | null>(null);
  const [permohonan, setPermohonan] = useState<PermohonanBantuan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isNonMember, setIsNonMember] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    nama_penuh: "",
    no_telefon: "",
    alamat: "",
    no_ic: ""
  });
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (id) {
      fetchBorang(id);
      // Only check existing application if user is logged in
      if (user) {
        checkExistingApplication(id);
      }
    }
  }, [id, user, navigate]);

  const fetchBorang = async (borangId: string) => {
    try {
      const { data, error } = await supabase
        .from("borang_bantuan" as any)
        .select("*")
        .eq("id", borangId)
        .single();

      if (error) throw error;
      setBorang(data as unknown as BorangBantuan);
    } catch (error) {
      console.error("Error fetching borang:", error);
      toast({
        title: "Ralat",
        description: "Gagal memuat borang",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkExistingApplication = async (borangId: string) => {
    try {
      const { data, error } = await supabase
        .from("permohonan_bantuan" as any)
        .select("*")
        .eq("borang_id", borangId)
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 means no rows returned, which is expected
        console.error("Error checking application:", error);
      }

      if (data && !error) {
        setPermohonan(data as unknown as PermohonanBantuan);
      }
    } catch (error) {
      console.error("Error checking application:", error);
    }
  };


  const validateForm = () => {
    if (isNonMember) {
      if (!formData.nama_penuh.trim()) {
        toast({
          title: "Ralat",
          description: "Sila masukkan nama penuh",
          variant: "destructive"
        });
        return false;
      }
      if (!formData.no_telefon.trim()) {
        toast({
          title: "Ralat",
          description: "Sila masukkan no telefon",
          variant: "destructive"
        });
        return false;
      }
      if (!formData.alamat.trim()) {
        toast({
          title: "Ralat",
          description: "Sila masukkan alamat",
          variant: "destructive"
        });
        return false;
      }
      if (!formData.no_ic.trim()) {
        toast({
          title: "Ralat",
          description: "Sila masukkan no IC",
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const insertData: any = {
        borang_id: id,
        jawapan: {},
        status: "dalam_semakan"
      };

      if (isNonMember) {
        insertData.user_id = null;
        insertData.nama_penuh = formData.nama_penuh.trim();
        insertData.no_telefon = formData.no_telefon.trim();
        insertData.alamat = formData.alamat.trim();
        insertData.no_ic = formData.no_ic.trim();
      } else {
        insertData.user_id = user?.id;
      }

      const { error } = await supabase
        .from("permohonan_bantuan" as any)
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Berjaya",
        description: "Permohonan anda telah dihantar. Terima kasih!"
      });

      // Redirect to home page after successful submission
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Ralat",
        description: "Gagal menghantar permohonan",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "dalam_semakan":
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 gap-1"><Clock className="w-3 h-3" /> Dalam Semakan</Badge>;
      case "diluluskan":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1"><CheckCircle className="w-3 h-3" /> Diluluskan</Badge>;
      case "ditolak":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30 gap-1"><XCircle className="w-3 h-3" /> Ditolak</Badge>;
      case "memerlukan_maklumat":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 gap-1"><AlertCircle className="w-3 h-3" /> Memerlukan Maklumat</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isFormActive = () => {
    if (!borang) return false;
    // For now, just check status - date range check can be added later
    return borang.status === "aktif";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!borang) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 pb-24">
        <div className="px-4 pt-6">
          <Button variant="ghost" size="icon" className="rounded-full mb-4" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <FloatingCard className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Borang Tidak Dijumpai</h3>
            <p className="text-sm text-muted-foreground/70">
              Borang ini mungkin telah dipadam atau pautan tidak sah.
            </p>
          </FloatingCard>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {user && !isMobile && (
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      <main
        className={`min-h-screen transition-all duration-300 ${
          isMobile
            ? "px-4 pb-24 pt-6"
            : user && sidebarCollapsed
            ? "ml-20 p-8"
            : user && !sidebarCollapsed
            ? "ml-[280px] p-8"
            : "p-8"
        }`}
      >
        <header className="relative z-10 px-4 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => user ? navigate("/dashboard") : navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">Borang Bantuan</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">{borang.kategori}</p>
            </div>
          </div>
        </header>

        <div className="relative z-10 px-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FloatingCard className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">{borang.tajuk}</h2>
                {borang.deskripsi && (
                  <p className="text-sm sm:text-base text-muted-foreground">{borang.deskripsi}</p>
                )}
              </div>
              {getStatusBadge(borang.status)}
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">
                  {format(new Date(borang.tarikh_mula), "dd MMM yyyy", { locale: ms })} - {format(new Date(borang.tarikh_tamat), "dd MMM yyyy", { locale: ms })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Bantuan {borang.kategori}</span>
              </div>
            </div>
          </FloatingCard>
        </motion.div>

        {permohonan ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FloatingCard className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                {getStatusBadge(permohonan.status)}
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-4">Status Permohonan Anda</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Tarikh Mohon:</span>
                  <span className="font-medium">{format(new Date(permohonan.tarikh_mohon), "dd MMM yyyy, HH:mm", { locale: ms })}</span>
                </div>
                {permohonan.tarikh_proses && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Tarikh Proses:</span>
                    <span className="font-medium">{format(new Date(permohonan.tarikh_proses), "dd MMM yyyy, HH:mm", { locale: ms })}</span>
                  </div>
                )}
              </div>

              {permohonan.catatan_admin && (
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mt-4">
                  <p className="text-sm font-medium mb-1">Catatan Admin:</p>
                  <p className="text-sm text-muted-foreground">{permohonan.catatan_admin}</p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t">
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  Permohonan anda menggunakan maklumat profil ahli yang telah didaftarkan.
                </p>
              </div>
            </FloatingCard>
          </motion.div>
        ) : !isFormActive() ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FloatingCard className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Borang Tidak Aktif</h3>
              <p className="text-muted-foreground text-sm">
                {borang.status !== "aktif" 
                  ? "Borang ini telah ditamatkan oleh admin."
                  : "Borang ini belum bermula atau telah tamat tempoh."}
              </p>
            </FloatingCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FloatingCard className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Mohon Bantuan</h3>
              
              <div className="mb-6">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={!isNonMember ? "default" : "outline"}
                    className="flex-1 text-xs sm:text-sm"
                    onClick={() => setIsNonMember(false)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Ahli Berdaftar
                  </Button>
                  <Button
                    variant={isNonMember ? "default" : "outline"}
                    className="flex-1 text-xs sm:text-sm"
                    onClick={() => setIsNonMember(true)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Orang Luar
                  </Button>
                </div>

                {!isNonMember ? (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Permohonan ini akan menggunakan maklumat profil ahli anda yang telah didaftarkan.
                    Sila pastikan profil anda dikemaskini sebelum menghantar permohonan.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nama_penuh" className="text-xs sm:text-sm">Nama Penuh *</Label>
                      <Input
                        id="nama_penuh"
                        placeholder="Masukkan nama penuh"
                        value={formData.nama_penuh}
                        onChange={(e) => setFormData({ ...formData, nama_penuh: e.target.value })}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="no_telefon" className="text-xs sm:text-sm">No. Telefon *</Label>
                      <Input
                        id="no_telefon"
                        placeholder="Masukkan no. telefon"
                        value={formData.no_telefon}
                        onChange={(e) => setFormData({ ...formData, no_telefon: e.target.value })}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="no_ic" className="text-xs sm:text-sm">No. Kad Pengenalan *</Label>
                      <Input
                        id="no_ic"
                        placeholder="Masukkan no. kad pengenalan"
                        value={formData.no_ic}
                        onChange={(e) => setFormData({ ...formData, no_ic: e.target.value })}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alamat" className="text-xs sm:text-sm">Alamat *</Label>
                      <Textarea
                        id="alamat"
                        placeholder="Masukkan alamat penuh"
                        rows={3}
                        value={formData.alamat}
                        onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button
                className="w-full gap-2 text-sm"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menghantar...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Hantar Permohonan
                  </>
                )}
              </Button>
            </FloatingCard>
          </motion.div>
        )}
        </div>
      </main>

      {user && <MobileBottomNav />}
    </div>
  );
};

export default BorangBantuan;
