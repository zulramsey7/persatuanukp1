import { motion } from "framer-motion";
import { Building2, Users, Wallet, Calendar, MapPin, Phone, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CommunityStats {
  totalMembers: number;
  activeMembers: number;
  totalIncome: number;
  totalExpenses: number;
  upcomingEvents: number;
}

export function CommunityInfoWidget() {
  const [stats, setStats] = useState<CommunityStats>({
    totalMembers: 0,
    activeMembers: 0,
    totalIncome: 0,
    totalExpenses: 0,
    upcomingEvents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityStats();
  }, []);

  const fetchCommunityStats = async () => {
    try {
      const [
        totalMembersRes,
        activeMembersRes,
        incomeRes,
        expensesRes
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status_ahli", "active"),
        supabase.from("yuran_bulanan").select("jumlah").eq("status", "confirmed"),
        supabase.from("yuran_keluar").select("jumlah")
      ]);

      const totalIncome = incomeRes.data?.reduce((sum, r) => sum + Number(r.jumlah), 0) || 0;
      const totalExpenses = expensesRes.data?.reduce((sum, r) => sum + Number(r.jumlah), 0) || 0;

      setStats({
        totalMembers: totalMembersRes.count || 0,
        activeMembers: activeMembersRes.count || 0,
        totalIncome,
        totalExpenses,
        upcomingEvents: 0
      });
    } catch (error) {
      console.error("Error fetching community stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const infoItems = [
    {
      icon: Users,
      label: "Jumlah Ahli",
      value: stats.totalMembers.toString(),
      subValue: `${stats.activeMembers} aktif`,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: Wallet,
      label: "Baki Semasa",
      value: `RM ${(stats.totalIncome - stats.totalExpenses).toLocaleString()}`,
      subValue: "Dana persatuan",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      icon: Calendar,
      label: "Aktiviti",
      value: stats.upcomingEvents.toString(),
      subValue: "Akan datang",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-6 shadow-card"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Info Komuniti</h3>
          <p className="text-xs text-muted-foreground">
            Persatuan Penduduk Taman Ukay Perdana UP 1
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl shimmer" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {infoItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="p-4 rounded-xl bg-muted/30 text-center"
                >
                  <div className={`w-10 h-10 rounded-full ${item.bgColor} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <p className="text-lg font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.subValue}</p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Taman Ukay Perdana, Ampang</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">017-330 4906</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">persatuanukayperdana@gmail.com</span>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
