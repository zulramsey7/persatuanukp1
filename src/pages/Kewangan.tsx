import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Receipt,
  Calendar,
  Filter,
  Download,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Copy,
  CheckCheck,
  Banknote
} from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";

interface YuranBulanan {
  id: string;
  bulan: number;
  tahun: number;
  jumlah: number;
  status: string;
  tarikh_bayar: string | null;
  rujukan_bayaran: string | null;
  created_at: string;
}

interface YuranMasuk {
  id: string;
  jumlah: number;
  tarikh_bayar: string;
  status: string;
  rujukan_bayaran: string | null;
  created_at: string;
}

interface UserProfile {
  nama_penuh: string;
  email: string;
  no_telefon: string | null;
}

interface TransactionHistory {
  id: string;
  type: "yuran_bulanan" | "yuran_masuk";
  description: string;
  amount: number;
  status: string;
  date: string;
  reference: string | null;
  month?: number;
  year?: number;
}

const BULAN_NAMES = [
  "Jan", "Feb", "Mac", "Apr", "Mei", "Jun",
  "Jul", "Ogos", "Sep", "Okt", "Nov", "Dis"
];

const BULAN_FULL = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember"
];

const BANK_INFO = {
  name: "BANK RAKYAT",
  accountNo: "1102395072",
  accountName: "PERSATUAN PENDUDUK TAMAN UKAY PERDANA UP 1"
};

const YURAN_AMOUNT = 5;

type NormalizedPaymentStatus = "dibayar" | "pending" | "gagal" | "belum_bayar";

const normalizePaymentStatus = (status?: string | null): NormalizedPaymentStatus => {
  if (!status) return "belum_bayar";

  // Normalize older/newer status values used by admin & gateway flows
  if (status === "sudah_bayar" || status === "confirmed") return "dibayar";

  if (status === "dibayar" || status === "pending" || status === "gagal" || status === "belum_bayar") {
    return status;
  }

  return "belum_bayar";
};

