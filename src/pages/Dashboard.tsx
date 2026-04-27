import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useDashboardData } from "@/hooks/useDashboardData";
import { ROLE_LABELS } from "@/lib/constants";
import { SkeletonStats } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
import { MiniCalendarWidget } from "@/components/dashboard/MiniCalendarWidget";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp,
  Clock,
  ArrowRight
} from "lucide-react";

const Dashboard = () => {
  const { user, profile, roles, loading: authLoading } = useAuth();
  const { handleError } = useErrorHandler();
  const { toast } = useToast();
  const navigate = useNavigate();

  const roleLabel = roles && roles.length > 0 
    ? roles.map(r => ROLE_LABELS[r.role] || r.role).join(", ")
    : "Ahli";
    
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Date range filter for dashboard
  const [dateRangeFilter, setDateRangeFilter] = useState<"today" | "week" | "month" | "all">("month");

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    memberGrowthData,
    isLoading: otherDataLoading
  } = useDashboardData();
  
  // Combine loading states
  const loading = statsLoading || financeLoading || otherDataLoading;

  // Automatic Renewal/Payment Alert
  useEffect(() => {
    if (!loading && profile && profile.status_ahli !== "active") {
      const lastAlert = localStorage.getItem(`yuran_alert_${profile.id}`);
      const today = new Date().toDateString();
      
      if (lastAlert !== today) {
        setTimeout(() => {
          toast({
            title: "Peringatan Mesra: Yuran & Keahlian",
            description: "Status keahlian anda kini tidak aktif. Sila jelaskan yuran tertunggak untuk mengaktifkan semula kad digital anda.",
            variant: "destructive",
          });
          localStorage.setItem(`yuran_alert_${profile.id}`, today);
        }, 2000);
      }
    }
  }, [loading, profile, toast]);

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

        <main className="p-4 lg:p-8 space-y-6 pb-24 lg:pb-8">
          {/* Offline Alert */}
          {isOffline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3 text-amber-600 dark:text-amber-400"
            >
              <div className="bg-amber-500 rounded-full p-1">
                <Clock className="w-3 h-3 text-white" />
              </div>
              <p className="text-xs font-medium">
                Anda sedang di luar talian. Kad Digital dipaparkan menggunakan data simpanan (cache).
              </p>
            </motion.div>
          )}

          {/* Hero Section - Always Visible */}
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

          {/* Quick Actions - Always Visible */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <div className="h-6 w-1 bg-emerald-500 rounded-full" />
                <h2 className="text-lg font-bold text-foreground">Akses Pantas</h2>
              </div>
            </div>
            <QuickActions />
          </motion.section>

          {/* Tabbed Content */}
          <Tabs defaultValue="status" className="w-full space-y-6">
            <div className="sticky top-[64px] z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 -mx-4 px-4 border-b lg:static lg:bg-transparent lg:p-0 lg:border-0">
              <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="status" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Status</span>
                </TabsTrigger>
                <TabsTrigger value="komuniti" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Komuniti</span>
                </TabsTrigger>
                <TabsTrigger value="laporan" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Laporan</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab 1: Summary & Personal Status */}
            <TabsContent value="status" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
              {/* Time Range Filter */}
              <div className="flex items-center justify-between flex-wrap gap-3 bg-card/50 p-3 rounded-2xl border border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium ml-1">
                  <Clock className="w-4 h-4" />
                  <span>Tempoh Data:</span>
                </div>
                <div className="flex gap-1">
                  {(["today", "week", "month", "all"] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={dateRangeFilter === filter ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setDateRangeFilter(filter)}
                      className={cn(
                        "text-xs px-3 h-8 rounded-lg",
                        dateRangeFilter === filter ? "shadow-sm" : "hover:bg-muted"
                      )}
                    >
                      {filter === "today" ? "Hari" : filter === "week" ? "Minggu" : filter === "month" ? "Bulan" : "Semua"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-5 w-1 bg-primary rounded-full" />
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Ringkasan Persatuan</h3>
                </div>
                {statsLoading || !stats ? (
                  <SkeletonStats />
                ) : (
                  <StatsCards stats={stats} loading={statsLoading} />
                )}
              </div>

              {/* Yuran Status */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-5 w-1 bg-amber-500 rounded-full" />
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Status Yuran Saya</h3>
                </div>
                <YuranStatusWidget />
              </div>
            </TabsContent>

            {/* Tab 2: Community & Activities */}
            <TabsContent value="komuniti" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
              {/* Mini Calendar & Upcoming Activities Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-5 w-1 bg-orange-500 rounded-full" />
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Kalendar Aktiviti</h3>
                  </div>
                  <MiniCalendarWidget />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-1 bg-blue-500 rounded-full" />
                      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Aktiviti Akan Datang</h3>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/kalendar")} className="text-primary gap-1 h-7 text-xs">
                      Lihat Semua <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                  <UpcomingActivitiesWidget />
                </div>
              </div>

              {/* Community Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-5 w-1 bg-indigo-500 rounded-full" />
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Maklumat Komuniti</h3>
                  </div>
                  <CommunityInfoWidget />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-5 w-1 bg-rose-500 rounded-full" />
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Undian Penduduk</h3>
                  </div>
                  <CommunityPollWidget />
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Data & Reports */}
            <TabsContent value="laporan" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
              {/* Charts */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-5 w-1 bg-violet-500 rounded-full" />
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Analisis & Trend</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FinanceChart data={financeChartData || []} loading={financeLoading} />
                  <MemberGrowthChart data={memberGrowthData} loading={false} />
                </div>
              </div>

              {/* Recent Tables */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-1 bg-cyan-500 rounded-full" />
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Log Aktiviti Terkini</h3>
                  </div>
                </div>
                <RecentTables
                  incomes={recentIncomes}
                  expenses={recentExpenses}
                  announcements={announcements}
                  members={recentMembers}
                  loading={loading}
                />
              </div>
            </TabsContent>
          </Tabs>
        </main>

        <DashboardFooter />
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Dashboard;
