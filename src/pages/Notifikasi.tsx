import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Loader2
} from "lucide-react";

interface Notification {
  id: string;
  tajuk: string;
  mesej: string;
  jenis: string;
  dibaca: boolean;
  created_at: string;
  user_id: string | null;
}

const Notifikasi = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?mode=login");
        return;
      }
      setUserId(session.user.id);
      fetchNotifications(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('notifikasi-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications' 
      }, () => {
        fetchNotifications(userId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchNotifications = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`user_id.eq.${uid},user_id.is.null`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ dibaca: true })
        .eq("id", id);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, dibaca: true } : n)
      );
    } catch (error) {
      console.error("Error marking as read:", error);
      toast({
        title: "Ralat",
        description: "Gagal menanda notifikasi sebagai dibaca.",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    
    try {
      const unreadIds = notifications.filter(n => !n.dibaca).map(n => n.id);
      
      if (unreadIds.length === 0) {
        toast({
          title: "Info",
          description: "Semua notifikasi sudah dibaca.",
        });
        return;
      }

      const { error } = await supabase
        .from("notifications")
        .update({ dibaca: true })
        .in("id", unreadIds);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, dibaca: true })));
      toast({
        title: "Berjaya",
        description: "Semua notifikasi ditanda sebagai dibaca.",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "Ralat",
        description: "Gagal menanda semua notifikasi.",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (jenis: string) => {
    switch (jenis) {
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return "Baru sahaja";
    if (diffInMinutes < 60) return `${diffInMinutes} minit lepas`;
    if (diffInHours < 24) return `${diffInHours} jam lepas`;
    if (diffInDays < 7) return `${diffInDays} hari lepas`;
    return date.toLocaleDateString('ms-MY');
  };

  const unreadCount = notifications.filter(n => !n.dibaca).length;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 pb-24">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Notifikasi</h1>
              <p className="text-muted-foreground text-sm">
                {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua dibaca"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              className="rounded-full gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Tanda Semua</span>
            </Button>
          )}
        </div>
      </header>

      <main className="relative z-10 px-4 space-y-3">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FloatingCard className="p-12 text-center">
              <BellOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Tiada Notifikasi</h3>
              <p className="text-muted-foreground">
                Anda akan menerima pemberitahuan di sini apabila ada aktiviti baharu.
              </p>
            </FloatingCard>
          </motion.div>
        ) : (
          <AnimatePresence>
            {notifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
              >
                <FloatingCard 
                  className={`p-4 cursor-pointer transition-all ${
                    !notif.dibaca 
                      ? "border-primary/30 bg-primary/5" 
                      : ""
                  }`}
                  onClick={() => !notif.dibaca && markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      !notif.dibaca ? "bg-primary/10" : "bg-muted"
                    }`}>
                      {getNotificationIcon(notif.jenis)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-medium text-foreground line-clamp-1 ${
                          !notif.dibaca ? "font-semibold" : ""
                        }`}>
                          {notif.tajuk}
                        </h4>
                        {!notif.dibaca && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notif.mesej}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {getTimeAgo(notif.created_at)}
                      </p>
                    </div>
                  </div>
                </FloatingCard>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Notifikasi;