const Kewangan = () => {
  const [yuranBulanan, setYuranBulanan] = useState<YuranBulanan[]>([]);
  const [yuranMasuk, setYuranMasuk] = useState<YuranMasuk[]>([]);
  const [allTransactions, setAllTransactions] = useState<TransactionHistory[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  
  // Filter states
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const availableYears = [currentYear, currentYear - 1, currentYear - 2];

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      toast({
        title: "Pembayaran Sedang Diproses",
        description: "Sila tunggu pengesahan daripada bank. Status akan dikemas kini.",
      });
      navigate("/kewangan", { replace: true });
    }
  }, [searchParams, toast, navigate]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let intervalId: number | null = null;
    let activeUserId: string | null = null;

    const refetch = () => {
      if (activeUserId) fetchData(activeUserId);
    };

    const onFocus = () => refetch();
    window.addEventListener("focus", onFocus);

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?mode=login");
        return;
      }

      activeUserId = session.user.id;
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("nama_penuh, email, no_telefon")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile) {
        setUserProfile(profile);
      }

      // Initial fetch + polling fallback (in case realtime is slow/unavailable)
      refetch();
      intervalId = window.setInterval(refetch, 30000);

      // Setup realtime subscription for auto-update when admin updates yuran
      channel = supabase
        .channel("kewangan-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "yuran_bulanan",
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            refetch();
            toast({
              title: "Status Yuran Dikemaskini",
              description: "Data yuran anda telah dikemaskini oleh admin.",
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "yuran_masuk",
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            refetch();
            toast({
              title: "Status Yuran Keahlian Dikemaskini",
              description: "Data yuran keahlian anda telah dikemaskini.",
            });
          }
        )
        .subscribe();
    };

    checkAuth();

    return () => {
      window.removeEventListener("focus", onFocus);
      if (intervalId) window.clearInterval(intervalId);
      if (channel) supabase.removeChannel(channel);
    };
  }, [navigate, toast]);

  const fetchData = async (uid: string) => {
    try {
      const [bulananRes, masukRes] = await Promise.all([
        supabase
          .from("yuran_bulanan")
          .select("*")
          .eq("user_id", uid)
          .order("tahun", { ascending: false })
          .order("bulan", { ascending: false }),
        supabase
          .from("yuran_masuk")
          .select("*")
          .eq("user_id", uid)
          .order("tarikh_bayar", { ascending: false })
      ]);

      if (bulananRes.error) throw bulananRes.error;
      if (masukRes.error) throw masukRes.error;

      const bulananRaw = bulananRes.data || [];
      const masukRaw = masukRes.data || [];

      const bulananData = bulananRaw.map((y) => ({
        ...y,
        status: normalizePaymentStatus(y.status),
      }));

      const masukData = masukRaw.map((y) => ({
        ...y,
        status: normalizePaymentStatus(y.status),
      }));
      
      setYuranBulanan(bulananData.filter(y => y.tahun === currentYear));
      setYuranMasuk(masukData);
      
      const transactions: TransactionHistory[] = [
        ...bulananData.map((item): TransactionHistory => ({
          id: item.id,
          type: "yuran_bulanan",
          description: `Yuran ${BULAN_FULL[item.bulan - 1]} ${item.tahun}`,
          amount: Number(item.jumlah),
          status: item.status,
          date: item.tarikh_bayar || item.created_at,
          reference: item.rujukan_bayaran,
          month: item.bulan,
          year: item.tahun
        })),
        ...masukData.map((item): TransactionHistory => ({
          id: item.id,
          type: "yuran_masuk",
          description: "Yuran Keahlian",
          amount: Number(item.jumlah),
          status: item.status,
          date: item.tarikh_bayar || item.created_at,
          reference: item.rujukan_bayaran
        }))
      ];
      
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setAllTransactions(transactions);
      setFilteredTransactions(transactions);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    let filtered = [...allTransactions];
    
    if (filterType !== "all") {
      filtered = filtered.filter(t => t.type === filterType);
    }
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    
    if (filterYear !== "all") {
      const year = parseInt(filterYear);
      filtered = filtered.filter(t => {
        const transactionYear = new Date(t.date).getFullYear();
        return transactionYear === year || t.year === year;
      });
    }
    
    setFilteredTransactions(filtered);
  }, [filterType, filterStatus, filterYear, allTransactions]);

  const exportTransactions = () => {
    const csvContent = [
      ["Tarikh", "Jenis", "Keterangan", "Jumlah (RM)", "Status", "Rujukan"].join(","),
      ...filteredTransactions.map(t => [
        format(new Date(t.date), "dd/MM/yyyy"),
        t.type === "yuran_bulanan" ? "Yuran Bulanan" : "Yuran Keahlian",
        t.description,
        t.amount.toFixed(2),
        getStatusLabel(t.status),
        t.reference || "-"
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transaksi_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
    
    toast({
      title: "Berjaya",
      description: "Fail CSV telah dimuat turun.",
    });
  };

  const handleMonthToggle = (bulan: number) => {
    setSelectedMonths(prev => 
      prev.includes(bulan) 
        ? prev.filter(m => m !== bulan)
        : [...prev, bulan].sort((a, b) => a - b)
    );
  };

  const selectAllUnpaidMonths = () => {
    const unpaidMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter(bulan => {
      const record = yuranBulanan.find(y => y.bulan === bulan);
      const status = record?.status || "belum_bayar";
      return status === "belum_bayar" || status === "gagal";
    });
    setSelectedMonths(unpaidMonths);
  };

  const clearSelection = () => {
    setSelectedMonths([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Disalin!",
      description: "No. akaun telah disalin ke clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "dibayar":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "gagal":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "dibayar": return "Dibayar";
      case "pending": return "Pending";
      case "gagal": return "Gagal";
      default: return "Belum Bayar";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "dibayar": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "gagal": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const totalDibayar = yuranBulanan.filter(y => y.status === "dibayar").reduce((acc, y) => acc + Number(y.jumlah), 0);
  const totalPending = yuranBulanan.filter(y => y.status === "pending").reduce((acc, y) => acc + Number(y.jumlah), 0);
  const paidMonths = yuranBulanan.filter(y => y.status === "dibayar").length;
  const totalBelumBayar = (12 - paidMonths) * YURAN_AMOUNT - totalPending;
  const totalSelectedAmount = selectedMonths.length * YURAN_AMOUNT;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-24">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full glass-card"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Kewangan</h1>
              <p className="text-muted-foreground text-sm">Yuran {currentYear}</p>
            </div>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            <Wallet className="w-3 h-3 mr-1" />
            RM {YURAN_AMOUNT}/bulan
          </Badge>
        </div>
      </header>

      <main className="relative z-10 px-4 space-y-5">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="glass-card rounded-2xl p-4 text-center border border-green-500/20">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-lg font-bold text-green-600">RM {totalDibayar.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Dibayar</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center border border-yellow-500/20">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-lg font-bold text-yellow-600">RM {totalPending.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center border border-red-500/20">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-lg font-bold text-red-600">RM {totalBelumBayar.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Tertunggak</p>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progres Bayaran {currentYear}</span>
            <span className="text-sm text-muted-foreground">{paidMonths}/12 bulan</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(paidMonths / 12) * 100}%` }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="bayar" className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass-card rounded-2xl p-1 h-auto">
            <TabsTrigger value="bayar" className="rounded-xl py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Bayar
            </TabsTrigger>
            <TabsTrigger value="status" className="rounded-xl py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Status
            </TabsTrigger>
            <TabsTrigger value="rekod" className="rounded-xl py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Rekod
            </TabsTrigger>
          </TabsList>

          {/* Bayar Tab */}
          <TabsContent value="bayar" className="mt-4 space-y-4">
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Pilih Bulan</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl text-xs"
                    onClick={selectAllUnpaidMonths}
                  >
                    Pilih Semua
                  </Button>
                  {selectedMonths.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-xl text-xs"
                      onClick={clearSelection}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              {/* Month Selection Grid */}
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((bulan) => {
                  const record = yuranBulanan.find(y => y.bulan === bulan);
                  const status = record?.status || "belum_bayar";
                  const isPaid = status === "dibayar";
                  const isPending = status === "pending";
                  const isSelected = selectedMonths.includes(bulan);
                  const canSelect = !isPaid && !isPending;
                  
                  return (
                    <motion.button
                      key={bulan}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: bulan * 0.03 }}
                      onClick={() => canSelect && handleMonthToggle(bulan)}
                      disabled={!canSelect}
                      className={`
                        relative p-3 rounded-xl text-center transition-all duration-200
                        ${isPaid 
                          ? "bg-green-500/10 border-2 border-green-500/30 cursor-not-allowed" 
                          : isPending
                            ? "bg-yellow-500/10 border-2 border-yellow-500/30 cursor-not-allowed"
                            : isSelected 
                              ? "bg-primary/20 border-2 border-primary shadow-lg scale-105" 
                              : "bg-muted/50 border-2 border-transparent hover:border-primary/50 hover:bg-muted"
                        }
                      `}
                    >
                      {isSelected && canSelect && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <CheckCheck className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      {isPaid && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {isPending && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Clock className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <p className={`font-medium text-sm ${isPaid ? "text-green-600" : isPending ? "text-yellow-600" : "text-foreground"}`}>
                        {BULAN_NAMES[bulan - 1]}
                      </p>
                      <p className={`text-xs ${isPaid ? "text-green-500" : isPending ? "text-yellow-500" : "text-muted-foreground"}`}>
                        RM {YURAN_AMOUNT}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Selected Amount Summary */}
            <AnimatePresence>
              {selectedMonths.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: 20, height: 0 }}
                  className="glass-card rounded-2xl p-4 border-2 border-primary/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Jumlah Dipilih</p>
                      <p className="text-2xl font-bold text-primary">RM {totalSelectedAmount.toFixed(2)}</p>
                    </div>
                    <Badge className="rounded-full bg-primary/10 text-primary border-primary/20">
                      {selectedMonths.length} bulan
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {selectedMonths.map(m => BULAN_NAMES[m - 1]).join(", ")} {currentYear}
                  </p>
                  <Button 
                    className="w-full rounded-xl gap-2 h-12"
                    onClick={() => setDialogOpen(true)}
                  >
                    <CreditCard className="w-5 h-5" />
                    Teruskan Pembayaran
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((bulan) => {
                const record = yuranBulanan.find(y => y.bulan === bulan);
                const status = record?.status || "belum_bayar";
                
                return (
                  <motion.div
                    key={bulan}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: bulan * 0.04 }}
                  >
                    <div className={`glass-card rounded-2xl p-4 border ${
                      status === "dibayar" ? "border-green-500/30" : 
                      status === "pending" ? "border-yellow-500/30" : 
                      "border-transparent"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{BULAN_FULL[bulan - 1]}</p>
                          <p className="text-xs text-muted-foreground">RM {YURAN_AMOUNT}.00</p>
                        </div>
                        <Badge className={`rounded-full text-xs ${getStatusColor(status)}`}>
                          {getStatusLabel(status)}
                        </Badge>
                      </div>
                      {record?.tarikh_bayar && status === "dibayar" && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Dibayar: {format(new Date(record.tarikh_bayar), "dd MMM yyyy")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Rekod Tab */}
          <TabsContent value="rekod" className="mt-4 space-y-4">
            {/* Filters */}
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tapis Rekod</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="rounded-xl text-xs h-9 bg-background">
                    <SelectValue placeholder="Jenis" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="yuran_bulanan">Bulanan</SelectItem>
                    <SelectItem value="yuran_masuk">Keahlian</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="rounded-xl text-xs h-9 bg-background">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="dibayar">Dibayar</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="belum_bayar">Belum</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="rounded-xl text-xs h-9 bg-background">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    <SelectItem value="all">Semua</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Export & Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">
                  {filteredTransactions.length} rekod
                </Badge>
                <Badge variant="outline" className="rounded-full text-green-600 border-green-300">
                  RM {filteredTransactions.filter(t => t.status === "dibayar").reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-2"
                onClick={exportTransactions}
                disabled={filteredTransactions.length === 0}
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
            </div>

            {/* Transaction List */}
            <div className="space-y-2">
              <AnimatePresence>
                {filteredTransactions.length === 0 ? (
                  <div className="glass-card rounded-2xl p-8 text-center">
                    <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Tiada rekod dijumpai</p>
                  </div>
                ) : (
                  filteredTransactions.slice(0, 20).map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="glass-card rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            transaction.type === "yuran_bulanan" 
                              ? "bg-blue-500/10" 
                              : "bg-purple-500/10"
                          }`}>
                            {transaction.type === "yuran_bulanan" ? (
                              <Calendar className="w-4 h-4 text-blue-500" />
                            ) : (
                              <CreditCard className="w-4 h-4 text-purple-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(transaction.date), "dd MMM yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${
                            transaction.status === "dibayar" ? "text-green-600" : "text-foreground"
                          }`}>
                            RM {transaction.amount.toFixed(2)}
                          </p>
                          <Badge className={`text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                            {getStatusLabel(transaction.status)}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bank Transfer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-center">Maklumat Bank Transfer</DialogTitle>
            <DialogDescription className="text-center">
              Jumlah: <span className="font-bold text-primary">RM {totalSelectedAmount.toFixed(2)}</span> ({selectedMonths.length} bulan)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="glass-card rounded-2xl p-4 bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{BANK_INFO.name}</p>
                  <p className="text-xs text-muted-foreground">Transfer ke akaun persatuan</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-background/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">No. Akaun</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-bold text-lg text-foreground">{BANK_INFO.accountNo}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 rounded-lg"
                      onClick={() => copyToClipboard(BANK_INFO.accountNo)}
                    >
                      {copied ? (
                        <CheckCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-background/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Nama Akaun</p>
                  <p className="font-medium text-sm text-foreground">{BANK_INFO.accountName}</p>
                </div>

                <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Jumlah Perlu Dibayar</p>
                  <p className="font-bold text-xl text-primary">RM {totalSelectedAmount.toFixed(2)}</p>
                </div>

                <div className="bg-background/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Bulan Dipilih</p>
                  <p className="font-medium text-sm text-foreground">
                    {selectedMonths.map(m => BULAN_NAMES[m - 1]).join(", ")} {currentYear}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20">
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                <strong>Nota:</strong> Sila WhatsApp bukti pembayaran kepada bendahari untuk pengesahan manual.
              </p>
            </div>

            <Button 
              className="w-full rounded-xl"
              onClick={() => setDialogOpen(false)}
            >
              Faham
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
    </div>
  );
};

export default Kewangan;
