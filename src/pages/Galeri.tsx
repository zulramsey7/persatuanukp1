import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Image as ImageIcon,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface GaleriItem {
  id: string;
  tajuk: string;
  deskripsi: string | null;
  image_url: string;
  tarikh_event: string;
  created_at: string;
}

const Galeri = () => {
  const [items, setItems] = useState<GaleriItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?mode=login");
        return;
      }
      fetchGaleri();
    };
    checkAuth();
  }, [navigate]);

  const fetchGaleri = async () => {
    try {
      const { data, error } = await supabase
        .from("galeri_aktiviti")
        .select("*")
        .order("tarikh_event", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching galeri:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < items.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
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

  const selectedItem = selectedIndex !== null ? items[selectedIndex] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 pb-24">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-6 pb-4">
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
            <h1 className="text-xl font-bold text-foreground">Galeri Aktiviti</h1>
            <p className="text-muted-foreground text-sm">{items.length} gambar</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4">
        {items.length === 0 ? (
          <FloatingCard className="p-12 text-center">
            <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Tiada Gambar</h3>
            <p className="text-muted-foreground text-sm">
              Gambar aktiviti komuniti akan dipaparkan di sini.
            </p>
          </FloatingCard>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedIndex(index)}
                className="cursor-pointer"
              >
                <FloatingCard className="p-0 overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={item.image_url}
                      alt={item.tajuk}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-medium text-sm line-clamp-1">{item.tajuk}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-white/70" />
                        <span className="text-white/70 text-xs">
                          {new Date(item.tarikh_event).toLocaleDateString('ms-MY')}
                        </span>
                      </div>
                    </div>
                  </div>
                </FloatingCard>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none rounded-3xl overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedItem && (
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative"
              >
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-20 text-white hover:bg-white/20 rounded-full"
                  onClick={() => setSelectedIndex(null)}
                >
                  <X className="w-5 h-5" />
                </Button>

                {/* Navigation Buttons */}
                {selectedIndex !== null && selectedIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 rounded-full"
                    onClick={handlePrev}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                )}
                {selectedIndex !== null && selectedIndex < items.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 rounded-full"
                    onClick={handleNext}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                )}

                {/* Image */}
                <div className="aspect-video relative">
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.tajuk}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </div>

                {/* Info */}
                <div className="p-6 text-white">
                  <h2 className="text-xl font-bold mb-2">{selectedItem.tajuk}</h2>
                  {selectedItem.deskripsi && (
                    <p className="text-white/80 mb-3">{selectedItem.deskripsi}</p>
                  )}
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(selectedItem.tarikh_event).toLocaleDateString('ms-MY', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
    </div>
  );
};

export default Galeri;
