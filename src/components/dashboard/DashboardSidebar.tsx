import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Wallet,
  Calendar,
  Bell,
  User,
  Settings,
  LogOut,
  Users,
  MessageSquare,
  Phone,
  FileText,
  Home,
  HelpCircle,
  FolderOpen,
  Vote,
  UserCog,
  Image,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({ collapsed, onToggle }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut, isPengerusi, isSetiausaha, isNaibPengerusi, isBendahari, canManageMembers, isAdmin } = useAuth();
  const { toast } = useToast();

  const navGroups: NavGroup[] = [
    {
      title: "Menu Utama",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { icon: User, label: "Profil Saya", path: "/profil" },
        { icon: Bell, label: "Notifikasi", path: "/notifikasi" },
      ]
    },
    {
      title: "Komuniti & Aktiviti",
      items: [
        { icon: Users, label: "Direktori Ahli", path: "/direktori" },
        { icon: Calendar, label: "Kalendar Aktiviti", path: "/kalendar" },
        { icon: Image, label: "Galeri Komuniti", path: "/galeri" },
        { icon: Vote, label: "Sistem Undian", path: "/undian" },
        { icon: FolderOpen, label: "Dokumen Awam", path: "/dokumen" },
      ]
    },
    {
      title: "Sokongan",
      items: [
        { icon: MessageSquare, label: "Aduan & Cadangan", path: "/aduan" },
        { icon: Phone, label: "Hubungi Kami", path: "/hubungi-kami" },
      ]
    },
    ...((isPengerusi || isSetiausaha || isNaibPengerusi || isBendahari || canManageMembers || isAdmin) ? [{
      title: "Pengurusan",
      items: [
        ...((isPengerusi || isSetiausaha || isNaibPengerusi || isBendahari) ? [
          { icon: Wallet, label: "Kewangan", path: "/kewangan" },
          { icon: HelpCircle, label: "Borang Bantuan", path: "/borang-bantuan-admin" }
        ] : []),
        ...(canManageMembers ? [
          { icon: UserCog, label: "Urus Ahli", path: "/admin?tab=ahli" },
        ] : []),
        ...(isAdmin ? [
          { icon: FileText, label: "Laporan Sistem", path: "/laporan" }
        ] : []),
      ]
    }] : [])
  ];

  const bottomNavItems: NavItem[] = [
    { icon: Settings, label: "Tetapan Aplikasi", path: "/tetapan" },
  ];

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Log Keluar Berjaya",
      description: "Sehingga jumpa lagi!",
    });
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="dashboard-sidebar fixed left-0 top-0 z-50 flex flex-col h-[100dvh] overflow-visible bg-sidebar border-r border-sidebar-border"
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground">e-Penduduk</h1>
                <p className="text-xs text-sidebar-foreground/60">Panel Pengurusan</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && (
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mx-auto">
            <Home className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto min-h-0 p-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-3 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-2"
              >
                {group.title}
              </motion.h3>
            )}
            {group.items.map((item) => (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group relative",
                  isActive(item.path)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
                  collapsed && "mx-auto"
                )} />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-primary text-sidebar-primary-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}

                {item.badge && !collapsed && (
                  <span className="ml-auto px-2 py-0.5 text-[10px] bg-destructive text-destructive-foreground rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="flex-shrink-0 p-3 border-t border-sidebar-border space-y-1">
        {bottomNavItems.map((item) => (
          <Link
            key={item.path + item.label}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group relative",
              isActive(item.path)
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
              collapsed && "mx-auto"
            )} />
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-primary text-sidebar-primary-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                {item.label}
              </div>
            )}
          </Link>
        ))}

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 w-full group relative",
            "text-destructive hover:bg-destructive/10"
          )}
        >
          <LogOut className={cn(
            "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
            collapsed && "mx-auto"
          )} />
          {!collapsed && <span className="text-sm font-medium">Log Keluar</span>}
          
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-destructive text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
              Log Keluar
            </div>
          )}
        </button>
      </div>

      {/* User Profile */}
      <div className="flex-shrink-0 p-3 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-xl bg-sidebar-accent/50",
          collapsed && "justify-center"
        )}>
          <Avatar className="w-10 h-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {profile?.nama_penuh?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.nama_penuh || "Pengguna"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {profile?.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}