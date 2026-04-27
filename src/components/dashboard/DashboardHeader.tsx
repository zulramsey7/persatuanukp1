import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePWA } from "@/hooks/usePWA";
import {
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  Download,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface DashboardHeaderProps {
  onMenuToggle: () => void;
  showMenu: boolean;
  unreadNotifications: number;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export function DashboardHeader({
  onMenuToggle,
  showMenu,
  unreadNotifications,
  isDarkMode,
  onThemeToggle
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { isInstallable, install } = usePWA();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Log Keluar Berjaya",
      description: "Sehingga jumpa lagi!",
    });
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({
        title: "Carian",
        description: `Mencari "${searchQuery}"...`,
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuToggle}
          >
            {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari ahli, aktiviti, dokumen..."
                className="pl-10 w-80 bg-muted/50 border-0 focus-visible:ring-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {isInstallable && (
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex gap-2 mr-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
              onClick={install}
            >
              <Download className="w-4 h-4" />
              Pasang App
            </Button>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            className="rounded-full"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            onClick={() => navigate("/notifikasi")}
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium"
              >
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </motion.span>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile?.nama_penuh?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.nama_penuh || "Pengguna"}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profil")}>
                Profil Saya
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/kewangan")}>
                Kewangan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/notifikasi")}>
                Notifikasi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/tetapan")}>
                <Settings className="w-4 h-4 mr-2" />
                Tetapan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                Log Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}