import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  Users,
  Info,
  Calendar,
  Bell,
  Building2,
  Vote,
  MessageSquare,
  ImageIcon,
  Phone,
  Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ActionStats {
  pendingPayments: number;
  totalMembers: number;
  unreadNotifications: number;
  activePolls: number;
  galleryCount: number;
}

export function QuickActions() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<ActionStats>({
    pendingPayments: 0,
    totalMembers: 0,
    unreadNotifications: 0,
    activePolls: 0,
    galleryCount: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [
        pendingPaymentsRes,
        membersRes,
        notificationsRes,
        pollsRes,
        galleryRes
      ] = await Promise.all([
        // Get user's pending payments
        supabase
          .from("yuran_bulanan")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user?.id)
          .eq("status", "belum_bayar"),
        // Get total members count
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("status_ahli", "active"),
        // Get unread notifications
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .or(`user_id.eq.${user?.id},user_id.is.null`)
          .eq("dibaca", false),
        // Get active polls
        supabase
          .from("polls")
          .select("*", { count: "exact", head: true })
          .eq("status", "aktif"),
        // Get gallery count
        supabase
          .from("galeri_aktiviti")
          .select("*", { count: "exact", head: true })
      ]);

      setStats({
        pendingPayments: pendingPaymentsRes.count || 0,
        totalMembers: membersRes.count || 0,
        unreadNotifications: notificationsRes.count || 0,
        activePolls: pollsRes.count || 0,
        galleryCount: galleryRes.count || 0
      });
    } catch (error) {
      console.error("Error fetching quick action stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const actions = [
    {
      icon: Wallet,
      label: "Bayar Yuran",
      path: "/kewangan",
      gradient: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      badge: stats.pendingPayments > 0 ? stats.pendingPayments : null,
      badgeColor: "bg-amber-500"
    },
    {
      icon: Users,
      label: "Direktori Ahli",
      path: "/direktori",
      gradient: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      badge: stats.totalMembers > 0 ? stats.totalMembers : null,
      badgeColor: "bg-blue-500"
    },
    {
      icon: Bell,
      label: "Notifikasi",
      path: "/notifikasi",
      gradient: "from-rose-500 to-pink-600",
      bgColor: "bg-rose-50 dark:bg-rose-900/20",
      badge: stats.unreadNotifications > 0 ? stats.unreadNotifications : null,
      badgeColor: "bg-rose-500"
    },
    {
      icon: Vote,
      label: "Undian",
      path: "/undian",
      gradient: "from-indigo-500 to-blue-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      badge: stats.activePolls > 0 ? stats.activePolls : null,
      badgeColor: "bg-indigo-500"
    },
    {
      icon: ImageIcon,
      label: "Galeri",
      path: "/galeri",
      gradient: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-50 dark:bg-violet-900/20",
      badge: stats.galleryCount > 0 ? stats.galleryCount : null,
      badgeColor: "bg-violet-500"
    },
    {
      icon: Calendar,
      label: "Kalendar",
      path: "/kalendar",
      gradient: "from-orange-500 to-amber-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      badge: null,
      badgeColor: ""
    },
    {
      icon: Info,
      label: "Profil",
      path: "/profil",
      gradient: "from-teal-500 to-cyan-600",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
      badge: null,
      badgeColor: ""
    },
    {
      icon: Phone,
      label: "Hubungi Kami",
      path: "/hubungi-kami",
      gradient: "from-slate-500 to-gray-600",
      bgColor: "bg-slate-50 dark:bg-slate-900/20",
      badge: null,
      badgeColor: ""
    },
    ...(isAdmin ? [{
      icon: Shield,
      label: "Panel Admin",
      path: "/admin",
      gradient: "from-red-500 to-rose-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      badge: null,
      badgeColor: ""
    }] : [])
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
      {actions.map((action, index) => {
        const Icon = action.icon;
        
        return (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(action.path)}
            className="quick-action relative"
          >
            <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-7 h-7 text-white" />
              {action.badge !== null && !loading && (
                <span className={`absolute -top-1 -right-1 min-w-5 h-5 ${action.badgeColor} text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-md`}>
                  {action.badge > 99 ? "99+" : action.badge}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-foreground text-center mt-2">
              {action.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
