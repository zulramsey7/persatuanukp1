import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Receipt,
  Calendar,
  User,
  Home,
  Wallet,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";

interface MemberYuranStatus {
  id: string;
  nama_penuh: string;
  no_rumah: string;
  yuranBulanan: {
    bulan: number;
    tahun: number;
    status: string;
    jumlah: number;
    tarikh_bayar: string | null;
  }[];
}

export function YuranStatusWidget() {
  const [members, setMembers] = useState<MemberYuranStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();

  const bulanNames = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];

  const isPaidBulananStatus = (status?: string | null) =>
    status === "sudah_bayar" || status === "dibayar" || status === "confirmed";

  useEffect(() => {
    fetchYuranStatus();

    const channel = supabase
      .channel(`yuran-status-widget-${selectedYear}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "yuran_bulanan",
          filter: `tahun=eq.${selectedYear}`,
        },
        () => fetchYuranStatus()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => fetchYuranStatus()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedYear]);

  const fetchYuranStatus = async () => {
    setLoading(true);
    try {
      // Fetch all active profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nama_penuh, no_rumah")
        .eq("status_ahli", "active")
        .order("no_rumah", { ascending: true });

      if (profilesError) throw profilesError;

      // Fetch yuran bulanan for selected year
      const { data: yuranBulanan } = await supabase
        .from("yuran_bulanan")
        .select("user_id, bulan, tahun, status, jumlah, tarikh_bayar")
        .eq("tahun", selectedYear);

      // Combine data
      const membersWithYuran: MemberYuranStatus[] = (profiles || []).map(profile => {
        const bulanan = (yuranBulanan || [])
          .filter(y => y.user_id === profile.id)
          .sort((a, b) => a.bulan - b.bulan);

        return {
          ...profile,
          yuranBulanan: bulanan.map(y => ({
            bulan: y.bulan,
            tahun: y.tahun,
            status: y.status,
            jumlah: Number(y.jumlah),
            tarikh_bayar: y.tarikh_bayar
          }))
        };
      });

      setMembers(membersWithYuran);
    } catch (error) {
      console.error("Error fetching yuran status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check payment status for a specific month
  // - "sudah" = paid
  // - "belum" = unpaid (only for current month and past months)
  // - "akan" = future month (not yet due)
  const getYuranBulananStatus = (
    member: MemberYuranStatus,
    bulan: number
  ): "sudah" | "belum" | "akan" => {
    const yuran = member.yuranBulanan.find((y) => y.bulan === bulan);

    // If already paid (even early / future month), always show as paid
    if (yuran && isPaidBulananStatus(yuran.status)) return "sudah";

    // Year-based logic
    if (selectedYear < currentYear) return "belum";
    if (selectedYear > currentYear) return "akan";

    // Current year logic
    if (bulan > currentMonth) return "akan";

    return "belum";
  };

  const stats = {
    totalMembers: members.length,
    totalPaidBulanan: members.reduce(
      (sum, m) => sum + m.yuranBulanan.filter((y) => isPaidBulananStatus(y.status)).length,
      0
    ),
    totalCollected: members.reduce((sum, m) => {
      const bulanan = m.yuranBulanan
        .filter((y) => isPaidBulananStatus(y.status))
        .reduce((s, y) => s + y.jumlah, 0);
      return sum + bulanan;
    }, 0),
  };

  if (loading) {
    return (
      <FloatingCard className="p-6">
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
          />
        </div>
      </FloatingCard>
    );
  }

  return (
    <FloatingCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Status Yuran Ahli</h3>
            <p className="text-sm text-muted-foreground">Paparan yuran bulanan</p>
          </div>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground"
        >
          {[2024, 2025, 2026].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Ahli Aktif</span>
          </div>
          <p className="text-lg font-bold text-foreground">{stats.totalMembers}</p>
        </div>
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">Bayaran Bulanan</span>
          </div>
          <p className="text-lg font-bold text-foreground">{stats.totalPaidBulanan}</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Jumlah Kutipan</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            RM {stats.totalCollected.toLocaleString("ms-MY", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <Tabs defaultValue="bulanan" className="w-full">
        <TabsList className="grid w-full grid-cols-1 mb-4">
          <TabsTrigger value="bulanan">Yuran Bulanan (RM5)</TabsTrigger>
        </TabsList>

        <TabsContent value="bulanan">
          <ScrollArea className="h-[300px]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 font-medium text-muted-foreground sticky left-0 bg-background">Ahli</th>
                    {bulanNames.map((bulan, i) => {
                      const isCurrentMonth = selectedYear === currentYear && i + 1 === currentMonth;
                      return (
                        <th key={i} className={`text-center p-2 font-medium min-w-[40px] ${isCurrentMonth ? 'text-primary bg-primary/10 rounded-t' : 'text-muted-foreground'}`}>
                          {bulan}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, index) => (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="p-2 sticky left-0 bg-background">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate max-w-[120px]">
                            {member.nama_penuh.split(" ")[0]}
                          </span>
                          <span className="text-xs text-muted-foreground">#{member.no_rumah}</span>
                        </div>
                      </td>
                      {bulanNames.map((_, bulanIndex) => {
                        const status = getYuranBulananStatus(member, bulanIndex + 1);
                        const isCurrentMonth = selectedYear === currentYear && bulanIndex + 1 === currentMonth;
                        return (
                          <td key={bulanIndex} className={`text-center p-2 ${isCurrentMonth ? 'bg-primary/10 rounded' : ''}`}>
                            {status === "sudah" ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                            ) : status === "akan" ? (
                              <span className="text-muted-foreground/30">-</span>
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </FloatingCard>
  );
}