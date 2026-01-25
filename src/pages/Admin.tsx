import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Users, 
  Wallet, 
  Image as ImageIcon, 
  Vote, 
  Bell,
  ArrowLeft,
  Shield,
  LogOut,
  QrCode
} from "lucide-react";
import MemberManagement from "@/components/admin/MemberManagement";
import FinanceManagement from "@/components/admin/FinanceManagement";
import GalleryManagement from "@/components/admin/GalleryManagement";
import PollManagement from "@/components/admin/PollManagement";
import NotificationManagement from "@/components/admin/NotificationManagement";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const { user, profile, roles, loading, isAdmin, isPengerusi, isBendahari, isAJK, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "ahli");

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (activeTab !== params.get("tab")) {
      params.set("tab", activeTab);
      navigate({ search: params.toString() }, { replace: true });
    }
  }, [activeTab, navigate, searchParams]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?mode=login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak mempunyai kebenaran untuk mengakses halaman ini",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [isAdmin, loading, user, navigate, toast]);

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Log Keluar Berjaya",
      description: "Sehingga jumpa lagi!",
    });
    navigate("/");
  };

  const getRoleBadge = () => {
    if (isPengerusi) return "Pengerusi";
    if (isBendahari) return "Bendahari";
    if (isAJK) return "AJK";
    return "Ahli";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 md:px-6 pt-6 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h1 className="text-xl font-bold text-foreground">Panel Pentadbir</h1>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">{profile?.nama_penuh}</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {getRoleBadge()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => navigate("/imbas-qr")}
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Imbas QR</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 md:px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <FloatingCard className="p-2 mb-6 overflow-x-auto">
              <TabsList className="grid w-full grid-cols-5 min-w-[500px]">
                <TabsTrigger value="ahli" className="gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Ahli</span>
                </TabsTrigger>
                <TabsTrigger value="kewangan" className="gap-2">
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Kewangan</span>
                </TabsTrigger>
                <TabsTrigger value="galeri" className="gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Galeri</span>
                </TabsTrigger>
                <TabsTrigger value="undian" className="gap-2">
                  <Vote className="w-4 h-4" />
                  <span className="hidden sm:inline">Undian</span>
                </TabsTrigger>
                <TabsTrigger value="pengumuman" className="gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Pengumuman</span>
                </TabsTrigger>
              </TabsList>
            </FloatingCard>

            <TabsContent value="ahli">
              <MemberManagement />
            </TabsContent>

            <TabsContent value="kewangan">
              <FinanceManagement />
            </TabsContent>

            <TabsContent value="galeri">
              <GalleryManagement />
            </TabsContent>

            <TabsContent value="undian">
              <PollManagement />
            </TabsContent>

            <TabsContent value="pengumuman">
              <NotificationManagement />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
