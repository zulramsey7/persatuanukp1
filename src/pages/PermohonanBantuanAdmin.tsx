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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  MessageSquare,
  Trash2,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";

interface PermohonanBantuan {
  id: string;
  borang_id: string;
  user_id: string | null;
  status: string;
  catatan_admin: string | null;
  tarikh_mohon: string;
  tarikh_proses: string | null;
  nama_penuh: string | null;
  no_telefon: string | null;
  alamat: string | null;
  no_ic: string | null;
  borang: {
    id: string;
    tajuk: string;
    kategori: string;
  };
  profile?: {
    nama_penuh: string;
    no_rumah: string;
    no_telefon: string;
    email: string;
  };
}

const PermohonanBantuanAdmin = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [permohonanList, setPermohonanList] = useState<PermohonanBantuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPermohonan, setSelectedPermohonan] = useState<PermohonanBantuan | null>(null);
  const [processing, setProcessing] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    fetchPermohonan();
  }, [isAdmin, navigate]);

  const fetchPermohonan = async () => {
    try {
      const { data: permohonanData, error } = await supabase
        .from("permohonan_bantuan" as any)
        .select(`
          *,
          borang:borang_bantuan(id, tajuk, kategori)
        `)
        .order("tarikh_mohon", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately (only for members with user_id)
      const userIds = (permohonanData || [])
        .map((p: any) => p.user_id)
        .filter((id: string | null) => id !== null);
      
      const { data: profilesData } = await supabase
        .from("profiles" as any)
        .select("id, nama_penuh, no_rumah, no_telefon, email")
        .in("id", userIds);

      const profilesMap = new Map(
        (profilesData || []).map((p: any) => [p.id, p])
      );

      const permohonanWithProfiles = (permohonanData || []).map((p: any) => {
        // If it's a non-member (user_id is null), use the provided fields
        if (!p.user_id) {
          return {
            ...p,
            profile: {
              nama_penuh: p.nama_penuh || "Unknown",
              no_rumah: p.alamat || "-",
              no_telefon: p.no_telefon || "-",
              email: "-"
            }
          };
        }
        // Otherwise use the profile from the map
        return {
          ...p,
          profile: profilesMap.get(p.user_id) || {
            nama_penuh: "Unknown",
            no_rumah: "-",
            no_telefon: "-",
            email: "-"
          }
        };
      });

      setPermohonanList(permohonanWithProfiles as unknown as PermohonanBantuan[]);
    } catch (error) {
      console.error("Error fetching permohonan:", error);
      toast({
        title: "Ralat",
        description: "Gagal memuat senarai permohonan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const handleProcess = async (status: string) => {
    if (!selectedPermohonan) return;

    setProcessing(true);

    try {
      const { error } = await supabase
        .from("permohonan_bantuan" as any)
        .update({
          status,
          catatan_admin: catatan.trim() || null,
          tarikh_proses: new Date().toISOString()
        })
        .eq("id", selectedPermohonan.id);

      if (error) throw error;

      toast({
        title: "Berjaya",
        description: `Permohonan telah ${status === "diluluskan" ? "diluluskan" : status === "ditolak" ? "ditolak" : "dikemaskini"}`
      });

      setViewDialogOpen(false);
      setCatatan("");
      setSelectedPermohonan(null);
      fetchPermohonan();
    } catch (error) {
      console.error("Error processing permohonan:", error);
      toast({
        title: "Ralat",
        description: "Gagal mengemaskini permohonan",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPermohonan) return;

    setProcessing(true);

    try {
      const { error } = await supabase
        .from("permohonan_bantuan" as any)
        .delete()
        .eq("id", selectedPermohonan.id);

      if (error) throw error;

      toast({
        title: "Berjaya",
        description: "Permohonan telah dipadam"
      });

      setViewDialogOpen(false);
      setCatatan("");
      setSelectedPermohonan(null);
      fetchPermohonan();
    } catch (error) {
      console.error("Error deleting permohonan:", error);
      toast({
        title: "Ralat",
        description: "Gagal memadam permohonan",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleView = (permohonan: PermohonanBantuan) => {
    setSelectedPermohonan(permohonan);
    setCatatan(permohonan.catatan_admin || "");
    setViewDialogOpen(true);
  };

  const filteredList = filterStatus === "semua" 
    ? permohonanList 
    : permohonanList.filter(p => p.status === filterStatus);

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
                onClick={() => navigate("/borang-bantuan-admin")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                    Urus Permohonan Bantuan
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">
                    Lihat dan proses permohonan dari ahli
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-wrap">
              {["semua", "dalam_semakan", "diluluskan", "ditolak", "memerlukan_maklumat"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setFilterStatus(status)}
                >
                  {status === "semua" ? "Semua" : status.replace(/_/g, " ").toUpperCase()}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-2"
              onClick={() => {
                // Create CSV content
                const headers = ["No.", "Nama", "No. Telefon", "Alamat", "Status", "Tarikh Mohon"];
                const rows = filteredList.map((permohonan, index) => {
                  const nama = permohonan.profile?.nama_penuh || permohonan.nama_penuh || "-";
                  const telefon = permohonan.profile?.no_telefon || permohonan.no_telefon || "-";
                  const alamat = permohonan.profile?.no_rumah || permohonan.alamat || "-";
                  const status = permohonan.status.replace(/_/g, " ").toUpperCase();
                  const tarikh = format(new Date(permohonan.tarikh_mohon), "dd MMM yyyy, HH:mm", { locale: ms });
                  
                  return [
                    index + 1,
                    `"${nama}"`,
                    `"${telefon}"`,
                    `"${alamat}"`,
                    status,
                    `"${tarikh}"`
                  ].join(",");
                });
                
                const csvContent = [
                  headers.join(","),
                  ...rows
                ].join("\n");
                
                // Create download link
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `senarai-bantuan-${format(new Date(), "dd-MM-yyyy")}.csv`);
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              disabled={filteredList.length === 0}
            >
              <Download className="w-3 h-3" />
              Download CSV
            </Button>
          </div>
        </motion.div>

        {filteredList.length === 0 ? (
          <FloatingCard className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Tiada Permohonan</h3>
            <p className="text-sm text-muted-foreground/70">
              {filterStatus === "semua" ? "Tiada permohonan diterima." : `Tiada permohonan dengan status ${filterStatus}.`}
            </p>
          </FloatingCard>
        ) : (
          <div className="grid gap-4">
            {filteredList.map((permohonan, index) => (
              <motion.div
                key={permohonan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <FloatingCard className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(permohonan.status)}
                        <Badge variant="outline">{permohonan.borang?.kategori}</Badge>
                      </div>
                      <h3 className="text-base sm:text-xl font-semibold">{permohonan.borang?.tajuk}</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                        {permohonan.profile?.nama_penuh} - {permohonan.profile?.no_rumah}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => handleView(permohonan)}>
                      Lihat
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">{format(new Date(permohonan.tarikh_mohon), "dd MMM yyyy, HH:mm", { locale: ms })}</span>
                    </div>
                    {permohonan.tarikh_proses && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">Diproses: {format(new Date(permohonan.tarikh_proses), "dd MMM yyyy, HH:mm", { locale: ms })}</span>
                      </div>
                    )}
                  </div>
                </FloatingCard>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {isMobile && <MobileBottomNav />}

      {/* View/Process Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6">
          {selectedPermohonan && (
            <>
              <DialogHeader>
                <DialogTitle>Permohonan Bantuan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2 mb-4">
                  {getStatusBadge(selectedPermohonan.status)}
                  <Badge variant="outline">{selectedPermohonan.borang?.kategori}</Badge>
                </div>

                <FloatingCard className="p-4">
                  <h4 className="font-semibold mb-2">{selectedPermohonan.borang?.tajuk}</h4>
                  <p className="text-sm text-muted-foreground">
                    Tarikh Mohon: {format(new Date(selectedPermohonan.tarikh_mohon), "dd MMM yyyy, HH:mm", { locale: ms })}
                  </p>
                </FloatingCard>

                <FloatingCard className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Maklumat Pemohon
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nama:</span>
                      <span className="font-medium">{selectedPermohonan.profile?.nama_penuh}</span>
                    </div>
                    {!selectedPermohonan.user_id && selectedPermohonan.no_ic && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">No. IC:</span>
                        <span className="font-medium">{selectedPermohonan.no_ic}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">No. Telefon:</span>
                      <span className="font-medium">{selectedPermohonan.profile?.no_telefon || selectedPermohonan.no_telefon || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Alamat:</span>
                      <span className="font-medium">{selectedPermohonan.profile?.no_rumah || selectedPermohonan.alamat || "-"}</span>
                    </div>
                    {selectedPermohonan.user_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{selectedPermohonan.profile?.email}</span>
                      </div>
                    )}
                  </div>
                </FloatingCard>

                {selectedPermohonan.catatan_admin && (
                  <FloatingCard className="p-4 bg-muted/50">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Catatan Admin
                    </h4>
                    <p className="text-sm">{selectedPermohonan.catatan_admin}</p>
                  </FloatingCard>
                )}

                {selectedPermohonan.status === "dalam_semakan" && (
                  <div className="space-y-3 pt-4 border-t">
                    <Label htmlFor="catatan">Catatan Admin (Pilihan)</Label>
                    <Textarea
                      id="catatan"
                      placeholder="Masukkan catatan untuk pemohon..."
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleProcess("ditolak")}
                        disabled={processing}
                      >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                        Tolak
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => handleProcess("diluluskan")}
                        disabled={processing}
                      >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Luluskan
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleDelete}
                      disabled={processing}
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Padam Permohonan
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PermohonanBantuanAdmin;
