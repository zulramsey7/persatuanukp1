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
  Phone
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePWA } from "@/hooks/usePWA";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function MobileBottomNav() {
  const location = useLocation();
  const { isPengerusi, isNaibPengerusi, isBendahari } = useAuth();

  const bottomNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    ...((isPengerusi || isNaibPengerusi || isBendahari) ? [
      { icon: Wallet, label: "Kewangan", path: "/kewangan" }
    ] : []),
    { icon: Calendar, label: "Aktiviti", path: "/kalendar" },
    { icon: Bell, label: "Notifikasi", path: "/notifikasi" },
    { icon: User, label: "Profil", path: "/profil" },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-lg border-t border-border safe-bottom"
    >
      <div className="flex items-center justify-around py-2">
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
                "p-2 rounded-xl transition-all",
                isActive && "bg-primary/10"
              )}>
                <Icon className="w-5 h-5" />
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
  const { profile, signOut, isPengerusi, isNaibPengerusi, isBendahari, isAdmin } = useAuth();
  const { isInstallable, install } = usePWA();
  const { toast } = useToast();

  const sideMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: User, label: "Profil", path: "/profil" },
    { icon: Users, label: "Direktori Ahli", path: "/direktori" },
    ...((isPengerusi || isNaibPengerusi || isBendahari) ? [
      { icon: Wallet, label: "Kewangan", path: "/kewangan" }
    ] : []),
    { icon: Calendar, label: "Aktiviti", path: "/kalendar" },
    { icon: Image, label: "Galeri", path: "/galeri" },
    { icon: MessageSquare, label: "Aduan", path: "/aduan" },
    { icon: Phone, label: "Hubungi Kami", path: "/hubungi-kami" },
    { icon: Bell, label: "Notifikasi", path: "/notifikasi" },
    { icon: Settings, label: "Tetapan", path: "/tetapan" },
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
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
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
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {sideMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <button
                    key={item.path + item.label}
                    onClick={() => handleNavigate(item.path)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="flex-shrink-0 p-4 border-t border-border bg-card">
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