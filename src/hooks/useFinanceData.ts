import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FinanceDataPoint {
  name: string;
  pendapatan: number;
  perbelanjaan: number;
}

const fetchFinanceData = async (): Promise<FinanceDataPoint[]> => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const { data: incomeData, error: incomeError } = await supabase
    .from("yuran_masuk")
    .select("tarikh_bayar, jumlah")
    .in("status", ["confirmed", "sudah_bayar"])
    .gte("tarikh_bayar", sixMonthsAgo.toISOString().split("T")[0]);

  if (incomeError) throw incomeError;

  const { data: expenseData, error: expenseError } = await supabase
    .from("yuran_keluar")
    .select("tarikh, jumlah")
    .gte("tarikh", sixMonthsAgo.toISOString().split("T")[0]);

  if (expenseError) throw expenseError;

  const monthlyData: { [key: string]: { pendapatan: number; perbelanjaan: number } } = {};

  // Process income data
  incomeData?.forEach((record) => {
    const date = new Date(record.tarikh_bayar);
    const monthKey = date.toLocaleString("ms-MY", { month: "short", year: "numeric" });
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { pendapatan: 0, perbelanjaan: 0 };
    }
    monthlyData[monthKey].pendapatan += Number(record.jumlah);
  });

  // Process expense data
  expenseData?.forEach((record) => {
    const date = new Date(record.tarikh);
    const monthKey = date.toLocaleString("ms-MY", { month: "short", year: "numeric" });
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { pendapatan: 0, perbelanjaan: 0 };
    }
    monthlyData[monthKey].perbelanjaan += Number(record.jumlah);
  });

  // Convert to array and sort by date
  return Object.entries(monthlyData)
    .map(([name, data]) => ({
      name,
      ...data,
    }))
    .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
};

export const useFinanceData = (): UseQueryResult<FinanceDataPoint[], Error> => {
  return useQuery({
    queryKey: ["finance-data"],
    queryFn: fetchFinanceData,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
