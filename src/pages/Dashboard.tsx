import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useFinanceData } from "@/hooks/useFinanceData";
import { SkeletonStats, SkeletonTable } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FinanceChart, MemberGrowthChart } from "@/components/dashboard/FinanceChart";
import { RecentTables } from "@/components/dashboard/RecentTables";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { MobileBottomNav, MobileSideMenu } from "@/components/dashboard/MobileNav";
import { CommunityPollWidget } from "@/components/dashboard/CommunityPollWidget";
import { CommunityInfoWidget } from "@/components/dashboard/CommunityInfoWidget";
import { YuranStatusWidget } from "@/components/dashboard/YuranStatusWidget";
import { UpcomingActivitiesWidget } from "@/components/dashboard/UpcomingActivitiesWidget";

const Dashboard = () => {
  const { user, profile, roles, loading: authLoading } = useAuth();
  const { handleError } = useErrorHandler();
  const navigate = useNavigate();

  const ROLE_LABELS: Record<string, string> = {
    pengerusi: "Pengerusi",
    naib_pengerusi: "Naib Pengerusi",
    setiausaha: "Setiausaha",
    penolong_setiausaha: "Penolong Setiausaha",
    bendahari: "Bendahari",
    ajk: "Ahli Jawatankuasa",
    ahli: "Ahli"
  };

  const roleLabel = roles && roles.length > 0 
    ? roles.map(r => ROLE_LABELS[r.role] || r.role).join(", ")
    : "Ahli";
    
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Date range filter for dashboard
  const [dateRangeFilter, setDateRangeFilter] = useState<"today" | "week" | "month" | "all">("month");

  // React Query hooks
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats(dateRangeFilter);
  const { data: financeChartData, isLoading: financeLoading, error: financeError } = useFinanceData();
  
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [memberGrowthData, setMemberGrowthData] = useState<{ name: string; ahli: number }[]>([]);
  const [recentIncomes, setRecentIncomes] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [memberIndex, setMemberIndex] = useState<number>(1);
  
  // Combine loading states
  const loading = statsLoading || financeLoading;

  // Handle errors from React Query
  useEffect(() => {
    if (statsError) {
      handleError(statsError, {
        source: "dashboard_stats_query",
        userFacingMessage: "Gagal memuat statistik dashboard",
        showToast: false,
      });
    }
  }, [statsError, handleError]);

  useEffect(() => {
    if (financeError) {
      handleError(financeError, {
        source: "finance_data_query",
        userFacingMessage: "Gagal memuat data kewangan",
        showToast: false,
      });
    }
  }, [financeError, handleError]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?mode=login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const fetchAllData = async () => {
    try {
      // Stats and finance data are now handled by React Query
      // Only fetch the other data that's not cached
      await Promise.all([
        fetchNotifications(),
        fetchRecentData(),
        generateAIInsights(),
        fetchMemberIndex()
      ]);
    } catch (error) {
      console.error('Error fetching remaining data:', error);
    }
  };

  const fetchMemberIndex = async () => {
    if (!user || !profile) return;
    
    // Use member_number or no_ahli from profile
    setMemberIndex(profile.member_number || profile.no_ahli || 1);
  };

  const fetchNotifications = async () => {
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
  };

  const fetchRecentData = async () => {
    try {
      const [incomes, expenses, notifs, members, allProfiles] = await Promise.all([
        supabase.from("yuran_bulanan").select("*").order("tarikh_bayar", { ascending: false }).limit(5),
        supabase.from("yuran_keluar").select("*").order("tarikh", { ascending: false }).limit(5),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id, nama_penuh")
      ]);

      // Check for errors
      if (incomes.error) throw incomes.error;
      if (expenses.error) throw expenses.error;
      if (notifs.error) throw notifs.error;
      if (members.error) throw members.error;
      if (allProfiles.error) throw allProfiles.error;

      // Create profiles map for quick lookup
      const profilesMap = new Map(
        (allProfiles.data || []).map(p => [p.id, p.nama_penuh])
      );

      // Map incomes to include user_name from profiles
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
  };

  const generateAIInsights = async () => {
    try {
      // Generate insights based on actual data
      const insights: string[] = [];

      // Check for pending members
      const { count: pendingCount, error: pendingError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("status_ahli", "pending");

      if (pendingError) throw pendingError;

      if (pendingCount && pendingCount > 0) {
        insights.push(`${pendingCount} permohonan ahli baru menunggu kelulusan`);
      }

      // Check for active polls
      const { count: pollCount, error: pollError } = await supabase
        .from("polls")
        .select("*", { count: "exact", head: true })
        .eq("status", "aktif");

      if (pollError) throw pollError;

      if (pollCount && pollCount > 0) {
        insights.push(`${pollCount} undian aktif memerlukan undi anda`);
      }

      // Check recent income trend
      const currentMonth = new Date().getMonth() + 1; // Month is 1-based in yuran_bulanan
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

      // Add default insights if none found
      if (insights.length === 0) {
        insights.push('Sistem sedang berjalan dengan baik');
        insights.push('Semua anggota dalam status aktif');
      }

      setAiInsights(insights.slice(0, 3)); // Limit to 3 insights
    } catch (error) {
      handleError(error, {
        source: 'dashboard_insights',
        userFacingMessage: 'Gagal menjana pandangan',
        showToast: false,
      });
      console.error('Error generating insights:', error);
      // Set default insights on error
      setAiInsights(['Sistem sedang berjalan dengan baik']);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Mobile Menu */}
      <MobileSideMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content */}
      <div className={`relative transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-[280px]"}`}>
        <DashboardHeader
          onMenuToggle={() => setMobileMenuOpen(true)}
          showMenu={mobileMenuOpen}
          unreadNotifications={unreadNotifications}
          isDarkMode={isDarkMode}
          onThemeToggle={toggleTheme}
        />

        <main className="p-4 lg:p-8 space-y-8 pb-24 lg:pb-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <HeroSection
              userName={profile?.nama_penuh || "Pengguna"}
              memberNumber={String(profile?.member_number || profile?.no_ahli || "1")}
              memberStatus={profile?.status_ahli || "active"}
              noRumah={profile?.no_rumah || "-"}
              phone={profile?.no_telefon || "-"}
              roleLabel={roleLabel}
            />
          </motion.div>

          {/* Time Range Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={dateRangeFilter === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRangeFilter("today")}
              className="text-xs sm:text-sm"
            >
              Hari Ini
            </Button>
            <Button
              variant={dateRangeFilter === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRangeFilter("week")}
              className="text-xs sm:text-sm"
            >
              Minggu Ini
            </Button>
            <Button
              variant={dateRangeFilter === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRangeFilter("month")}
              className="text-xs sm:text-sm"
            >
              Bulan Ini
            </Button>
            <Button
              variant={dateRangeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRangeFilter("all")}
              className="text-xs sm:text-sm"
            >
              Semua
            </Button>
          </div>

          {/* Stats Cards Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
              <h2 className="text-xl font-bold text-foreground">Ringkasan Status</h2>
            </div>
            {statsLoading || !stats ? (
              <SkeletonStats />
            ) : (
              <StatsCards stats={stats} loading={statsLoading} />
            )}
          </motion.section>

          {/* Quick Actions Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="h-8 w-1 bg-gradient-to-b from-emerald-500 to-emerald-500/50 rounded-full" />
              <h2 className="text-xl font-bold text-foreground">Tindakan Pantas</h2>
            </div>
            <QuickActions />
          </motion.section>

          {/* Upcoming Activities Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <UpcomingActivitiesWidget />
          </motion.section>

          {/* Community Info & Polls Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <CommunityInfoWidget />
            <CommunityPollWidget />
          </motion.section>

          {/* Yuran Status Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <YuranStatusWidget />
          </motion.section>

          {/* Charts Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <FinanceChart data={financeChartData || []} loading={financeLoading} />
            <MemberGrowthChart data={memberGrowthData} loading={false} />
          </motion.div>

          {/* Recent Tables Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="h-8 w-1 bg-gradient-to-b from-violet-500 to-violet-500/50 rounded-full" />
              <h2 className="text-xl font-bold text-foreground">Data Terkini</h2>
            </div>
            <RecentTables
              incomes={recentIncomes}
              expenses={recentExpenses}
              announcements={announcements}
              members={recentMembers}
              loading={loading}
            />
          </motion.section>
        </main>

        <DashboardFooter />
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Dashboard;
