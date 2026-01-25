import { useState } from "react";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { FileText, Download, Users, Wallet, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ReportManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const generateMemberReport = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("nama_penuh, no_rumah, no_telefon, status_ahli, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Tiada Data",
          description: "Tiada rekod ahli untuk dilaporkan.",
          variant: "destructive",
        });
        return;
      }

      const headers = ["Nama Penuh", "No. Rumah", "No. Telefon", "Status", "Tarikh Daftar"];
      const csvContent = [
        headers.join(","),
        ...data.map(item => 
          `"${item.nama_penuh}","${item.no_rumah}","${item.no_telefon || '-'}","${item.status_ahli}","${format(new Date(item.created_at), "dd/MM/yyyy")}"`
        )
      ].join("\n");

      downloadCSV(csvContent, `laporan_keahlian_${format(new Date(), "yyyy-MM-dd")}.csv`);
      
      toast({
        title: "Berjaya",
        description: "Laporan keahlian berjaya dimuat turun.",
      });
    } catch (error) {
      console.error("Error generating member report:", error);
      toast({
        title: "Ralat",
        description: "Gagal menjana laporan keahlian.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateFinanceReport = async () => {
    try {
      setLoading(true);
      // Fetch Incomes
      const { data: incomes, error: incomeError } = await supabase
        .from("yuran_bulanan")
        .select("user_id, jumlah, tarikh_bayar, status, bulan, tahun")
        .eq("status", "sudah_bayar");
      
      if (incomeError) throw incomeError;

      // Fetch Expenses
      const { data: expenses, error: expenseError } = await supabase
        .from("yuran_keluar")
        .select("tajuk_belanja, jumlah, kategori, tarikh");

      if (expenseError) throw expenseError;

      const headers = ["Jenis", "Perkara/Bulan", "Jumlah (RM)", "Tarikh", "Kategori/Status"];
      const incomeRows = (incomes || []).map(item => 
        `"Pendapatan","Yuran Bulan ${item.bulan}/${item.tahun}","${item.jumlah}","${item.tarikh_bayar ? format(new Date(item.tarikh_bayar), "dd/MM/yyyy") : '-'}","${item.status}"`
      );
      const expenseRows = (expenses || []).map(item => 
        `"Perbelanjaan","${item.tajuk_belanja}","-${item.jumlah}","${format(new Date(item.tarikh), "dd/MM/yyyy")}","${item.kategori}"`
      );

      const csvContent = [
        headers.join(","),
        ...incomeRows,
        ...expenseRows
      ].join("\n");

      downloadCSV(csvContent, `laporan_kewangan_${format(new Date(), "yyyy-MM-dd")}.csv`);

      toast({
        title: "Berjaya",
        description: "Laporan kewangan berjaya dimuat turun.",
      });
    } catch (error) {
      console.error("Error generating finance report:", error);
      toast({
        title: "Ralat",
        description: "Gagal menjana laporan kewangan.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateActivityReport = async () => {
     try {
      setLoading(true);
      const { data, error } = await supabase
        .from("aktiviti")
        .select("tajuk, tarikh_mula, lokasi, deskripsi")
        .order("tarikh_mula", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Tiada Data",
          description: "Tiada rekod aktiviti untuk dilaporkan.",
          variant: "destructive",
        });
        return;
      }

      const headers = ["Tajuk Aktiviti", "Tarikh", "Lokasi", "Deskripsi"];
      const csvContent = [
        headers.join(","),
        ...data.map(item => 
          `"${item.tajuk}","${format(new Date(item.tarikh_mula), "dd/MM/yyyy")}","${item.lokasi}","${item.deskripsi || '-'}"`
        )
      ].join("\n");

      downloadCSV(csvContent, `laporan_aktiviti_${format(new Date(), "yyyy-MM-dd")}.csv`);
      
      toast({
        title: "Berjaya",
        description: "Laporan aktiviti berjaya dimuat turun.",
      });
    } catch (error) {
      console.error("Error generating activity report:", error);
      toast({
        title: "Ralat",
        description: "Gagal menjana laporan aktiviti.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pusat Laporan</h2>
          <p className="text-muted-foreground">
            Jana dan muat turun laporan untuk simpanan dan rujukan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FloatingCard className="p-6 space-y-4 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Laporan Keahlian</h3>
            <p className="text-sm text-muted-foreground">
              Senarai lengkap ahli berdaftar, status keahlian, dan maklumat peribadi.
            </p>
          </div>
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            onClick={generateMemberReport}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            {loading ? "Sedang Menjana..." : "Muat Turun CSV"}
          </Button>
        </FloatingCard>

        <FloatingCard className="p-6 space-y-4 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Laporan Kewangan</h3>
            <p className="text-sm text-muted-foreground">
              Ringkasan pendapatan, perbelanjaan, dan status yuran ahli.
            </p>
          </div>
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            onClick={generateFinanceReport}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            {loading ? "Sedang Menjana..." : "Muat Turun CSV"}
          </Button>
        </FloatingCard>

        <FloatingCard className="p-6 space-y-4 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Laporan Aktiviti</h3>
            <p className="text-sm text-muted-foreground">
              Rekod aktiviti persatuan, kehadiran, dan butiran program.
            </p>
          </div>
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700" 
            onClick={generateActivityReport}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            {loading ? "Sedang Menjana..." : "Muat Turun CSV"}
          </Button>
        </FloatingCard>
      </div>
    </div>
  );
}
