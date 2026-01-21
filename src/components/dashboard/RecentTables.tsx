import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ms } from "date-fns/locale";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  User,
  Download,
  X,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Income {
  id: string;
  jumlah: number;
  tarikh_bayar: string;
  status: string;
  user_name?: string;
}

interface Expense {
  id: string;
  tajuk_belanja: string;
  jumlah: number;
  tarikh: string;
  kategori: string;
}

interface Announcement {
  id: string;
  tajuk: string;
  mesej: string;
  created_at: string;
  jenis: string;
}

interface Member {
  id: string;
  nama_penuh: string;
  no_rumah: string;
  status_ahli: string;
  created_at: string;
}

interface RecentTablesProps {
  incomes: Income[];
  expenses: Expense[];
  announcements: Announcement[];
  members: Member[];
  loading?: boolean;
}

export function RecentTables({
  incomes,
  expenses,
  announcements,
  members,
  loading
}: RecentTablesProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [incomeSearch, setIncomeSearch] = useState("");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [incomeCurrentPage, setIncomeCurrentPage] = useState(1);
  const [expenseCurrentPage, setExpenseCurrentPage] = useState(1);
  const [incomeStatusFilter, setIncomeStatusFilter] = useState<string | null>(null);
  const [incomeStartDate, setIncomeStartDate] = useState<string>("");
  const [incomeEndDate, setIncomeEndDate] = useState<string>("");
  const [expenseStartDate, setExpenseStartDate] = useState<string>("");
  const [expenseEndDate, setExpenseEndDate] = useState<string>("");
  
  const itemsPerPage = 10;

  // Filter and search for incomes
  const filteredIncomes = useMemo(() => {
    return incomes.filter((income) => {
      const matchesSearch = (income.user_name || "Ahli")
        .toLowerCase()
        .includes(incomeSearch.toLowerCase());
      const matchesStatus = !incomeStatusFilter || income.status === incomeStatusFilter;
      const incomDate = new Date(income.tarikh_bayar);
      const matchesDateRange =
        (!incomeStartDate || incomDate >= new Date(incomeStartDate)) &&
        (!incomeEndDate || incomDate <= new Date(incomeEndDate));
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [incomes, incomeSearch, incomeStatusFilter, incomeStartDate, incomeEndDate]);

  // Filter and search for expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = expense.tajuk_belanja
        .toLowerCase()
        .includes(expenseSearch.toLowerCase());
      const expenseDate = new Date(expense.tarikh);
      const matchesDateRange =
        (!expenseStartDate || expenseDate >= new Date(expenseStartDate)) &&
        (!expenseEndDate || expenseDate <= new Date(expenseEndDate));
      return matchesSearch && matchesDateRange;
    });
  }, [expenses, expenseSearch, expenseStartDate, expenseEndDate]);

  // Pagination for incomes
  const incomeTotalPages = Math.ceil(filteredIncomes.length / itemsPerPage);
  const paginatedIncomes = filteredIncomes.slice(
    (incomeCurrentPage - 1) * itemsPerPage,
    incomeCurrentPage * itemsPerPage
  );

  // Pagination for expenses
  const expenseTotalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
    (expenseCurrentPage - 1) * itemsPerPage,
    expenseCurrentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "dibayar":
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    if (data.length === 0) {
      toast({
        title: "Tiada data",
        description: "Tiada data untuk dieksport",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          return typeof value === "string" && value.includes(",") 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(",")
      ),
    ].join("\n");

    const element = document.createElement("a");
    element.setAttribute("href", `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
    element.setAttribute("download", `${filename}_${format(new Date(), "ddMMMyyyy")}.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Berjaya",
      description: `${filename} telah dieksport`,
    });
  };

  const handleExportIncomes = () => {
    const headers = ["Nama", "Tarikh", "Jumlah", "Status"];
    const data = filteredIncomes.map(income => ({
      "Nama": income.user_name || "Ahli",
      "Tarikh": format(new Date(income.tarikh_bayar), "d MMM yyyy", { locale: ms }),
      "Jumlah": `RM ${income.jumlah.toFixed(2)}`,
      "Status": income.status === "dibayar" ? "Dibayar" : income.status,
    }));
    exportToCSV(data, "Pendapatan", headers);
  };

  const handleExportExpenses = () => {
    const headers = ["Tajuk", "Kategori", "Tarikh", "Jumlah"];
    const data = filteredExpenses.map(expense => ({
      "Tajuk": expense.tajuk_belanja,
      "Kategori": expense.kategori,
      "Tarikh": format(new Date(expense.tarikh), "d MMM yyyy", { locale: ms }),
      "Jumlah": `RM ${expense.jumlah.toFixed(2)}`,
    }));
    exportToCSV(data, "Perbelanjaan", headers);
  };

  const handleExportMembers = () => {
    const headers = ["Nama", "No Rumah", "Status"];
    const data = members.map(member => ({
      "Nama": member.nama_penuh,
      "No Rumah": member.no_rumah,
      "Status": member.status_ahli === "active" ? "Aktif" : member.status_ahli === "pending" ? "Menunggu" : member.status_ahli,
    }));
    exportToCSV(data, "Ahli", headers);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Income */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-6 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-semibold text-foreground">Pendapatan Terkini</h3>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1"
              onClick={() => setShowIncomeModal(true)}
            >
              Lihat Semua
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1"
              onClick={handleExportIncomes}
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg shimmer" />
            ))}
          </div>
        ) : incomes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Tiada rekod pendapatan
          </p>
        ) : (
          <div className="space-y-3">
            {incomes.slice(0, 5).map((income) => (
              <div
                key={income.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {income.user_name || "Ahli"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(income.tarikh_bayar), "d MMM yyyy", { locale: ms })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-success">
                    +RM {income.jumlah.toFixed(2)}
                  </p>
                  <Badge variant="outline" className={getStatusColor(income.status)}>
                    {income.status === "dibayar" ? "Dibayar" : income.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Expenses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl p-6 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground">Perbelanjaan Terkini</h3>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1"
              onClick={() => setShowExpenseModal(true)}
            >
              Lihat Semua
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1"
              onClick={handleExportExpenses}
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg shimmer" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Tiada rekod perbelanjaan
          </p>
        ) : (
          <div className="space-y-3">
            {expenses.slice(0, 5).map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {expense.tajuk_belanja}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(expense.tarikh), "d MMM yyyy", { locale: ms })} • {expense.kategori}
                  </p>
                </div>
                <p className="text-sm font-semibold text-destructive">
                  -RM {expense.jumlah.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Latest Announcements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-6 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-info" />
            </div>
            <h3 className="font-semibold text-foreground">Pengumuman Terkini</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1"
            onClick={() => navigate("/notifikasi")}
          >
            Lihat Semua
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg shimmer" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Tiada pengumuman
          </p>
        ) : (
          <div className="space-y-3">
            {announcements.slice(0, 4).map((ann) => (
              <div
                key={ann.id}
                className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {ann.tajuk}
                  </p>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {ann.jenis}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {ann.mesej}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(ann.created_at), "d MMM yyyy, h:mm a", { locale: ms })}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Latest Members */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl p-6 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Ahli Terbaru</h3>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1"
              onClick={() => navigate("/direktori")}
            >
              Lihat Semua
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1"
              onClick={handleExportMembers}
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg shimmer" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Tiada ahli baru
          </p>
        ) : (
          <div className="space-y-3">
            {members.slice(0, 5).map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {member.nama_penuh.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.nama_penuh}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rumah {member.no_rumah}
                  </p>
                </div>
                <Badge variant="outline" className={getStatusColor(member.status_ahli)}>
                  {member.status_ahli === "active" ? "Aktif" : member.status_ahli === "pending" ? "Menunggu" : member.status_ahli}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Income Modal */}
      <AnimatePresence>
        {showIncomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowIncomeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Semua Pendapatan</h2>
                <button
                  onClick={() => setShowIncomeModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filters Section */}
              <div className="space-y-4 mb-6 p-4 rounded-xl bg-muted/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama ahli..."
                      value={incomeSearch}
                      onChange={(e) => {
                        setIncomeSearch(e.target.value);
                        setIncomeCurrentPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={incomeStatusFilter || ""}
                    onChange={(e) => {
                      setIncomeStatusFilter(e.target.value || null);
                      setIncomeCurrentPage(1);
                    }}
                    className="px-4 py-2 rounded-lg border border-input bg-background"
                  >
                    <option value="">Semua Status</option>
                    <option value="dibayar">Dibayar</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Date Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Dari Tarikh</label>
                    <Input
                      type="date"
                      value={incomeStartDate}
                      onChange={(e) => {
                        setIncomeStartDate(e.target.value);
                        setIncomeCurrentPage(1);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Hingga Tarikh</label>
                    <Input
                      type="date"
                      value={incomeEndDate}
                      onChange={(e) => {
                        setIncomeEndDate(e.target.value);
                        setIncomeCurrentPage(1);
                      }}
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Menunjukkan {paginatedIncomes.length} daripada {filteredIncomes.length} rekod
                </p>
              </div>

              {/* Data Display */}
              {filteredIncomes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Tiada data pendapatan</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {paginatedIncomes.map((income) => (
                    <div
                      key={income.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-success/10"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{income.user_name || "Ahli"}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(income.tarikh_bayar), "d MMMM yyyy", { locale: ms })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-success">RM {income.jumlah.toFixed(2)}</p>
                        <Badge variant="outline" className={getStatusColor(income.status)}>
                          {income.status === "dibayar" ? "Dibayar" : income.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {incomeTotalPages > 1 && (
                <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-muted/20">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIncomeCurrentPage(Math.max(1, incomeCurrentPage - 1))}
                    disabled={incomeCurrentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Halaman {incomeCurrentPage} daripada {incomeTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIncomeCurrentPage(Math.min(incomeTotalPages, incomeCurrentPage + 1))}
                    disabled={incomeCurrentPage === incomeTotalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowIncomeModal(false)}
                >
                  Tutup
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleExportIncomes}
                >
                  <Download className="w-4 h-4" />
                  Eksport CSV
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowExpenseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Semua Perbelanjaan</h2>
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filters Section */}
              <div className="space-y-4 mb-6 p-4 rounded-xl bg-muted/20">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari tajuk perbelanjaan..."
                    value={expenseSearch}
                    onChange={(e) => {
                      setExpenseSearch(e.target.value);
                      setExpenseCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Date Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Dari Tarikh</label>
                    <Input
                      type="date"
                      value={expenseStartDate}
                      onChange={(e) => {
                        setExpenseStartDate(e.target.value);
                        setExpenseCurrentPage(1);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Hingga Tarikh</label>
                    <Input
                      type="date"
                      value={expenseEndDate}
                      onChange={(e) => {
                        setExpenseEndDate(e.target.value);
                        setExpenseCurrentPage(1);
                      }}
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Menunjukkan {paginatedExpenses.length} daripada {filteredExpenses.length} rekod
                </p>
              </div>

              {/* Data Display */}
              {filteredExpenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Tiada data perbelanjaan</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {paginatedExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-destructive/10"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{expense.tajuk_belanja}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(expense.tarikh), "d MMMM yyyy", { locale: ms })} • {expense.kategori}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-destructive">-RM {expense.jumlah.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {expenseTotalPages > 1 && (
                <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-muted/20">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpenseCurrentPage(Math.max(1, expenseCurrentPage - 1))}
                    disabled={expenseCurrentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Halaman {expenseCurrentPage} daripada {expenseTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpenseCurrentPage(Math.min(expenseTotalPages, expenseCurrentPage + 1))}
                    disabled={expenseCurrentPage === expenseTotalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowExpenseModal(false)}
                >
                  Tutup
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleExportExpenses}
                >
                  <Download className="w-4 h-4" />
                  Eksport CSV
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}