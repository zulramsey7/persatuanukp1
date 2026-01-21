import { motion } from "framer-motion";
import { Users, Heart, Target, Award } from "lucide-react";
import heroCommunity from "@/assets/hero-community.jpg";

export function AboutSection() {
  const features = [
    {
      icon: Users,
      title: "Komuniti Kuat",
      description: "Menghubungkan lebih dari 60 ahli keluarga besar ukay perdana"
    },
    {
      icon: Heart,
      title: "Kemakmuran Bersama",
      description: "Menjaga kesejahteraan dan kepentingan semua anggota"
    },
    {
      icon: Target,
      title: "Visi Jelas",
      description: "Bersama membina komuniti yang sejahtera dan harmonis"
    },
    {
      icon: Award,
      title: "Kepercayaan",
      description: "Transparansi penuh dalam setiap aktiviti dan kewangan"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background/50 to-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-600/50 rounded-full" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Mengenai Kami
            </h2>
            <div className="h-8 w-1 bg-gradient-to-b from-blue-600/50 to-transparent rounded-full" />
          </div>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Persatuan Penduduk Taman Ukay Perdana (PPTUP) adalah organisasi komuniti yang berdedikasi untuk kesejahteraan dan kemakmuran bersama
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={heroCommunity}
                alt="Komuniti PPTUP"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Sejarah Singkat
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Persatuan Ukay Perdana telah berkembang menjadi satu komuniti yang solid dengan lebih dari 60 keluarga. Sejak penubuhan, kami berkomitmen untuk menjaga hubungan baik, saling membantu, dan membangun persekitaran yang aman serta sejahtera bagi semua anggota.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Nilai-Nilai Kami
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-background border border-blue-200/30 hover:border-blue-400/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                          <div>
                            <h4 className="font-semibold text-foreground mb-1">
                              {feature.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Misi Kami
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Menjadi platform penghubung yang kuat untuk semua anggota komuniti, memastikan transparansi dalam setiap keputusan, dan bersama-sama membangun masa depan yang lebih cerah untuk Taman Ukay Perdana.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
