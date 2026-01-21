import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, Heart, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroCommunity from "@/assets/hero-community.jpg";

interface Stats {
  totalMembers: number;
  totalActivities: number;
  totalFunds: number;
}

export function HeroSection() {
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    totalActivities: 0,
    totalFunds: 0
  });

  useEffect(() => {
    fetchStats();

    // Subscribe to realtime updates
    const profilesChannel = supabase
      .channel('landing-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats();
      })
      .subscribe();

    const galeriChannel = supabase
      .channel('landing-galeri')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'galeri_aktiviti' }, () => {
        fetchStats();
      })
      .subscribe();

    const yuranMasukChannel = supabase
      .channel('landing-yuran-masuk')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'yuran_masuk' }, () => {
        fetchStats();
      })
      .subscribe();

    const yuranKeluarChannel = supabase
      .channel('landing-yuran-keluar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'yuran_keluar' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(galeriChannel);
      supabase.removeChannel(yuranMasukChannel);
      supabase.removeChannel(yuranKeluarChannel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total active members
      const { count: membersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("status_ahli", "active");

      // Fetch total activities (current year)
      const currentYear = new Date().getFullYear();
      const { count: activitiesCount } = await supabase
        .from("galeri_aktiviti")
        .select("*", { count: "exact", head: true })
        .gte("tarikh_event", `${currentYear}-01-01`)
        .lte("tarikh_event", `${currentYear}-12-31`);

      // Fetch total income (yuran_masuk with status 'dibayar')
      const { data: incomeData } = await supabase
        .from("yuran_masuk")
        .select("jumlah")
        .eq("status", "dibayar");

      const totalIncome = incomeData?.reduce((acc, item) => acc + Number(item.jumlah), 0) || 0;

      // Fetch total expenses
      const { data: expenseData } = await supabase
        .from("yuran_keluar")
        .select("jumlah");

      const totalExpenses = expenseData?.reduce((acc, item) => acc + Number(item.jumlah), 0) || 0;

      setStats({
        totalMembers: membersCount || 0,
        totalActivities: activitiesCount || 0,
        totalFunds: totalIncome - totalExpenses
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `RM ${(value / 1000).toFixed(1)}k`;
    }
    return `RM ${value.toFixed(0)}`;
  };

  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroCommunity} 
          alt="Komuniti Ukay Perdana" 
          className="w-full h-full object-cover object-center scale-100 md:scale-110"
          loading="eager"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 md:from-background/90 via-background/75 md:via-background/70 to-background/95" />
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-10 w-56 md:w-72 h-56 md:h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-40 left-10 w-64 md:w-96 h-64 md:h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="container relative z-10 pt-16 md:pt-24 pb-20 md:pb-32 px-4 md:px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm text-primary text-sm font-medium mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Heart className="h-4 w-4" />
            <span>Komuniti Bersatu, Kejiranan Harmoni</span>
          </motion.div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground leading-tight mb-4 md:mb-6 drop-shadow-lg">
            Persatuan Penduduk{" "}
            <span className="text-primary">Ukay Perdana</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto drop-shadow-md">
            Platform digital untuk menguruskan keahlian, kewangan, dan aktiviti 
            komuniti dengan lebih telus dan efisien.
          </p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-semibold gradient-primary hover:opacity-90 transition-opacity"
            >
              <Link to="/auth">
                <Users className="mr-2 h-5 w-5" />
                Daftar Sekarang
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-semibold border-2"
            >
              <Link to="/auth?mode=login">
                Masuk Akaun
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-20 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {[
            { icon: Users, value: `${stats.totalMembers}+`, label: "Ahli Berdaftar" },
            { icon: Heart, value: `${stats.totalActivities}+`, label: "Aktiviti Setahun" },
            { icon: Shield, value: formatCurrency(stats.totalFunds), label: "Dana Terkumpul" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="floating-card p-4 md:p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-10 md:w-12 h-10 md:h-12 mx-auto mb-3 md:mb-4 rounded-2xl gradient-primary flex items-center justify-center">
                <stat.icon className="h-5 md:h-6 w-5 md:w-6 text-primary-foreground" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
