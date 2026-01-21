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
  Plus,
  Image as ImageIcon,
  Trash2,
  Calendar,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";
import { Database } from "@/integrations/supabase/types";

type GaleriAktiviti = Database["public"]["Tables"]["galeri_aktiviti"]["Row"];

const GalleryManagement = () => {
  const [gallery, setGallery] = useState<GaleriAktiviti[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GaleriAktiviti | null>(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [newItem, setNewItem] = useState({
    tajuk: "",
    deskripsi: "",
    image_url: "",
    tarikh_event: "",
  });

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const { data, error } = await supabase
        .from("galeri_aktiviti")
        .select("*")
        .order("tarikh_event", { ascending: false });

      if (error) throw error;
      setGallery(data || []);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      toast({
        title: "Ralat",
        description: "Gagal memuat galeri",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.tajuk || !newItem.image_url || !newItem.tarikh_event) {
      toast({
        title: "Ralat",
        description: "Sila isi semua maklumat yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("galeri_aktiviti").insert({
        tajuk: newItem.tajuk,
        deskripsi: newItem.deskripsi || null,
        image_url: newItem.image_url,
        tarikh_event: newItem.tarikh_event,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Gambar telah ditambah ke galeri",
      });

      setDialogOpen(false);
      setNewItem({
        tajuk: "",
        deskripsi: "",
        image_url: "",
        tarikh_event: "",
      });
      fetchGallery();
    } catch (error) {
      console.error("Error adding gallery item:", error);
      toast({
        title: "Ralat",
        description: "Gagal menambah gambar",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      const { error } = await supabase
        .from("galeri_aktiviti")
        .delete()
        .eq("id", selectedItem.id);

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Gambar telah dipadam",
      });

      setDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchGallery();
    } catch (error) {
      console.error("Error deleting gallery item:", error);
      toast({
        title: "Ralat",
        description: "Gagal memadam gambar",
        variant: "destructive",
      });
    }
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
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Galeri Aktiviti</h2>
          <p className="text-sm text-muted-foreground">{gallery.length} gambar</p>
        </div>
        
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Tambah Gambar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Gambar Aktiviti</DialogTitle>
                <DialogDescription>
                  Muat naik gambar aktiviti persatuan
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tajuk Aktiviti</Label>
                  <Input
                    placeholder="Contoh: Gotong-royong Perdana 2024"
                    value={newItem.tajuk}
                    onChange={(e) => setNewItem({ ...newItem, tajuk: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL Gambar</Label>
                  <Input
                    placeholder="https://..."
                    value={newItem.image_url}
                    onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Masukkan URL gambar dari perkhidmatan hosting seperti Imgur atau Cloudinary
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tarikh Aktiviti</Label>
                  <Input
                    type="date"
                    value={newItem.tarikh_event}
                    onChange={(e) => setNewItem({ ...newItem, tarikh_event: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Deskripsi (Pilihan)</Label>
                  <Textarea
                    placeholder="Maklumat tambahan tentang aktiviti..."
                    value={newItem.deskripsi}
                    onChange={(e) => setNewItem({ ...newItem, deskripsi: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddItem}>Tambah</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gallery.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <FloatingCard className="overflow-hidden group">
              <div className="aspect-video relative">
                <img
                  src={item.image_url}
                  alt={item.tajuk}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Tiada+Gambar";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {isAdmin && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="w-8 h-8 rounded-full"
                      onClick={() => {
                        setSelectedItem(item);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-foreground line-clamp-1">{item.tajuk}</h3>
                {item.deskripsi && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {item.deskripsi}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(item.tarikh_event), "dd MMMM yyyy", { locale: ms })}
                </div>
              </div>
            </FloatingCard>
          </motion.div>
        ))}
      </div>

      {gallery.length === 0 && (
        <FloatingCard className="p-8">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Tiada gambar dalam galeri</p>
            {isAdmin && (
              <Button className="mt-4 gap-2" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                Tambah Gambar Pertama
              </Button>
            )}
          </div>
        </FloatingCard>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Padam Gambar</DialogTitle>
            <DialogDescription>
              Adakah anda pasti mahu memadam "{selectedItem?.tajuk}"? 
              Tindakan ini tidak boleh dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              Padam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryManagement;
