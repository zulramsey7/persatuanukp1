import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Trophy, 
  Megaphone, 
  Users,
  Phone,
  User,
  Shield
} from "lucide-react";

interface BureauMember {
  name: string;
  role: "Ketua" | "Ahli";
  phone: string;
}

interface Bureau {
  id: string;
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  description: string;
  tasks: string[];
  members: BureauMember[];
}

const bureaus: Bureau[] = [
  {
    id: "kebajikan",
    name: "Biro Kebajikan",
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    description: "Menjaga kebajikan ahli komuniti",
    tasks: [
      "Mengurus bantuan kepada ahli yang sakit atau ditimpa musibah",
      "Mengurus sumbangan kematian dan ziarah ahli",
      "Menyelaraskan bantuan kecemasan atau tabung kilat",
      "Mengenal pasti ahli yang memerlukan bantuan asas",
      "Menjalinkan semangat prihatin dalam komuniti"
    ],
    members: [
      { name: "Zulfikar", role: "Ketua", phone: "017-3304906" },
      { name: "Shaliman", role: "Ahli", phone: "018-3740353" },
      { name: "Faizul", role: "Ahli", phone: "011-11272680" }
    ]
  },
  {
    id: "belia",
    name: "Biro Belia & Sukan",
    icon: Trophy,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description: "Membangunkan generasi muda melalui sukan",
    tasks: [
      "Merancang dan mengadakan aktiviti sukan seperti futsal, badminton, dan jogging",
      "Menggalakkan penglibatan belia dalam program komuniti",
      "Menganjurkan pertandingan sukan antara penduduk",
      "Membina hubungan baik antara generasi muda",
      "Mengisi masa lapang dengan aktiviti sihat"
    ],
    members: [
      { name: "comingsoon", role: "Ketua", phone: "010-0000000" },
      { name: "comingsoon", role: "Ahli", phone: "010-0000000" },
      { name: "comingsoon", role: "Ahli", phone: "010-0000000" }
    ]
  },
  {
    id: "media",
    name: "Biro Media & Hebahan",
    icon: Megaphone,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Menyampaikan maklumat kepada komuniti",
    tasks: [
      "Menyampaikan maklumat dan hebahan melalui WhatsApp, Facebook dan platform lain",
      "Menyediakan poster dan bahan promosi program",
      "Mengambil gambar dan video aktiviti persatuan",
      "Menguruskan dokumentasi media persatuan",
      "Memastikan maklumat sampai kepada semua ahli dengan cepat"
    ],
    members: [
      { name: "comingsoon", role: "Ketua", phone: "010-0000000" },
      { name: "comingsoon", role: "Ahli", phone: "010-0000000" },
      { name: "comingsoon", role: "Ahli", phone: "010-0000000" }
    ]
  },
  {
    id: "keahlian",
    name: "Biro Keahlian & Data",
    icon: Users,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: "Menguruskan data dan keahlian persatuan",
    tasks: [
      "Mendaftar ahli baru persatuan",
      "Mengemaskini data dan rekod ahli",
      "Mengurus kutipan yuran keahlian",
      "Menyimpan senarai ahli aktif dan tidak aktif",
      "Menyokong sistem pengurusan persatuan yang teratur"
    ],
    members: [
      { name: "comingsoon", role: "Ketua", phone: "010-0000000" },
      { name: "comingsoon", role: "Ahli", phone: "010-0000000" },
      { name: "comingsoon", role: "Ahli", phone: "010-0000000" }
    ]
  }
];

export function BureauSection() {
  return (
    <section id="biro" className="py-20 px-4 md:px-6 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-semibold">
            Struktur Organisasi
          </Badge>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            Biro <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Persatuan</span>
          </h2>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Biro-biro khusus untuk melancarkan operasi persatuan dan menjaga kebajikan komuniti
          </p>
        </motion.div>

        {/* Bureaus Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {bureaus.map((bureau, index) => {
            const Icon = bureau.icon;
            return (
              <motion.div
                key={bureau.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-border/50">
                  <CardContent className="p-6">
                    {/* Bureau Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl ${bureau.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-7 h-7 ${bureau.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-1">
                          {bureau.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {bureau.description}
                        </p>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        Peranan & Tugas
                      </h4>
                      <ul className="space-y-2">
                        {bureau.tasks.map((task, taskIndex) => (
                          <li
                            key={taskIndex}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 flex-shrink-0" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Members */}
                    <div className="border-t border-border/50 pt-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        Ahli Biro
                      </h4>
                      <div className="space-y-2">
                        {bureau.members.map((member, memberIndex) => (
                          <div
                            key={memberIndex}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full ${bureau.bgColor} flex items-center justify-center`}>
                                <User className={`w-4 h-4 ${bureau.color}`} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {member.name}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${
                                    member.role === "Ketua"
                                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {member.role}
                                </Badge>
                              </div>
                            </div>
                            <a 
                              href={`https://wa.me/60${member.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              {member.phone}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
