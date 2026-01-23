import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  PieChart,
  Filter,
  Search,
  RefreshCw,
  Clock,
  Receipt,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";
import { Database } from "@/integrations/supabase/types";

// Types
type IncomeItem = {
  id: string;
  user_id: string;
  jumlah: number;
  tarikh_bayar: string;
  status: string;
  rujukan_bayaran: string | null;
  jenis: "yuran_bulanan";
  bulan?: number;
  tahun?: number;
  user_name?: string;
  user_no_rumah?: string;
};

type YuranKeluar = Database["public"]["Tables"]["yuran_keluar"]["Row"];
type KategoriBelanja = Database["public"]["Enums"]["kategori_belanja"];

type PendingPayment = {
  id: string;
  user_id: string;
  jumlah: number;
  tarikh_bayar: string | null;
  status: string;
  rujukan_bayaran: string | null;
  bulan?: number;
  tahun?: number;
  jenis: "yuran_bulanan";
  user_name: string;
  user_no_rumah: string;
};

type DanaMasuk = {
  id: string;
  tajuk: string;
  jumlah: number;
  sumber: string;
  deskripsi: string | null;
  tarikh: string;
  bukti_url: string | null;
  created_by: string | null;
  created_at: string;
};

const kategoriOptions: { value: KategoriBelanja; label: string; color: string }[] = [
  { value: "penyelenggaraan", label: "🔧 Penyelenggaraan", color: "bg-blue-500" },
  { value: "aktiviti", label: "🎉 Aktiviti", color: "bg-purple-500" },
  { value: "kebajikan", label: "❤️ Kebajikan", color: "bg-pink-500" },
  { value: "lain-lain", label: "📋 Lain-lain", color: "bg-gray-500" },
];

const sumberOptions = [
  { value: "derma", label: "💝 Derma" },
  { value: "sumbangan", label: "🎁 Sumbangan" },
  { value: "penaja", label: "🏢 Penaja" },
  { value: "kerajaan", label: "🏛️ Bantuan Kerajaan" },
  { value: "lain-lain", label: "📋 Lain-lain" },
];

