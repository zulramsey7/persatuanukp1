import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ImageIcon, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface GaleriItem {
  id: string;
  tajuk: string;
  deskripsi: string | null;
  image_url: string;
  tarikh_event: string;
}

export function GallerySection() {
  const [items, setItems] = useState<GaleriItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGaleri();

    // Subscribe to realtime updates
    const galeriChannel = supabase
      .channel('landing-gallery-section')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'galeri_aktiviti' }, () => {
        fetchGaleri();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(galeriChannel);
    };
  }, []);

  const fetchGaleri = async () => {
    try {
      const { data, error } = await supabase
        .from("galeri_aktiviti")
        .select("*")
        .order("tarikh_event", { ascending: false })
        .limit(6);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching galeri:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-48">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-600/50 rounded-full" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Galeri Aktiviti
            </h2>
            <div className="h-8 w-1 bg-gradient-to-b from-blue-600/50 to-transparent rounded-full" />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Lihat momen-momen indah dari aktiviti dan acara komuniti kami
          </p>
        </motion.div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-12"
          >
            <div className="flex justify-center mb-4">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
              Tiada gambar dalam galeri pada masa ini
            </p>
          </motion.div>
        ) : (
          <>
            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className="group cursor-pointer"
                >
                  <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
                    {/* Image */}
                    <img
                      src={item.image_url}
                      alt={item.tajuk}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Content overlay */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {item.tajuk}
                      </h3>
                      {item.deskripsi && (
                        <p className="text-white/90 text-sm line-clamp-2">
                          {item.deskripsi}
                        </p>
                      )}
                      <p className="text-white/70 text-xs mt-3">
                        {new Date(item.tarikh_event).toLocaleDateString("ms-MY", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Border */}
                    <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-blue-500/50 transition-colors duration-300" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* View All Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <Link to="/galeri">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Lihat Semua Galeri
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
