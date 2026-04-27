import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  Calendar,
  Bell,
  User,
  X,
  Home,
  Image,
  Settings,
  LogOut,
  Users,
  MessageSquare,
  Download,
  Phone,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePWA } from "@/hooks/usePWA";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function MobileBottomNav() {
  const location = useLocation();
  const { } = useAuth();

  const bottomNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Wallet, label: "Kewangan", path: "/kewangan" },
    { icon: Bell, label: "Notifikasi", path: "/notifikasi" },
    { icon: User, label: "Profil", path: "/profil" },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      role="navigation"
      aria-label="Navigasi Bawah"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-lg border-t border-border safe-bottom"
    >
      <div className="flex items-center justify-around py-3">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-3 rounded-2xl transition-all",
                isActive && "bg-primary/10"
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}

interface MobileSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSideMenu({ isOpen, onClose }: MobileSideMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isPengerusi, isSetiausaha, isNaibPengerusi, isBendahari, isAdmin, canManageMembers } = useAuth();
  const { isInstallable, install } = usePWA();
  const { toast } = useToast();

  const navGroups = [
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
        { icon: Download, label: "Dokumen Awam", path: "/dokumen" },
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
          { icon: Users, label: "Urus Ahli", path: "/admin?tab=ahli" },
        ] : []),
        ...(isAdmin ? [
          { icon: Download, label: "Laporan Sistem", path: "/laporan" }
        ] : []),
      ]
    }] : []),
    {
      title: "Lain-lain",
      items: [
        { icon: Settings, label: "Tetapan Aplikasi", path: "/tetapan" },
      ]
    }
  ];

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Log Keluar Berjaya",
      description: "Sehingga jumpa lagi!",
    });
    navigate("/");
    onClose();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-card border-r border-border lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border safe-top">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">e-Penduduk</h1>
                  <p className="text-xs text-muted-foreground">Panel Pengurusan</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile */}
            <div className="flex-shrink-0 p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile?.nama_penuh?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">
                    {profile?.nama_penuh || "Pengguna"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-6 pb-28 safe-bottom">
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <h3 className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    {group.title}
                  </h3>
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.path + item.label}
                        onClick={() => handleNavigate(item.path)}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Logout */}
            <div className="flex-shrink-0 p-4 border-t border-border bg-card safe-bottom">
              {isInstallable && (
                <button
                  onClick={() => {
                    install();
                    onClose();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 mb-2 rounded-xl text-primary hover:bg-primary/10 transition-all"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-medium">Pasang Aplikasi</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Log Keluar</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
