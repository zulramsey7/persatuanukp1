import { useState, useCallback, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import type { Database } from "@/integrations/supabase/types";

type YuranBulanan = Database["public"]["Tables"]["yuran_bulanan"]["Row"] & { user_name?: string };
type YuranKeluar = Database["public"]["Tables"]["yuran_keluar"]["Row"];
type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const useDashboardData = () => {
  const { user, profile } = useAuth();
  const { handleError } = useErrorHandler();

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentIncomes, setRecentIncomes] = useState<YuranBulanan[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<YuranKeluar[]>([]);
  const [announcements, setAnnouncements] = useState<Notification[]>([]);
  const [recentMembers, setRecentMembers] = useState<Profile[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [memberIndex, setMemberIndex] = useState<number>(1);
  const [memberGrowthData] = useState<{ name: string; ahli: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMemberIndex = useCallback(async () => {
    if (!user || !profile) return;
    setMemberIndex(profile.member_number || profile.no_ahli || 1);
  }, [user, profile]);

  const checkMembershipStatus = useCallback(async () => {
    if (!user || !profile || profile.status_ahli !== "active") return;

    try {
      // Dapatkan tarikh hari ini
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Kira 3 bulan ke belakang
      const checkMonths = [];
      for (let i = 0; i < 3; i++) {
        let m = currentMonth - i;
        let y = currentYear;
        if (m <= 0) {
          m += 12;
          y -= 1;
        }
        checkMonths.push({ month: m, year: y });
      }

      // Semak rekod yuran bagi 3 bulan terakhir
      const { data: payments, error } = await supabase
        .from("yuran_bulanan")
        .select("bulan, tahun, status")
        .eq("user_id", user.id)
        .in("tahun", checkMonths.map(d => d.year))
        .eq("status", "sudah_bayar");

      if (error) throw error;

      // Kira berapa bulan yang sudah dibayar dalam tempoh 3 bulan terakhir
      const paidMonthsCount = checkMonths.filter(check => 
        payments.some(p => p.bulan === check.month && p.tahun === check.year)
      ).length;

      // Jika 0 bulan dibayar dalam 3 bulan terakhir (tunggakan >= 3 bulan)
      if (paidMonthsCount === 0) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ status_ahli: "inactive" })
          .eq("id", user.id);

        if (updateError) throw updateError;
        
        // Logik ini akan menyebabkan profil dikemas kini pada sesi seterusnya
        // atau kita boleh paksa refresh halaman
        window.location.reload();
      }
    } catch (error) {
      console.error('Error checking membership status:', error);
    }
  }, [user, profile]);

  const fetchNotifications = useCallback(async () => {
    try {
      if (!user) return;
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq("dibaca", false);
      
      if (error) throw error;
      setUnreadNotifications(count || 0);
    } catch (error) {
      handleError(error, {
        source: 'dashboard_notifications',
        userFacingMessage: 'Gagal memuat notifikasi',
        showToast: false,
      });
    }
  }, [user, handleError]);

  const fetchRecentData = useCallback(async () => {
    try {
      const [incomes, expenses, notifs, members, allProfiles] = await Promise.all([
        supabase.from("yuran_bulanan").select("*").order("tarikh_bayar", { ascending: false }).limit(5),
        supabase.from("yuran_keluar").select("*").order("tarikh", { ascending: false }).limit(5),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id, nama_penuh")
      ]);

      if (incomes.error) throw incomes.error;
      if (expenses.error) throw expenses.error;
      if (notifs.error) throw notifs.error;
      if (members.error) throw members.error;
      if (allProfiles.error) throw allProfiles.error;

      const profilesMap = new Map(
        (allProfiles.data || []).map(p => [p.id, p.nama_penuh])
      );

      const mappedIncomes = (incomes.data || []).map(income => ({
        ...income,
        user_name: profilesMap.get(income.user_id) || "Ahli"
      }));

      setRecentIncomes(mappedIncomes);
      setRecentExpenses(expenses.data || []);
      setAnnouncements(notifs.data || []);
      setRecentMembers(members.data || []);
    } catch (error) {
      handleError(error, {
        source: 'dashboard_recent',
        userFacingMessage: 'Gagal memuat data terkini',
        showToast: false,
      });
      console.error('Error fetching recent data:', error);
    }
  }, [handleError]);

  const generateAIInsights = useCallback(async () => {
    try {
      const insights: string[] = [];

      const { count: pendingCount, error: pendingError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("status_ahli", "pending");

      if (pendingError) throw pendingError;

      if (pendingCount && pendingCount > 0) {
        insights.push(`${pendingCount} permohonan ahli baru menunggu kelulusan`);
      }

      const { count: pollCount, error: pollError } = await supabase
        .from("polls")
        .select("*", { count: "exact", head: true })
        .eq("status", "aktif");

      if (pollError) throw pollError;

      if (pollCount && pollCount > 0) {
        insights.push(`${pollCount} undian aktif memerlukan undi anda`);
      }

      const currentMonth = new Date().getMonth() + 1;
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const currentYear = new Date().getFullYear();
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      
      const { data: currentMonthIncome, error: currentError } = await supabase
        .from("yuran_bulanan")
        .select("jumlah")
        .eq("status", "sudah_bayar")
        .eq("bulan", currentMonth)
        .eq("tahun", currentYear);

      if (currentError) throw currentError;

      const { data: lastMonthIncome, error: lastError } = await supabase
        .from("yuran_bulanan")
        .select("jumlah")
        .eq("status", "sudah_bayar")
        .eq("bulan", lastMonth)
        .eq("tahun", lastMonthYear);

      if (lastError) throw lastError;

      const currentTotal = currentMonthIncome?.reduce((sum, r) => sum + Number(r.jumlah), 0) || 0;
      const lastTotal = lastMonthIncome?.reduce((sum, r) => sum + Number(r.jumlah), 0) || 0;

      if (lastTotal > 0 && currentTotal > lastTotal) {
        const increase = Math.round(((currentTotal - lastTotal) / lastTotal) * 100);
        insights.push(`Kutipan yuran meningkat ${increase}% berbanding bulan lepas`);
      } else if (lastTotal > 0 && currentTotal < lastTotal) {
        const decrease = Math.round(((lastTotal - currentTotal) / lastTotal) * 100);
        insights.push(`Kutipan yuran menurun ${decrease}% berbanding bulan lepas`);
      }

      if (insights.length === 0) {
        insights.push('Sistem sedang berjalan dengan baik');
        insights.push('Semua anggota dalam status aktif');
      }

      setAiInsights(insights.slice(0, 3));
    } catch (error) {
      handleError(error, {
        source: 'dashboard_insights',
        userFacingMessage: 'Gagal menjana pandangan',
        showToast: false,
      });
      console.error('Error generating insights:', error);
      setAiInsights(['Sistem sedang berjalan dengan baik']);
    }
  }, [handleError]);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchNotifications(),
        fetchRecentData(),
        generateAIInsights(),
        fetchMemberIndex(),
        checkMembershipStatus()
      ]);
    } catch (error) {
      console.error('Error fetching remaining data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchNotifications, fetchRecentData, generateAIInsights, fetchMemberIndex, checkMembershipStatus]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  return {
    unreadNotifications,
    recentIncomes,
    recentExpenses,
    announcements,
    recentMembers,
    aiInsights,
    memberIndex,
    memberGrowthData,
    isLoading,
    refreshData: fetchAllData
  };
};
