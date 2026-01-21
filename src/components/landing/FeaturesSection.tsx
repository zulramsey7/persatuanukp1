import { motion } from "framer-motion";
import { 
  CreditCard, 
  BarChart3, 
  Image, 
  Vote, 
  Bell, 
  Shield,
  FileText,
  Calendar
} from "lucide-react";

const features = [
  {
    icon: CreditCard,
    title: "Pembayaran Yuran Digital",
    description: "Bayar yuran bulanan secara online melalui FPX dengan mudah dan selamat.",
    color: "from-primary to-primary/80",
  },
  {
    icon: BarChart3,
    title: "Kewangan Telus",
    description: "Lihat laporan pendapatan dan perbelanjaan persatuan secara real-time.",
    color: "from-info to-info/80",
  },
  {
    icon: Image,
    title: "Galeri Aktiviti",
    description: "Dokumentasi visual aktiviti komuniti seperti gotong-royong dan majlis.",
    color: "from-accent to-accent/80",
  },
  {
    icon: Vote,
    title: "E-Undian",
    description: "Sistem undian digital untuk keputusan komuniti yang demokratik.",
    color: "from-success to-success/80",
  },
  {
    icon: Bell,
    title: "Notifikasi Pintar",
    description: "Terima pemberitahuan untuk aktiviti, bayaran tertunggak, dan pengumuman.",
    color: "from-warning to-warning/80",
  },
  {
    icon: Shield,
    title: "Keselamatan Data",
    description: "Data ahli dilindungi dengan enkripsi dan kawalan akses ketat.",
    color: "from-destructive to-destructive/80",
  },
  {
    icon: FileText,
    title: "Laporan PDF",
    description: "Muat turun laporan kewangan dan keahlian dalam format PDF.",
    color: "from-primary to-primary/80",
  },
  {
    icon: Calendar,
    title: "Kalendar Aktiviti",
    description: "Lihat jadual aktiviti yang akan datang dan daftar penyertaan.",
    color: "from-info to-info/80",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export function FeaturesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Ciri-Ciri Utama
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pengurusan Komuniti yang Moden
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sistem lengkap untuk menguruskan persatuan penduduk dengan mudah, telus, dan efisien.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="floating-card p-6 group cursor-pointer"
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
