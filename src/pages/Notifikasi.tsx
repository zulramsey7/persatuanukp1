import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Loader2,
  X,
  Calendar,
  Clock
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
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showNotification, permission, requestPermission } = useNotifications();

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
        // We rely on RLS at the database level to filter notifications.
        // For efficiency, we could use a filter: `user_id=eq.${userId}`, 
        // but that would exclude global notifications (where user_id is null).
      }, (payload) => {
        fetchNotifications(userId);
        
        if (payload.eventType === 'INSERT') {
          const newNotif = payload.new as Notification;
          // Client-side sanity check
          if (newNotif.user_id === userId || newNotif.user_id === null) {
            // Show browser notification
            showNotification(newNotif.tajuk, {
              body: newNotif.mesej,
              tag: newNotif.id
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, showNotification]);

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

  const openNotificationDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailModalOpen(true);
    
    // Mark as read if unread
    if (!notification.dibaca) {
      markAsRead(notification.id);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedNotification(null);
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
    return date.toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFullDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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
      {/* Background decorations - Optimized for mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-4 w-48 h-48 bg-primary/20 rounded-full blur-3xl sm:w-72 sm:left-10" />
        <div className="absolute bottom-40 right-4 w-64 h-64 bg-accent/20 rounded-full blur-3xl sm:w-96 sm:right-10" />
      </div>

      {/* Header - Mobile optimized */}
      <header className="relative z-10 px-3 pt-4 pb-3 sm:px-4 sm:pt-6 sm:pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground sm:text-xl">Notifikasi</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua dibaca"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              className="rounded-full gap-1 h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
              onClick={markAllAsRead}
            >
              <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Tanda Semua</span>
            </Button>
          )}
        </div>
      </header>

      <main className="relative z-10 px-3 space-y-3 sm:px-4 sm:space-y-4">
        {/* Permission Banner - Only show if permission is 'default' */}
        {permission === "default" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FloatingCard className="p-3 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/30 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400 sm:p-2">
                  <BellOff className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-100 sm:text-sm">
                    Aktifkan Notifikasi Pelayar
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mb-2 sm:mb-3">
                    Dapatkan makluman pengumuman penting terus ke skrin telefon anda.
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50 text-xs"
                    onClick={requestPermission}
                  >
                    Benarkan Notifikasi
                  </Button>
                </div>
              </div>
            </FloatingCard>
          </motion.div>
        )}

        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FloatingCard className="p-8 text-center sm:p-12">
              <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-3 sm:w-16 sm:h-16 sm:mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-2 sm:text-lg">Tiada Notifikasi</h3>
              <p className="text-muted-foreground text-sm">
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
                  className={`p-3 cursor-pointer transition-all sm:p-4 ${
                    !notif.dibaca 
                      ? "border-primary/30 bg-primary/5" 
                      : ""
                  }`}
                  onClick={() => openNotificationDetail(notif)}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 sm:w-10 sm:h-10 ${
                      !notif.dibaca ? "bg-primary/10" : "bg-muted"
                    }`}>
                      {getNotificationIcon(notif.jenis)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-medium text-foreground line-clamp-1 text-sm sm:text-base ${
                          !notif.dibaca ? "font-semibold" : ""
                        }`}>
                          {notif.tajuk}
                        </h4>
                        {!notif.dibaca && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5 sm:mt-2" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 sm:text-sm">
                        {notif.mesej}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5 sm:mt-2">
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

      {/* Notification Detail Modal - Mobile optimized */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-[95vw] w-full mx-auto rounded-2xl sm:max-w-md">
          {selectedNotification && (
            <>
              <DialogHeader className="pb-3 sm:pb-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 sm:w-12 sm:h-12 ${
                    !selectedNotification.dibaca ? "bg-primary/10" : "bg-muted"
                  }`}>
                    {getNotificationIcon(selectedNotification.jenis)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-base font-semibold text-left leading-tight sm:text-lg">
                      {selectedNotification.tajuk}
                    </DialogTitle>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 sm:gap-2 sm:text-sm">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="line-clamp-2">{getFullDateTime(selectedNotification.created_at)}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="mt-3 sm:mt-4">
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                  <DialogDescription className="text-sm text-foreground leading-relaxed sm:text-base">
                    {selectedNotification.mesej}
                  </DialogDescription>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t sm:mt-6 sm:pt-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      selectedNotification.dibaca ? "bg-green-500" : "bg-primary"
                    }`} />
                    <span className="text-xs text-muted-foreground sm:text-sm">
                      {selectedNotification.dibaca ? "Telah dibaca" : "Belum dibaca"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{getTimeAgo(selectedNotification.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2 mt-4 sm:mt-6">
                {!selectedNotification.dibaca && (
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto text-xs sm:text-sm"
                    onClick={() => {
                      markAsRead(selectedNotification.id);
                      setSelectedNotification(prev => prev ? { ...prev, dibaca: true } : null);
                    }}
                  >
                    Tanda Dibaca
                  </Button>
                )}
                <Button 
                  onClick={closeDetailModal}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  Tutup
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
    </div>
  );
};

export default Notifikasi;
