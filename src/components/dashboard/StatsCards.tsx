import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  Wallet,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface StatsData {
  totalMembers: number;
  pendingApprovals: number;
  netBalance: number;
  outstandingDues: number;
  totalIncome: number;
  totalExpenses: number;
  reportsCount?: number;
}

interface StatsCardsProps {
  stats: StatsData;
  loading?: boolean;
}

const statsConfig = [
  {
    key: "totalMembers" as keyof StatsData,
    label: "Jumlah Ahli",
    icon: Users,
    gradient: "from-blue-500 to-blue-600",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
    textColor: "text-blue-600 dark:text-blue-400",
    format: (val: number) => val.toString()
  },
  {
    key: "pendingApprovals" as keyof StatsData,
    label: "Menunggu Kelulusan",
    icon: UserCheck,
    gradient: "from-amber-500 to-orange-500",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
    textColor: "text-amber-600 dark:text-amber-400",
    format: (val: number) => val.toString()
  },
  {
    key: "netBalance" as keyof StatsData,
    label: "Baki Bersih",
    icon: Wallet,
    gradient: "from-emerald-500 to-green-600",
    iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
    textColor: "text-emerald-600 dark:text-emerald-400",
    format: (val: number) => `RM ${val.toLocaleString("ms-MY", { minimumFractionDigits: 2 })}`
  },
  {
    key: "outstandingDues" as keyof StatsData,
    label: "Tunggakan",
    icon: AlertCircle,
    gradient: "from-red-500 to-rose-600",
    iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
    textColor: "text-red-600 dark:text-red-400",
    format: (val: number) => `RM ${val.toLocaleString("ms-MY", { minimumFractionDigits: 2 })}`
  },
  {
    key: "totalIncome" as keyof StatsData,
    label: "Jumlah Pendapatan",
    icon: TrendingUp,
    gradient: "from-cyan-500 to-blue-500",
    iconBg: "bg-gradient-to-br from-cyan-500 to-blue-500",
    textColor: "text-cyan-600 dark:text-cyan-400",
    format: (val: number) => `RM ${val.toLocaleString("ms-MY", { minimumFractionDigits: 2 })}`
  },
  {
    key: "totalExpenses" as keyof StatsData,
    label: "Jumlah Perbelanjaan",
    icon: TrendingDown,
    gradient: "from-purple-500 to-violet-600",
    iconBg: "bg-gradient-to-br from-purple-500 to-violet-600",
    textColor: "text-purple-600 dark:text-purple-400",
    format: (val: number) => `RM ${val.toLocaleString("ms-MY", { minimumFractionDigits: 2 })}`
  },
];

export function StatsCards({ stats, loading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statsConfig.map((config, index) => {
        const Icon = config.icon;
        const value = stats[config.key];

        return (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="relative overflow-hidden rounded-2xl bg-card p-5 shadow-card hover:shadow-xl transition-all duration-300 cursor-pointer group border border-border/50"
          >
            {/* Decorative gradient overlay */}
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${config.gradient} opacity-10 rounded-bl-full -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500`} />
            
            {loading ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl shimmer" />
                <div className="h-3 w-20 rounded shimmer" />
                <div className="h-7 w-24 rounded shimmer" />
              </div>
            ) : (
              <>
                <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{config.label}</p>
                <p className={`text-xl lg:text-2xl font-bold ${config.textColor}`}>
                  {config.format(value)}
                </p>
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}