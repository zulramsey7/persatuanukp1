import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  ArrowRight
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ms } from "date-fns/locale";

interface Aktiviti {
  id: string;
  tajuk: string;
  lokasi: string | null;
  tarikh_mula: string;
  tarikh_tamat: string;
  max_peserta: number | null;
  yuran: number | null;
  status: string;
}

export function MiniCalendarWidget() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities, setActivities] = useState<Aktiviti[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchActivities();
  }, [currentMonth]);

  const fetchActivities = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from("aktiviti")
        .select("*")
        .eq("status", "aktif")
        .or(`tarikh_mula.gte.${start.toISOString()},tarikh_tamat.lte.${end.toISOString()}`)
        .order("tarikh_mula", { ascending: true });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar days
  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  // Get activities for a specific date
  const getActivitiesForDate = (date: Date): Aktiviti[] => {
    return activities.filter(akt => {
      const aktStart = new Date(akt.tarikh_mula);
      const aktEnd = new Date(akt.tarikh_tamat);
      return date >= aktStart && date <= aktEnd;
    });
  };

  // Get unique activity dates with color coding
  const getActivityColor = (date: Date): string | null => {
    const dayActivities = getActivitiesForDate(date);
    if (dayActivities.length === 0) return null;
    if (dayActivities.some(a => new Date(a.tarikh_mula) <= new Date() && new Date(a.tarikh_tamat) >= new Date())) {
      return "bg-red-500"; // Ongoing today
    }
    if (dayActivities.some(a => isSameDay(new Date(a.tarikh_mula), date))) {
      return "bg-primary"; // Starting today
    }
    return "bg-emerald-500"; // Active during this day
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const days = getDaysInMonth();
  const weekDays = ["Isn", "Sel", "Rab", "Kha", "Jum", "Sab", "Ahd"];
  const selectedActivities = selectedDate ? getActivitiesForDate(selectedDate) : [];

  if (loading) {
    return (
      <FloatingCard className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </FloatingCard>
    );
  }

  return (
    <FloatingCard className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Kalendar Aktiviti</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {format(currentMonth, "MMMM yyyy", { locale: ms })}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          const activityColor = getActivityColor(day);

          return (
            <motion.button
              key={day.toISOString()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => setSelectedDate(day)}
              className={`
                relative h-10 rounded-lg flex flex-col items-center justify-center
                transition-all duration-200
                ${!isCurrentMonth ? "text-muted-foreground/30" : "text-foreground"}
                ${isTodayDate ? "bg-primary/10 font-bold text-primary" : "hover:bg-muted/50"}
                ${selectedDate && isSameDay(day, selectedDate) ? "ring-2 ring-primary ring-offset-1" : ""}
              `}
            >
              <span className="text-sm">{format(day, "d")}</span>
              {activityColor && (
                <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${activityColor}`} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Mula</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Berlangsung</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Hari Ini</span>
        </div>
      </div>

      {/* Selected Date Activities */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border/50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                {isToday(selectedDate) ? "Hari Ini" : format(selectedDate, "EEEE, d MMMM", { locale: ms })}
              </h3>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleToday}>
                Hari Ini
              </Button>
            </div>

            {selectedActivities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Tiada aktiviti pada tarikh ini
              </p>
            ) : (
              <div className="space-y-2">
                {selectedActivities.slice(0, 2).map((akt) => (
                  <div 
                    key={akt.id}
                    className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/kalendar`)}
                  >
                    <h4 className="text-sm font-medium line-clamp-1">{akt.tajuk}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(akt.tarikh_mula), "h:mm a", { locale: ms })}</span>
                      {akt.lokasi && (
                        <>
                          <span>•</span>
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">{akt.lokasi}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {selectedActivities.length > 2 && (
                  <p className="text-xs text-center text-muted-foreground">
                    +{selectedActivities.length - 2} aktiviti lagi
                  </p>
                )}
              </div>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3 rounded-xl gap-1"
              onClick={() => navigate("/kalendar")}
            >
              Lihat Semua Aktiviti
              <ArrowRight className="w-3 h-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedDate && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-4 rounded-xl gap-1"
          onClick={() => navigate("/kalendar")}
        >
          <Calendar className="w-4 h-4" />
          Buka Kalendar Penuh
        </Button>
      )}
    </FloatingCard>
  );
}
