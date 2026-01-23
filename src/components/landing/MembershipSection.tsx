import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
const benefits = ["Akses penuh ke sistem kewangan telus", "Mengundi dalam e-undian komuniti", "Penyertaan dalam aktiviti & gotong-royong", "Notifikasi untuk aktiviti & pengumuman", "Muat turun laporan kewangan", "Harga istimewa untuk kemudahan kawasan"];
export function MembershipSection() {
  return <section className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Info */}
          <motion.div initial={{
          opacity: 0,
          x: -30
        }} whileInView={{
          opacity: 1,
          x: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <span className="inline-block px-4 py-2 rounded-full bg-accent/20 text-accent text-sm font-medium mb-4">
              <Star className="inline h-4 w-4 mr-1" />
              Pakej Keahlian
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Sertai Kami Hari Ini
            </h2>
            <p className="text-muted-foreground mb-8">
              Jadilah sebahagian daripada komuniti kami dan nikmati pelbagai manfaat 
              sebagai ahli berdaftar Persatuan Penduduk.
            </p>

            <ul className="space-y-4 mb-8">
              {benefits.map((benefit, index) => <motion.li key={benefit} className="flex items-center gap-3" initial={{
              opacity: 0,
              x: -20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }}>
                  <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </motion.li>)}
            </ul>
          </motion.div>

          {/* Pricing Card */}
          <motion.div initial={{
          opacity: 0,
          x: 30
        }} whileInView={{
          opacity: 1,
          x: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <div className="floating-card p-8 relative overflow-hidden">
              {/* Decorative */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Yuran Keahlian
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-primary">RM 5</span>
                    <span className="text-muted-foreground">/bulan</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Bayaran bulanan tetap</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">Yuran Bulanan</span>
                    <span className="font-semibold text-foreground">RM 5.00</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-muted-foreground">Jumlah Perlu Dibayar</span>
                    <span className="font-bold text-xl text-primary">RM 5.00</span>
                  </div>
                </div>

                <Button asChild className="w-full rounded-full py-6 text-lg font-semibold gradient-primary hover:opacity-90">
                  <Link to="/auth">
                    Daftar Sekarang
                  </Link>
                </Button>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  Pendaftaran memerlukan pengesahan daripada AJK
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>;
}