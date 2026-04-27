import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus,
  Bell,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle,
  Send
} from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";
import { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const jenisOptions = [
  { value: "info", label: "Maklumat", icon: Info, color: "text-blue-600 bg-blue-500/20" },
  { value: "amaran", label: "Amaran", icon: AlertTriangle, color: "text-yellow-600 bg-yellow-500/20" },
  { value: "kejayaan", label: "Kejayaan", icon: CheckCircle, color: "text-green-600 bg-green-500/20" },
];

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [newNotification, setNewNotification] = useState({
    tajuk: "",
    mesej: "",
    jenis: "info",
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .is("user_id", null) // Global notifications
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Ralat",
        description: "Gagal memuat notifikasi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.tajuk || !newNotification.mesej) {
      toast({
        title: "Ralat",
        description: "Sila isi semua maklumat yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("notifications").insert({
        tajuk: newNotification.tajuk,
        mesej: newNotification.mesej,
        jenis: newNotification.jenis,
        user_id: null, // Global notification
      });

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Notifikasi telah dihantar kepada semua ahli",
      });

      setDialogOpen(false);
      setNewNotification({
        tajuk: "",
        mesej: "",
        jenis: "info",
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error creating notification:", error);
      toast({
        title: "Ralat",
        description: "Gagal menghantar notifikasi",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNotification = async () => {
    if (!selectedNotification) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", selectedNotification.id);

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Notifikasi telah dipadam",
      });

      setDeleteDialogOpen(false);
      setSelectedNotification(null);
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Ralat",
        description: "Gagal memadam notifikasi",
        variant: "destructive",
      });
    }
  };

  const getJenisInfo = (jenis: string) => {
    return jenisOptions.find(j => j.value === jenis) || jenisOptions[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pengumuman</h2>
          <p className="text-sm text-muted-foreground">{notifications.length} pengumuman</p>
        </div>
        
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Hantar Pengumuman
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hantar Pengumuman Baru</DialogTitle>
                <DialogDescription>
                  Pengumuman akan dihantar kepada semua ahli persatuan
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tajuk</Label>
                  <Input
                    placeholder="Contoh: Mesyuarat Agung Tahunan"
                    value={newNotification.tajuk}
                    onChange={(e) => setNewNotification({ ...newNotification, tajuk: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jenis</Label>
                  <Select
                    value={newNotification.jenis}
                    onValueChange={(value) => setNewNotification({ ...newNotification, jenis: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {jenisOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="w-4 h-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mesej</Label>
                  <Textarea
                    placeholder="Tulis mesej pengumuman..."
                    rows={4}
                    value={newNotification.mesej}
                    onChange={(e) => setNewNotification({ ...newNotification, mesej: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreateNotification} className="gap-2">
                  <Send className="w-4 h-4" />
                  Hantar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification, index) => {
          const jenisInfo = getJenisInfo(notification.jenis);
          const IconComponent = jenisInfo.icon;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <FloatingCard className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${jenisInfo.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{notification.tajuk}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{notification.mesej}</p>
                      </div>
                      
                      {isAdmin && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 flex-shrink-0"
                          onClick={() => {
                            setSelectedNotification(notification);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(notification.created_at), "dd MMMM yyyy, HH:mm", { locale: ms })}
                    </p>
                  </div>
                </div>
              </FloatingCard>
            </motion.div>
          );
        })}
      </div>

      {notifications.length === 0 && (
        <FloatingCard className="p-8">
          <div className="text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Tiada pengumuman</p>
            {isAdmin && (
              <Button className="mt-4 gap-2" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                Hantar Pengumuman Pertama
              </Button>
            )}
          </div>
        </FloatingCard>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Padam Pengumuman</DialogTitle>
            <DialogDescription>
              Adakah anda pasti mahu memadam pengumuman "{selectedNotification?.tajuk}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteNotification}>
              Padam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationManagement;
