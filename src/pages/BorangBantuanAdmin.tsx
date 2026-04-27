import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Share2,
  FileText,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Copy,
  MessageCircle,
  Eye,
  Edit,
  X
} from "lucide-react";
import { format, addDays } from "date-fns";
import { ms } from "date-fns/locale";

interface BorangBantuan {
  id: string;
  tajuk: string;
  deskripsi: string | null;
  kategori: string;
  tarikh_mula: string;
  tarikh_tamat: string;
  status: string;
  created_at: string;
  _count?: {
    permohonan_bantuan: number;
  };
}

const KATEGORI_BANTUAN = [
  "Kewangan",
  "Perubatan",
  "Pendidikan",
  "Bencana",
  "Kebajikan",
  "Lain-lain"
];

const BorangBantuanAdmin = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [borangList, setBorangList] = useState<BorangBantuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedBorang, setSelectedBorang] = useState<BorangBantuan | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form state
  const [newBorang, setNewBorang] = useState({
    tajuk: "",
    deskripsi: "",
    kategori: "Kewangan",
    tarikh_mula: format(new Date(), "yyyy-MM-dd"),
    tarikh_tamat: format(addDays(new Date(), 30), "yyyy-MM-dd")
  });

  const isMobile = useIsMobile();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    fetchBorang();
  }, [isAdmin, navigate]);

  const fetchBorang = async () => {
    try {
      const { data, error } = await supabase
        .from("borang_bantuan" as any)
        .select(`
          *,
          permohonan_bantuan(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBorangList((data as unknown as BorangBantuan[]) || []);
    } catch (error) {
      console.error("Error fetching borang:", error);
      toast({
        title: "Ralat",
        description: "Gagal memuat senarai borang",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const handleCreate = async () => {
    if (!newBorang.tajuk.trim()) {
      toast({
        title: "Ralat",
        description: "Sila masukkan tajuk",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);

    try {
      const { error } = await supabase
        .from("borang_bantuan" as any)
        .insert({
          tajuk: newBorang.tajuk.trim(),
          deskripsi: newBorang.deskripsi.trim() || null,
          kategori: newBorang.kategori,
          soalan: [],
          tarikh_mula: new Date(newBorang.tarikh_mula).toISOString(),
          tarikh_tamat: new Date(newBorang.tarikh_tamat + "T23:59:59").toISOString(),
          status: "aktif",
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Berjaya",
        description: "Borang bantuan telah dicipta"
      });

      setCreateDialogOpen(false);
      resetForm();
      fetchBorang();
    } catch (error) {
      console.error("Error creating borang:", error);
      toast({
        title: "Ralat",
        description: "Gagal mencipta borang",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setNewBorang({
      tajuk: "",
      deskripsi: "",
      kategori: "Kewangan",
      tarikh_mula: format(new Date(), "yyyy-MM-dd"),
      tarikh_tamat: format(addDays(new Date(), 30), "yyyy-MM-dd")
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aktif":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1"><CheckCircle className="w-3 h-3" /> Aktif</Badge>;
      case "tamat":
        return <Badge className="bg-gray-500/20 text-gray-600 border-gray-500/30 gap-1"><XCircle className="w-3 h-3" /> Tamat</Badge>;
      case "draf":
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 gap-1"><Clock className="w-3 h-3" /> Draf</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const generateWhatsAppLink = (borang: BorangBantuan) => {
    const baseUrl = window.location.origin;
    const message = `Assalamualaikum, kami ingin memaklumkan bahawa terdapat bantuan ${borang.kategori} yang tersedia. Sila isi borang di: ${baseUrl}/borang-bantuan/${borang.id}`;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/?text=${encodedMessage}`;
  };

  const copyLink = (borang: BorangBantuan) => {
    const link = `${window.location.origin}/borang-bantuan/${borang.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Disalin",
      description: "Pautan borang telah disalin"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsApp = (borang: BorangBantuan) => {
    const link = generateWhatsAppLink(borang);
    window.open(link, "_blank");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Adakah anda pasti mahu memadam borang ini? Semua permohonan berkaitan juga akan dipadam.")) return;

    try {
      const { error } = await supabase
        .from("borang_bantuan" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Berjaya",
        description: "Borang telah dipadam"
      });
      fetchBorang();
    } catch (error) {
      console.error("Error deleting borang:", error);
      toast({
        title: "Ralat",
        description: "Gagal memadam borang",
        variant: "destructive"
      });
    }
  };

  const handleView = (borang: BorangBantuan) => {
    setSelectedBorang(borang);
    setViewDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {!isMobile && (
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      <main
        className={`min-h-screen transition-all duration-300 ${
          isMobile
            ? "px-4 pb-24 pt-6"
            : sidebarCollapsed
            ? "ml-20 p-8"
            : "ml-[280px] p-8"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                    Urus Borang Bantuan
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">
                    Cipta dan kongsi borang bantuan dengan ahli
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={() => navigate("/permohonan-bantuan-admin")}>
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Lihat Permohonan</span>
                <span className="sm:hidden">Permohonan</span>
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 flex-1 sm:flex-none">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Borang Baru</span>
                    <span className="sm:hidden">Baru</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Cipta Borang Bantuan Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="tajuk">Tajuk Borang *</Label>
                    <Input
                      id="tajuk"
                      placeholder="Contoh: Bantuan Kewangan Bulan Ramadhan"
                      value={newBorang.tajuk}
                      onChange={(e) => setNewBorang({ ...newBorang, tajuk: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deskripsi">Deskripsi</Label>
                    <Textarea
                      id="deskripsi"
                      placeholder="Terangkan tujuan borang ini..."
                      value={newBorang.deskripsi}
                      onChange={(e) => setNewBorang({ ...newBorang, deskripsi: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kategori">Kategori *</Label>
                      <Select value={newBorang.kategori} onValueChange={(val) => setNewBorang({ ...newBorang, kategori: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KATEGORI_BANTUAN.map(k => (
                            <SelectItem key={k} value={k}>{k}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tarikh_tamat">Tarikh Tamat *</Label>
                      <Input
                        id="tarikh_tamat"
                        type="date"
                        value={newBorang.tarikh_tamat}
                        min={format(new Date(), "yyyy-MM-dd")}
                        onChange={(e) => setNewBorang({ ...newBorang, tarikh_tamat: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setCreateDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Batal
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleCreate}
                      disabled={creating}
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Mencipta...
                        </>
                      ) : (
                        "Cipta Borang"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </motion.div>

        {borangList.length === 0 ? (
          <FloatingCard className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Tiada Borang Bantuan</h3>
            <p className="text-sm text-muted-foreground/70">
              Cipta borang bantuan pertama anda untuk kongsi dengan ahli.
            </p>
          </FloatingCard>
        ) : (
          <div className="grid gap-4">
            {borangList.map((borang, index) => (
              <motion.div
                key={borang.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <FloatingCard className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(borang.status)}
                        <Badge variant="outline">{borang.kategori}</Badge>
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold">{borang.tajuk}</h3>
                      {borang.deskripsi && (
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{borang.deskripsi}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleView(borang)} title="Lihat">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => copyLink(borang)} title="Salin Pautan">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => shareToWhatsApp(borang)} title="WhatsApp">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(borang.id)} title="Padam">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
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
            ))}
          </div>
        )}
      </main>

      {isMobile && <MobileBottomNav />}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          {selectedBorang && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedBorang.tajuk}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {selectedBorang.deskripsi && (
                  <p className="text-muted-foreground">{selectedBorang.deskripsi}</p>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => copyLink(selectedBorang)}>
                    <Copy className="w-4 h-4" />
                    Salin Pautan
                  </Button>
                  <Button className="flex-1 gap-2" onClick={() => shareToWhatsApp(selectedBorang)}>
                    <MessageCircle className="w-4 h-4" />
                    Hantar WhatsApp
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BorangBantuanAdmin;
