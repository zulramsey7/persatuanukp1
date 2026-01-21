import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileText
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Define the interface based on standard complaint structure
interface Aduan {
  id: string;
  tajuk: string;
  deskripsi: string;
  kategori: string;
  status: "baru" | "dalam_tindakan" | "selesai" | "ditolak";
  created_at: string;
  user_id: string;
  jawapan?: string;
}

const CATEGORIES = [
  "Infrastruktur (Jalan/Lampu)",
  "Kebersihan/Sampah",
  "Keselamatan",
  "Gangguan Bunyi/Haiwan",
  "Cadangan",
  "Lain-lain"
];

const Aduan = () => {
  const [aduanList, setAduanList] = useState<Aduan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tajuk: "",
    deskripsi: "",
    kategori: ""
  });
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth?mode=login");
      return;
    }
    fetchAduan();
  }, [user, navigate]);

  const fetchAduan = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("aduan")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        // If table doesn't exist, we might get an error. 
        // We'll log it but not crash the app.
        console.error("Error fetching aduan:", error);
        // Fallback or empty list
        setAduanList([]); 
      } else {
        setAduanList((data as any) || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.tajuk || !formData.deskripsi || !formData.kategori) {
      toast({
        title: "Sila lengkapkan borang",
        description: "Semua ruangan wajib diisi.",
        variant: "destructive"
      });
      return;
    }

    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from("aduan")
        .insert({
          user_id: user?.id,
          tajuk: formData.tajuk,
          deskripsi: formData.deskripsi,
          kategori: formData.kategori,
          status: "baru"
        });

      if (error) throw error;

      toast({
        title: "Aduan Dihantar",
        description: "Pihak kami akan menyemak aduan anda secepat mungkin.",
      });

      setDialogOpen(false);
      setFormData({ tajuk: "", deskripsi: "", kategori: "" });
      fetchAduan();
    } catch (error) {
      console.error("Error submitting aduan:", error);
      toast({
        title: "Gagal Menghantar",
        description: "Sila cuba lagi nanti atau hubungi pentadbir.",
        variant: "destructive"
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "baru":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
            <Clock className="w-3 h-3 mr-1" /> Baru
          </Badge>
        );
      case "dalam_tindakan":
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
            <AlertCircle className="w-3 h-3 mr-1" /> Dalam Tindakan
          </Badge>
        );
      case "selesai":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" /> Selesai
          </Badge>
        );
      case "ditolak":
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
            <XCircle className="w-3 h-3 mr-1" /> Ditolak
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 pb-24">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
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
              <h1 className="text-xl font-bold text-foreground">Aduan & Cadangan</h1>
              <p className="text-muted-foreground text-sm">
                Suarakan pandangan anda
              </p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-lg bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Aduan Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>Buat Aduan Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select 
                    value={formData.kategori} 
                    onValueChange={(val) => setFormData({...formData, kategori: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori aduan" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tajuk</Label>
                  <Input 
                    placeholder="Contoh: Lampu Jalan Rosak" 
                    value={formData.tajuk}
                    onChange={(e) => setFormData({...formData, tajuk: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Butiran</Label>
                  <Textarea 
                    placeholder="Sila nyatakan lokasi dan perincian masalah..." 
                    className="min-h-[100px]"
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={submitLoading}
                >
                  {submitLoading ? "Sedang Menghantar..." : "Hantar Aduan"}
                  {!submitLoading && <Send className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 px-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"
            />
            <p className="text-muted-foreground text-sm">Memuat turun data...</p>
          </div>
        ) : aduanList.length === 0 ? (
          <FloatingCard className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Tiada Aduan</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Anda belum membuat sebarang aduan. Tekan butang di atas untuk membuat aduan baru.
            </p>
          </FloatingCard>
        ) : (
          <div className="grid gap-4">
            {aduanList.map((aduan, index) => (
              <motion.div
                key={aduan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <FloatingCard className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          {aduan.kategori}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(aduan.created_at).toLocaleDateString('ms-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg leading-tight">{aduan.tajuk}</h3>
                    </div>
                    {getStatusBadge(aduan.status)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {aduan.deskripsi}
                  </p>

                  {aduan.jawapan && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm mt-3 border border-border/50">
                      <div className="flex items-center gap-2 mb-1 text-primary font-medium text-xs uppercase tracking-wide">
                        <MessageSquare className="w-3 h-3" />
                        Maklum Balas Admin
                      </div>
                      <p className="text-foreground/90">{aduan.jawapan}</p>
                    </div>
                  )}
                </FloatingCard>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Aduan;