const bulanNames = ["", "Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];

const FinanceManagement = () => {
  const [allIncomes, setAllIncomes] = useState<IncomeItem[]>([]);
  const [danaMasukList, setDanaMasukList] = useState<DanaMasuk[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [yuranKeluar, setYuranKeluar] = useState<YuranKeluar[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dialogs
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [editExpenseDialogOpen, setEditExpenseDialogOpen] = useState(false);
  const [editIncomeDialogOpen, setEditIncomeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteIncomeDialogOpen, setDeleteIncomeDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailIncomeDialogOpen, setDetailIncomeDialogOpen] = useState(false);
  
  // Selected items
  const [selectedExpense, setSelectedExpense] = useState<YuranKeluar | null>(null);
  const [selectedIncome, setSelectedIncome] = useState<DanaMasuk | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKategori, setFilterKategori] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const { user, isBendahari, isPengerusi } = useAuth();
  const { toast } = useToast();

  const [newExpense, setNewExpense] = useState({
    tajuk_belanja: "",
    jumlah: "",
    kategori: "penyelenggaraan" as KategoriBelanja,
    deskripsi: "",
    tarikh: format(new Date(), "yyyy-MM-dd"),
  });

  const [newIncome, setNewIncome] = useState({
    tajuk: "",
    jumlah: "",
    sumber: "derma",
    deskripsi: "",
    tarikh: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const [yuranBulananRes, keluarRes, profilesRes, pendingBulananRes, danaMasukRes] = await Promise.all([
        supabase
          .from("yuran_bulanan")
          .select("*")
          .eq("status", "sudah_bayar")
          .order("tarikh_bayar", { ascending: false }),
        supabase
          .from("yuran_keluar")
          .select("*")
          .order("tarikh", { ascending: false }),
        supabase
          .from("profiles")
          .select("id, nama_penuh, no_rumah"),
        supabase
          .from("yuran_bulanan")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("dana_masuk")
          .select("*")
          .order("tarikh", { ascending: false }),
      ]);

      if (yuranBulananRes.error) throw yuranBulananRes.error;
      if (keluarRes.error) throw keluarRes.error;

      const profilesMap = new Map(
        (profilesRes.data || []).map(p => [p.id, { nama_penuh: p.nama_penuh, no_rumah: p.no_rumah }])
      );

      const bulananItems: IncomeItem[] = (yuranBulananRes.data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        jumlah: Number(item.jumlah),
        tarikh_bayar: item.tarikh_bayar || item.created_at,
        status: "confirmed",
        rujukan_bayaran: item.rujukan_bayaran,
        jenis: "yuran_bulanan" as const,
        bulan: item.bulan,
        tahun: item.tahun,
        user_name: profilesMap.get(item.user_id)?.nama_penuh || "Ahli",
        user_no_rumah: profilesMap.get(item.user_id)?.no_rumah || "-",
      }));

      // Transform pending payments
      const pendingBulanan: PendingPayment[] = (pendingBulananRes.data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        jumlah: Number(item.jumlah),
        tarikh_bayar: item.tarikh_bayar,
        status: item.status,
        rujukan_bayaran: item.rujukan_bayaran,
        bulan: item.bulan,
        tahun: item.tahun,
        jenis: "yuran_bulanan" as const,
        user_name: profilesMap.get(item.user_id)?.nama_penuh || "Ahli",
        user_no_rumah: profilesMap.get(item.user_id)?.no_rumah || "-",
      }));

      const combined = [...bulananItems].sort(
        (a, b) => new Date(b.tarikh_bayar).getTime() - new Date(a.tarikh_bayar).getTime()
      );

      setAllIncomes(combined);
      setPendingPayments(pendingBulanan);
      setYuranKeluar(keluarRes.data || []);
      setDanaMasukList((danaMasukRes.data || []).map(item => ({
        ...item,
        jumlah: Number(item.jumlah),
      })));
    } catch (error) {
      console.error("Error fetching finance data:", error);
      toast({
        title: "Ralat",
        description: "Gagal memuat data kewangan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFinanceData();
  };

  const handleAddIncome = async () => {
    if (!newIncome.tajuk || !newIncome.jumlah) {
      toast({
        title: "Ralat",
        description: "Sila isi tajuk dan jumlah",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("dana_masuk").insert({
        tajuk: newIncome.tajuk,
        jumlah: parseFloat(newIncome.jumlah),
        sumber: newIncome.sumber,
        deskripsi: newIncome.deskripsi || null,
        tarikh: newIncome.tarikh,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Dana masuk telah ditambah",
      });

      setIncomeDialogOpen(false);
      setNewIncome({
        tajuk: "",
        jumlah: "",
        sumber: "derma",
        deskripsi: "",
        tarikh: format(new Date(), "yyyy-MM-dd"),
      });
      fetchFinanceData();
    } catch (error) {
      console.error("Error adding income:", error);
      toast({
        title: "Ralat",
        description: "Gagal menambah dana masuk",
        variant: "destructive",
      });
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.tajuk_belanja || !newExpense.jumlah) {
      toast({
        title: "Ralat",
        description: "Sila isi semua maklumat yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("yuran_keluar").insert({
        tajuk_belanja: newExpense.tajuk_belanja,
        jumlah: parseFloat(newExpense.jumlah),
        kategori: newExpense.kategori,
        deskripsi: newExpense.deskripsi || null,
        tarikh: newExpense.tarikh,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Perbelanjaan telah ditambah",
      });

      setExpenseDialogOpen(false);
      setNewExpense({
        tajuk_belanja: "",
        jumlah: "",
        kategori: "penyelenggaraan",
        deskripsi: "",
        tarikh: format(new Date(), "yyyy-MM-dd"),
      });
      fetchFinanceData();
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        title: "Ralat",
        description: "Gagal menambah perbelanjaan",
        variant: "destructive",
      });
    }
  };

  const handleEditExpense = async () => {
    if (!selectedExpense) return;

    try {
      const { error } = await supabase
        .from("yuran_keluar")
        .update({
          tajuk_belanja: newExpense.tajuk_belanja,
          jumlah: parseFloat(newExpense.jumlah),
          kategori: newExpense.kategori,
          deskripsi: newExpense.deskripsi || null,
          tarikh: newExpense.tarikh,
        })
        .eq("id", selectedExpense.id);

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Perbelanjaan telah dikemaskini",
      });

      setEditExpenseDialogOpen(false);
      setSelectedExpense(null);
      fetchFinanceData();
    } catch (error) {
      console.error("Error updating expense:", error);
      toast({
        title: "Ralat",
        description: "Gagal mengemaskini perbelanjaan",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;

    try {
      const { error } = await supabase
        .from("yuran_keluar")
        .delete()
        .eq("id", selectedExpense.id);

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Perbelanjaan telah dipadam",
      });

      setDeleteDialogOpen(false);
      setSelectedExpense(null);
      fetchFinanceData();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Ralat",
        description: "Gagal memadam perbelanjaan",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPayment = async (payment: PendingPayment) => {
    try {
      const { error } = await supabase
        .from("yuran_bulanan")
        .update({ 
          status: "sudah_bayar",
          tarikh_bayar: new Date().toISOString()
        })
        .eq("id", payment.id);

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: `Bayaran ${payment.user_name} telah disahkan`,
      });

      fetchFinanceData();
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast({
        title: "Ralat",
        description: "Gagal mengesahkan bayaran",
        variant: "destructive",
      });
    }
  };

  const handleRejectPayment = async (payment: PendingPayment) => {
    try {
      const { error } = await supabase
        .from("yuran_bulanan")
        .update({ status: "gagal" })
        .eq("id", payment.id);

      if (error) throw error;

      toast({
        title: "Bayaran Ditolak",
        description: `Bayaran ${payment.user_name} telah ditolak`,
      });

      fetchFinanceData();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast({
        title: "Ralat",
        description: "Gagal menolak bayaran",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = (type: "masuk" | "keluar") => {
    let csvContent = "";
    const filename = type === "masuk" 
      ? `wang_masuk_${format(new Date(), "yyyyMMdd")}.csv`
      : `wang_keluar_${format(new Date(), "yyyyMMdd")}.csv`;

    if (type === "masuk") {
      csvContent = [
        ["Tarikh", "Ahli", "No Rumah", "Jenis", "Jumlah (RM)", "Status", "Rujukan"].join(","),
        ...allIncomes.map(t => [
          format(new Date(t.tarikh_bayar), "dd/MM/yyyy"),
          `"${t.user_name}"`,
          t.user_no_rumah,
          `Bulanan (${bulanNames[t.bulan || 0]} ${t.tahun})`,
          t.jumlah.toFixed(2),
          t.status === "confirmed" ? "Disahkan" : "Menunggu",
          t.rujukan_bayaran || "-"
        ].join(","))
      ].join("\n");
    } else {
      csvContent = [
        ["Tarikh", "Tajuk", "Kategori", "Jumlah (RM)", "Deskripsi"].join(","),
        ...yuranKeluar.map(t => [
          format(new Date(t.tarikh), "dd/MM/yyyy"),
          `"${t.tajuk_belanja}"`,
          t.kategori,
          t.jumlah.toFixed(2),
          `"${t.deskripsi || "-"}"`
        ].join(","))
      ].join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    toast({
      title: "Berjaya",
      description: "Fail CSV telah dimuat turun.",
    });
  };

  const openEditDialog = (expense: YuranKeluar) => {
    setSelectedExpense(expense);
    setNewExpense({
      tajuk_belanja: expense.tajuk_belanja,
      jumlah: expense.jumlah.toString(),
      kategori: expense.kategori,
      deskripsi: expense.deskripsi || "",
      tarikh: expense.tarikh,
    });
    setEditExpenseDialogOpen(true);
  };

  const openDeleteDialog = (expense: YuranKeluar) => {
    setSelectedExpense(expense);
    setDeleteDialogOpen(true);
  };

  const openEditIncomeDialog = (income: DanaMasuk) => {
    setSelectedIncome(income);
    setNewIncome({
      tajuk: income.tajuk,
      jumlah: income.jumlah.toString(),
      sumber: income.sumber,
      deskripsi: income.deskripsi || "",
      tarikh: income.tarikh,
    });
    setEditIncomeDialogOpen(true);
  };

  const openDeleteIncomeDialog = (income: DanaMasuk) => {
    setSelectedIncome(income);
    setDeleteIncomeDialogOpen(true);
  };

  const handleEditIncome = async () => {
    if (!selectedIncome) return;

    try {
      const { error } = await supabase
        .from("dana_masuk")
        .update({
          tajuk: newIncome.tajuk,
          jumlah: parseFloat(newIncome.jumlah),
          sumber: newIncome.sumber,
          deskripsi: newIncome.deskripsi || null,
          tarikh: newIncome.tarikh,
        })
        .eq("id", selectedIncome.id);

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Dana masuk telah dikemaskini",
      });

      setEditIncomeDialogOpen(false);
      setSelectedIncome(null);
      fetchFinanceData();
    } catch (error) {
      console.error("Error updating income:", error);
      toast({
        title: "Ralat",
        description: "Gagal mengemaskini dana masuk",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIncome = async () => {
    if (!selectedIncome) return;

    try {
      const { error } = await supabase
        .from("dana_masuk")
        .delete()
        .eq("id", selectedIncome.id);

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Dana masuk telah dipadam",
      });

      setDeleteIncomeDialogOpen(false);
      setSelectedIncome(null);
      fetchFinanceData();
    } catch (error) {
      console.error("Error deleting income:", error);
      toast({
        title: "Ralat",
        description: "Gagal memadam dana masuk",
        variant: "destructive",
      });
    }
  };

  // Calculations - include dana_masuk in total income
  const totalDanaMasuk = danaMasukList.reduce((sum, d) => sum + Number(d.jumlah), 0);
  const totalYuran = allIncomes.reduce((sum, y) => sum + Number(y.jumlah), 0);
  const totalMasuk = totalYuran + totalDanaMasuk;
  const totalKeluar = yuranKeluar.reduce((sum, y) => sum + Number(y.jumlah), 0);
  const baki = totalMasuk - totalKeluar;

  // Category breakdown
  const categoryBreakdown = kategoriOptions.map(cat => ({
    ...cat,
    total: yuranKeluar
      .filter(y => y.kategori === cat.value)
      .reduce((sum, y) => sum + Number(y.jumlah), 0),
    count: yuranKeluar.filter(y => y.kategori === cat.value).length,
  }));

  // Filtered data
  const filteredExpenses = yuranKeluar.filter(expense => {
    const matchesSearch = expense.tajuk_belanja.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (expense.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesKategori = filterKategori === "all" || expense.kategori === filterKategori;
    return matchesSearch && matchesKategori;
  });

  const filteredIncomes = allIncomes.filter(income => {
    const matchesSearch = income.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      income.user_no_rumah?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredDanaMasuk = danaMasukList.filter(dana => {
    const matchesSearch = dana.tajuk.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dana.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const getSumberLabel = (sumber: string) => {
    return sumberOptions.find(s => s.value === sumber)?.label || sumber;
  };

  const getKategoriLabel = (kategori: KategoriBelanja) => {
    return kategoriOptions.find(k => k.value === kategori)?.label || kategori;
  };

  const canManage = isBendahari || isPengerusi;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FloatingCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jumlah Masuk</p>
              <p className="text-2xl font-bold text-green-600">
                RM {totalMasuk.toFixed(2)}
              </p>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jumlah Keluar</p>
              <p className="text-2xl font-bold text-red-600">
                RM {totalKeluar.toFixed(2)}
              </p>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Baki Semasa</p>
              <p className={`text-2xl font-bold ${baki >= 0 ? "text-primary" : "text-red-600"}`}>
                RM {baki.toFixed(2)}
              </p>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Menunggu Pengesahan</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pendingPayments.length}
              </p>
            </div>
          </div>
        </FloatingCard>
      </div>

      {/* Category Breakdown */}
      <FloatingCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Pecahan Perbelanjaan Mengikut Kategori
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoryBreakdown.map((cat) => (
            <div key={cat.value} className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm">{cat.label}</p>
              <p className="text-lg font-bold">RM {cat.total.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{cat.count} transaksi</p>
            </div>
          ))}
        </div>
      </FloatingCard>

      {/* Action Buttons */}
      {canManage && (
        <div className="flex flex-wrap gap-2">
          {/* Add Income Button & Dialog */}
          <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <ArrowDownRight className="w-4 h-4" />
                Tambah Dana Masuk
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Dana Masuk</DialogTitle>
                <DialogDescription>
                  Rekodkan sumbangan, derma atau dana lain yang diterima
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tajuk / Perkara *</Label>
                  <Input
                    placeholder="Contoh: Derma daripada En. Ahmad"
                    value={newIncome.tajuk}
                    onChange={(e) => setNewIncome({ ...newIncome, tajuk: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jumlah (RM) *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newIncome.jumlah}
                      onChange={(e) => setNewIncome({ ...newIncome, jumlah: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tarikh</Label>
                    <Input
                      type="date"
                      value={newIncome.tarikh}
                      onChange={(e) => setNewIncome({ ...newIncome, tarikh: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sumber Dana</Label>
                  <Select
                    value={newIncome.sumber}
                    onValueChange={(value) => 
                      setNewIncome({ ...newIncome, sumber: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sumberOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Deskripsi (Pilihan)</Label>
                  <Textarea
                    placeholder="Maklumat tambahan..."
                    value={newIncome.deskripsi}
                    onChange={(e) => setNewIncome({ ...newIncome, deskripsi: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIncomeDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddIncome} className="bg-green-600 hover:bg-green-700">
                  Tambah
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Expense Button & Dialog */}
          <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Tambah Perbelanjaan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Perbelanjaan Baru</DialogTitle>
                <DialogDescription>
                  Rekodkan perbelanjaan persatuan dengan maklumat lengkap
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tajuk Belanja *</Label>
                  <Input
                    placeholder="Contoh: Bayaran elektrik dewan"
                    value={newExpense.tajuk_belanja}
                    onChange={(e) => setNewExpense({ ...newExpense, tajuk_belanja: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jumlah (RM) *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newExpense.jumlah}
                      onChange={(e) => setNewExpense({ ...newExpense, jumlah: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tarikh</Label>
                    <Input
                      type="date"
                      value={newExpense.tarikh}
                      onChange={(e) => setNewExpense({ ...newExpense, tarikh: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select
                    value={newExpense.kategori}
                    onValueChange={(value: KategoriBelanja) => 
                      setNewExpense({ ...newExpense, kategori: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {kategoriOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Deskripsi (Pilihan)</Label>
                  <Textarea
                    placeholder="Maklumat tambahan..."
                    value={newExpense.deskripsi}
                    onChange={(e) => setNewExpense({ ...newExpense, deskripsi: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddExpense}>Tambah</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Muat Semula
          </Button>
        </div>
      )}

      {/* Pending Payments Section */}
      {canManage && pendingPayments.length > 0 && (
        <FloatingCard className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Bayaran Menunggu Pengesahan ({pendingPayments.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {pendingPayments.map((payment) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">{payment.user_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Rumah {payment.user_no_rumah} • {`Bulanan (${bulanNames[payment.bulan || 0]} ${payment.tahun})`}
                      </p>
                      {payment.rujukan_bayaran && (
                        <p className="text-xs text-muted-foreground">Rujukan: {payment.rujukan_bayaran}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-lg">RM {payment.jumlah.toFixed(2)}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleConfirmPayment(payment)}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Sahkan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRejectPayment(payment)}
                      >
                        <XCircle className="w-4 h-4" />
                        Tolak
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </FloatingCard>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterKategori} onValueChange={setFilterKategori}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {kategoriOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Tabs */}
      <Tabs defaultValue="dana" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="dana" className="gap-2">
            <Plus className="w-4 h-4" />
            Dana Masuk ({filteredDanaMasuk.length})
          </TabsTrigger>
          <TabsTrigger value="yuran" className="gap-2">
            <ArrowDownRight className="w-4 h-4" />
            Yuran Ahli ({filteredIncomes.length})
          </TabsTrigger>
          <TabsTrigger value="keluar" className="gap-2">
            <ArrowUpRight className="w-4 h-4" />
            Perbelanjaan ({filteredExpenses.length})
          </TabsTrigger>
        </TabsList>

        {/* Dana Masuk Tab */}
        <TabsContent value="dana">
          <FloatingCard className="p-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Jumlah: <span className="font-bold text-green-600">RM {totalDanaMasuk.toFixed(2)}</span>
              </p>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                const csvContent = [
                  ["Tarikh", "Tajuk", "Sumber", "Jumlah (RM)", "Deskripsi"].join(","),
                  ...danaMasukList.map(d => [
                    format(new Date(d.tarikh), "dd/MM/yyyy"),
                    `"${d.tajuk}"`,
                    d.sumber,
                    d.jumlah.toFixed(2),
                    `"${d.deskripsi || "-"}"`
                  ].join(","))
                ].join("\n");
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `dana_masuk_${format(new Date(), "yyyyMMdd")}.csv`;
                link.click();
                toast({ title: "Berjaya", description: "Fail CSV telah dimuat turun." });
              }}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarikh</TableHead>
                    <TableHead>Tajuk / Perkara</TableHead>
                    <TableHead>Sumber</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    {canManage && <TableHead className="text-right">Tindakan</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDanaMasuk.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(item.tarikh), "dd MMM yyyy", { locale: ms })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{item.tajuk}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                          {getSumberLabel(item.sumber)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        +RM {Number(item.jumlah).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.deskripsi || "-"}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => {
                                setSelectedIncome(item);
                                setDetailIncomeDialogOpen(true);
                              }}>
                                <Eye className="w-4 h-4 mr-2" />
                                Lihat Butiran
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditIncomeDialog(item)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteIncomeDialog(item)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Padam
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredDanaMasuk.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                Tiada rekod dana masuk
              </div>
            )}
          </FloatingCard>
        </TabsContent>

        {/* Yuran Ahli Tab */}
        <TabsContent value="yuran">
          <FloatingCard className="p-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Jumlah: <span className="font-bold text-green-600">RM {totalYuran.toFixed(2)}</span>
              </p>
              <Button variant="outline" size="sm" onClick={() => exportToCSV("masuk")} className="gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ahli</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Tarikh</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Rujukan</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncomes.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.user_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Rumah {item.user_no_rumah}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {`Bulanan (${bulanNames[item.bulan || 0]} ${item.tahun})`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(item.tarikh_bayar), "dd MMM yyyy", { locale: ms })}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        +RM {Number(item.jumlah).toFixed(2)}
                      </TableCell>
                      <TableCell>{item.rujukan_bayaran || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Disahkan
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredIncomes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                Tiada rekod yuran ahli
              </div>
            )}
          </FloatingCard>
        </TabsContent>

        <TabsContent value="keluar">
          <FloatingCard className="p-4">
            <div className="flex justify-end mb-4">
              <Button variant="outline" size="sm" onClick={() => exportToCSV("keluar")} className="gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarikh</TableHead>
                    <TableHead>Tajuk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Jumlah</TableHead>
                    {canManage && <TableHead className="text-right">Tindakan</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(item.tarikh), "dd MMM yyyy", { locale: ms })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.tajuk_belanja}</p>
                          {item.deskripsi && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{item.deskripsi}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getKategoriLabel(item.kategori)}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        -RM {Number(item.jumlah).toFixed(2)}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedExpense(item);
                                setDetailDialogOpen(true);
                              }}>
                                <Eye className="w-4 h-4 mr-2" />
                                Lihat Butiran
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(item)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(item)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Padam
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredExpenses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                Tiada rekod perbelanjaan
              </div>
            )}
          </FloatingCard>
        </TabsContent>
      </Tabs>

      {/* Edit Expense Dialog */}
      <Dialog open={editExpenseDialogOpen} onOpenChange={setEditExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Perbelanjaan</DialogTitle>
            <DialogDescription>
              Kemaskini maklumat perbelanjaan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tajuk Belanja *</Label>
              <Input
                value={newExpense.tajuk_belanja}
                onChange={(e) => setNewExpense({ ...newExpense, tajuk_belanja: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah (RM) *</Label>
                <Input
                  type="number"
                  value={newExpense.jumlah}
                  onChange={(e) => setNewExpense({ ...newExpense, jumlah: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tarikh</Label>
                <Input
                  type="date"
                  value={newExpense.tarikh}
                  onChange={(e) => setNewExpense({ ...newExpense, tarikh: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select
                value={newExpense.kategori}
                onValueChange={(value: KategoriBelanja) => 
                  setNewExpense({ ...newExpense, kategori: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kategoriOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={newExpense.deskripsi}
                onChange={(e) => setNewExpense({ ...newExpense, deskripsi: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditExpenseDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditExpense}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Butiran Perbelanjaan</DialogTitle>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tajuk</Label>
                  <p className="font-medium">{selectedExpense.tajuk_belanja}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Jumlah</Label>
                  <p className="font-medium text-red-600">RM {Number(selectedExpense.jumlah).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tarikh</Label>
                  <p className="font-medium">{format(new Date(selectedExpense.tarikh), "dd MMM yyyy", { locale: ms })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Kategori</Label>
                  <p className="font-medium">{getKategoriLabel(selectedExpense.kategori)}</p>
                </div>
              </div>
              {selectedExpense.deskripsi && (
                <div>
                  <Label className="text-muted-foreground">Deskripsi</Label>
                  <p className="font-medium">{selectedExpense.deskripsi}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Direkodkan pada</Label>
                <p className="font-medium">{format(new Date(selectedExpense.created_at), "dd MMM yyyy, HH:mm", { locale: ms })}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam Perbelanjaan?</AlertDialogTitle>
            <AlertDialogDescription>
              Adakah anda pasti mahu memadam rekod perbelanjaan ini? 
              Tindakan ini tidak boleh dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteExpense}
              className="bg-red-600 hover:bg-red-700"
            >
              Padam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dana Masuk Dialog */}
      <Dialog open={editIncomeDialogOpen} onOpenChange={setEditIncomeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Dana Masuk</DialogTitle>
            <DialogDescription>
              Kemaskini maklumat dana masuk
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tajuk / Perkara *</Label>
              <Input
                value={newIncome.tajuk}
                onChange={(e) => setNewIncome({ ...newIncome, tajuk: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah (RM) *</Label>
                <Input
                  type="number"
                  value={newIncome.jumlah}
                  onChange={(e) => setNewIncome({ ...newIncome, jumlah: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tarikh</Label>
                <Input
                  type="date"
                  value={newIncome.tarikh}
                  onChange={(e) => setNewIncome({ ...newIncome, tarikh: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sumber Dana</Label>
              <Select
                value={newIncome.sumber}
                onValueChange={(value) => 
                  setNewIncome({ ...newIncome, sumber: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sumberOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={newIncome.deskripsi}
                onChange={(e) => setNewIncome({ ...newIncome, deskripsi: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditIncomeDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditIncome}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dana Masuk Dialog */}
      <Dialog open={detailIncomeDialogOpen} onOpenChange={setDetailIncomeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Butiran Dana Masuk</DialogTitle>
          </DialogHeader>
          
          {selectedIncome && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tajuk</Label>
                  <p className="font-medium">{selectedIncome.tajuk}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Jumlah</Label>
                  <p className="font-medium text-green-600">RM {Number(selectedIncome.jumlah).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tarikh</Label>
                  <p className="font-medium">{format(new Date(selectedIncome.tarikh), "dd MMM yyyy", { locale: ms })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sumber</Label>
                  <p className="font-medium">{getSumberLabel(selectedIncome.sumber)}</p>
                </div>
              </div>
              {selectedIncome.deskripsi && (
                <div>
                  <Label className="text-muted-foreground">Deskripsi</Label>
                  <p className="font-medium">{selectedIncome.deskripsi}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Direkodkan pada</Label>
                <p className="font-medium">{format(new Date(selectedIncome.created_at), "dd MMM yyyy, HH:mm", { locale: ms })}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailIncomeDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dana Masuk Confirmation Dialog */}
      <AlertDialog open={deleteIncomeDialogOpen} onOpenChange={setDeleteIncomeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam Dana Masuk?</AlertDialogTitle>
            <AlertDialogDescription>
              Adakah anda pasti mahu memadam rekod dana masuk ini? 
              Tindakan ini tidak boleh dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteIncome}
              className="bg-red-600 hover:bg-red-700"
            >
              Padam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FinanceManagement;
