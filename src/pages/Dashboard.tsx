import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useDashboardData } from "@/hooks/useDashboardData";
import { ROLE_LABELS } from "@/lib/constants";
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
  
  // Custom hook for other dashboard data
  const {
    unreadNotifications,
    recentIncomes,
    recentExpenses,
    announcements,
    recentMembers,
    aiInsights,
    memberIndex,
    memberGrowthData,
    isLoading: otherDataLoading,
    refreshData
  } = useDashboardData();
  
  // Combine loading states
  const loading = statsLoading || financeLoading || otherDataLoading;

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
              uuid={profile?.id}
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
