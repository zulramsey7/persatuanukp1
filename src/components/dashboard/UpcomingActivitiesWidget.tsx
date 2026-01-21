import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ArrowRight,
  CalendarDays,
  Banknote
} from "lucide-react";
import { format, isToday, isTomorrow, differenceInDays } from "date-fns";
import { ms } from "date-fns/locale";

interface Aktiviti {
  id: string;
  tajuk: string;
  deskripsi: string | null;
  lokasi: string | null;
  tarikh_mula: string;
  tarikh_tamat: string;
  max_peserta: number | null;
  yuran: number;
  image_url: string | null;
  status: string;
}

export const UpcomingActivitiesWidget = () => {
  const [aktiviti, setAktiviti] = useState<Aktiviti[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUpcomingActivities();
  }, []);

  const fetchUpcomingActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("aktiviti")
        .select("*")
        .eq("status", "aktif")
        .gte("tarikh_mula", new Date().toISOString())
        .order("tarikh_mula", { ascending: true })
        .limit(3);

      if (error) throw error;

      setAktiviti(data || []);

      // Fetch registration counts for each activity
      if (data && data.length > 0) {
        const { data: regData } = await supabase
          .from("pendaftaran_aktiviti")
          .select("aktiviti_id");

        const counts: Record<string, number> = {};
        (regData || []).forEach((reg) => {
          counts[reg.aktiviti_id] = (counts[reg.aktiviti_id] || 0) + 1;
        });
        setRegistrationCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Hari Ini";
    if (isTomorrow(date)) return "Esok";
    const days = differenceInDays(date, new Date());
    if (days <= 7) return `${days} hari lagi`;
    return format(date, "d MMM yyyy", { locale: ms });
  };

  const getDateBadgeColor = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "bg-red-500/10 text-red-600 border-red-500/20";
    if (isTomorrow(date)) return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    const days = differenceInDays(date, new Date());
    if (days <= 7) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    return "bg-muted text-muted-foreground border-border";
  };

  if (loading) {
    return (
      <FloatingCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-8 w-1 bg-gradient-to-b from-orange-500 to-orange-500/50 rounded-full" />
          <h2 className="text-xl font-bold text-foreground">Aktiviti Akan Datang</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 bg-muted/30 rounded-2xl">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </FloatingCard>
    );
  }

  if (aktiviti.length === 0) {
    return (
      <FloatingCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-8 w-1 bg-gradient-to-b from-orange-500 to-orange-500/50 rounded-full" />
          <h2 className="text-xl font-bold text-foreground">Aktiviti Akan Datang</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <CalendarDays className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Tiada aktiviti akan datang</p>
          <Button 
            variant="link" 
            className="mt-2"
            onClick={() => navigate("/kalendar")}
          >
            Lihat kalendar penuh
          </Button>
        </div>
      </FloatingCard>
    );
  }

  return (
    <FloatingCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-gradient-to-b from-orange-500 to-orange-500/50 rounded-full" />
          <h2 className="text-xl font-bold text-foreground">Aktiviti Akan Datang</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary hover:text-primary/80 gap-1"
          onClick={() => navigate("/kalendar")}
        >
          Lihat Semua
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {aktiviti.map((akt, index) => {
          const regCount = registrationCounts[akt.id] || 0;
          const isFull = akt.max_peserta ? regCount >= akt.max_peserta : false;

          return (
            <motion.div
              key={akt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
            >
              <div className="p-4">
                <div className="flex gap-4">
                  {/* Date Box */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary">
                    <span className="text-2xl font-bold leading-none">
                      {format(new Date(akt.tarikh_mula), "d")}
                    </span>
                    <span className="text-xs uppercase font-medium">
                      {format(new Date(akt.tarikh_mula), "MMM", { locale: ms })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {akt.tajuk}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={`flex-shrink-0 text-xs ${getDateBadgeColor(akt.tarikh_mula)}`}
                      >
                        {getDateLabel(akt.tarikh_mula)}
                      </Badge>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      {/* Time */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {format(new Date(akt.tarikh_mula), "h:mm a", { locale: ms })}
                          {" - "}
                          {format(new Date(akt.tarikh_tamat), "h:mm a", { locale: ms })}
                        </span>
                      </div>

                      {/* Location */}
                      {akt.lokasi && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="line-clamp-1">{akt.lokasi}</span>
                        </div>
                      )}

                      {/* Bottom Row */}
                      <div className="flex items-center gap-4 pt-1">
                        {/* Participants */}
                        <div className="flex items-center gap-1.5 text-sm">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className={isFull ? "text-red-500 font-medium" : "text-muted-foreground"}>
                            {regCount}
                            {akt.max_peserta && `/${akt.max_peserta}`}
                          </span>
                          {isFull && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Penuh
                            </Badge>
                          )}
                        </div>

                        {/* Fee */}
                        {akt.yuran > 0 && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Banknote className="w-3.5 h-3.5" />
                            <span>RM{akt.yuran}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hover overlay with CTA */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          );
        })}
      </div>

      {/* Quick action to view calendar */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <Button 
          variant="outline" 
          className="w-full rounded-xl gap-2 hover:bg-primary/5 hover:border-primary/30"
          onClick={() => navigate("/kalendar")}
        >
          <Calendar className="w-4 h-4" />
          Lihat Kalendar Penuh
        </Button>
      </div>
    </FloatingCard>
  );
};
