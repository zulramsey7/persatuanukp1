import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StatsData {
  totalMembers: number;
  pendingApprovals: number;
  netBalance: number;
  outstandingDues: number;
  totalIncome: number;
  totalExpenses: number;
  reportsCount: number;
}

export const getDateRange = (
  filter: "today" | "week" | "month" | "all"
): { start: Date; end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case "today":
      return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    case "week":
      {
        const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
        return { start: weekStart, end: new Date(now) };
      }
    case "month":
      {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart, end: new Date(now) };
      }
    case "all":
      return { start: new Date("2000-01-01"), end: new Date(now) };
    default:
      {
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: defaultStart, end: new Date(now) };
      }
  }
};

const fetchStats = async (_dateRangeFilter: "today" | "week" | "month" | "all"): Promise<StatsData> => {
  const [
    membersRes,
    pendingRes,
    yuranBulananRes,
    danaMasukRes,
    expenseRes,
    outstandingRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status_ahli", "pending"),
    supabase
      .from("yuran_bulanan")
      .select("jumlah")
      .eq("status", "sudah_bayar"),
    supabase
      .from("dana_masuk")
      .select("jumlah"),
    supabase
      .from("yuran_keluar")
      .select("jumlah"),
    supabase
      .from("yuran_bulanan")
      .select("jumlah")
      .eq("status", "belum_bayar"),
  ]);

  // Check for errors
  if (membersRes.error) throw membersRes.error;
  if (pendingRes.error) throw pendingRes.error;
  if (yuranBulananRes.error) throw yuranBulananRes.error;
  if (danaMasukRes.error) throw danaMasukRes.error;
  if (expenseRes.error) throw expenseRes.error;
  if (outstandingRes.error) throw outstandingRes.error;

  // Total income = yuran bulanan (sudah_bayar) + dana masuk
  const totalYuranBulanan = yuranBulananRes.data?.reduce((sum, r) => sum + Number(r.jumlah), 0) || 0;
  const totalDanaMasuk = danaMasukRes.data?.reduce((sum, r) => sum + Number(r.jumlah), 0) || 0;
  const totalIncome = totalYuranBulanan + totalDanaMasuk;

  const totalExpenses = expenseRes.data?.reduce((sum, r) => sum + Number(r.jumlah), 0) || 0;
  const outstandingDues = outstandingRes.data?.reduce((sum, r) => sum + Number(r.jumlah), 0) || 0;

  return {
    totalMembers: membersRes.count || 0,
    pendingApprovals: pendingRes.count || 0,
    netBalance: totalIncome - totalExpenses,
    outstandingDues,
    totalIncome,
    totalExpenses,
    reportsCount: 0,
  };
};

export const useDashboardStats = (
  dateRangeFilter: "today" | "week" | "month" | "all"
): UseQueryResult<StatsData, Error> => {
  return useQuery({
    queryKey: ["dashboard-stats", dateRangeFilter],
    queryFn: () => fetchStats(dateRangeFilter),
    enabled: true,
  });
};
