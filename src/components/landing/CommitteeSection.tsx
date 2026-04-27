import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, UserCheck, Shield, Mail, Phone } from "lucide-react";
import zulImage from "@/assets/zul.jpg";

interface CommitteeMember {
  id: string;
  nama: string;
  jawatan: string;
  no_telefon: string;
  email: string;
  gambar?: string;
  role_key: string;
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  pengerusi: <Crown className="w-4 h-4" />,
  naib_pengerusi: <Crown className="w-4 h-4" />,
  setiausaha: <UserCheck className="w-4 h-4" />,
  penolong_setiausaha: <UserCheck className="w-4 h-4" />,
  bendahari: <Shield className="w-4 h-4" />,
  ajk: <Users className="w-4 h-4" />,
};

const ROLE_COLORS: Record<string, string> = {
  pengerusi: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  naib_pengerusi: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  setiausaha: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  penolong_setiausaha: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  bendahari: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  ajk: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

// Static data - akan ditukar dengan data sebenar kemudian
const committeeData: CommitteeMember[] = [
  {
    id: "1",
    nama: "KAMAL BIN JAKFAR",
    jawatan: "Pengerusi",
    no_telefon: "0123418832",
    email: "kamal89.o5@gmail.com",
    gambar: "",
    role_key: "pengerusi"
  },
  {
    id: "2",
    nama: "MUHAMMAD MAHDI BIN MUHTAR",
    jawatan: "Naib Pengerusi",
    no_telefon: "0126839535",
    email: "babymadi1993@gmail.com",
    gambar: "",
    role_key: "naib_pengerusi"
  },
  {
    id: "3",
    nama: "ZULFIKAR BIN AZIZUL",
    jawatan: "Setiausaha",
    no_telefon: "017-3304906",
    email: "zulfikarazizul7@gmailcom",
    gambar: zulImage,
    role_key: "setiausaha"
  },
  {
    id: "4",
    nama: "ZAIMAN BIN SAMSURI",
    jawatan: "Penolong Setiausaha",
    no_telefon: "0136120251",
    email: "Zaimansamsuri@gmail.com",
    gambar: "",
    role_key: "penolong_setiausaha"
  },
  {
    id: "5",
    nama: "ABDUL MALIK BIN SAMSU",
    jawatan: "Bendahari",
    no_telefon: "011-11076900",
    email: "bendahari@persatuanukp.com",
    gambar: "",
    role_key: "bendahari"
  },
  {
    id: "6",
    nama: "SHALIMAN BIN SAWAR",
    jawatan: "AJK",
    no_telefon: "018-3740353",
    email: "ajk1@persatuanukp.com",
    gambar: "",
    role_key: "ajk"
  },
  {
    id: "7",
    nama: "ABU BAKAR SANTOSO BIN ARIF SARTONO",
    jawatan: "AJK",
    no_telefon: "01137754135",
    email: "bakar_abu@gmail.com",
    gambar: "",
    role_key: "ajk"
  },
];

export function CommitteeSection() {
  const committee = committeeData;

  return (
    <section className="py-24 bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="container px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Users className="inline h-4 w-4 mr-1" />
            Pentadbiran
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            Jawatankuasa <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">Persatuan</span>
          </h2>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Kenali barisan jawatankuasa yang menguruskan hal ehwal persatuan untuk 
            kepentingan komuniti Taman Ukay Perdana.
          </p>
        </motion.div>

        {/* Committee Grid - Pengerusi & Naib first row */}
        <div className="space-y-8">
          {/* Top Row: Pengerusi & Naib */}
          {committee.filter(m => m.role_key === "pengerusi" || m.role_key === "naib_pengerusi").length > 0 && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              {committee
                .filter(m => m.role_key === "pengerusi" || m.role_key === "naib_pengerusi")
                .map((member, index) => (
                  <motion.div
                    key={member.id}
                    className="floating-card p-6 text-center relative overflow-hidden"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    {/* Decorative */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
                    
                    <div className="relative">
                      <div className="mb-4 flex justify-center">
                        <Avatar className="w-24 h-24 border-4 border-primary/20">
                          {member.gambar && (
                            <AvatarImage src={member.gambar} alt={member.nama} />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                            {member.nama.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <Badge 
                        className={`mb-3 ${ROLE_COLORS[member.role_key]}`}
                        variant="outline"
                      >
                        {ROLE_ICONS[member.role_key]}
                        <span className="ml-1">{member.jawatan}</span>
                      </Badge>

                      <h3 className="text-lg font-bold text-foreground mb-1">
                        {member.nama}
                      </h3>
                      
                      <div className="space-y-2 mt-3">
                        <a 
                          href={`https://wa.me/60${member.no_telefon.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {member.no_telefon}
                        </a>
                        <a 
                          href={`mailto:${member.email}`}
                          className="flex items-center justify-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          {member.email}
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </motion.div>
          )}

          {/* Second Row: Setiausaha, Bendahari */}
          {committee.filter(m => ["setiausaha", "penolong_setiausaha", "bendahari"].includes(m.role_key)).length > 0 && (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              {committee
                .filter(m => ["setiausaha", "penolong_setiausaha", "bendahari"].includes(m.role_key))
                .map((member, index) => (
                  <motion.div
                    key={member.id}
                    className="floating-card p-5 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    whileHover={{ y: -3 }}
                  >
                    <div className="mb-3 flex justify-center">
                      <Avatar className="w-24 h-24 border-2 border-primary/10">
                        {member.gambar && (
                          <AvatarImage src={member.gambar} alt={member.nama} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {member.nama.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <Badge 
                      className={`mb-2 text-xs ${ROLE_COLORS[member.role_key]}`}
                      variant="outline"
                    >
                      {ROLE_ICONS[member.role_key]}
                      <span className="ml-1">{member.jawatan}</span>
                    </Badge>

                    <h3 className="text-base font-semibold text-foreground mb-1">
                      {member.nama}
                    </h3>
                    
                    <div className="space-y-2 mt-3">
                      <a 
                        href={`https://wa.me/60${member.no_telefon.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {member.no_telefon}
                      </a>
                      <a 
                        href={`mailto:${member.email}`}
                        className="flex items-center justify-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {member.email}
                      </a>
                    </div>
                  </motion.div>
                ))}
            </motion.div>
          )}

          {/* Third Row: AJK */}
          {committee.filter(m => m.role_key === "ajk").length > 0 && (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              {committee
                .filter(m => m.role_key === "ajk")
                .map((member, index) => (
                  <motion.div
                    key={member.id}
                    className="floating-card p-4 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.03 }}
                    whileHover={{ y: -2 }}
                  >
                    <div className="mb-2 flex justify-center">
                      <Avatar className="w-24 h-24 border border-primary/10">
                        {member.gambar && (
                          <AvatarImage src={member.gambar} alt={member.nama} />
                        )}
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-sm font-semibold">
                          {member.nama.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <Badge 
                      className={`mb-1 text-xs ${ROLE_COLORS[member.role_key]}`}
                      variant="outline"
                    >
                      {ROLE_ICONS[member.role_key]}
                      <span className="ml-1">{member.jawatan}</span>
                    </Badge>

                    <h3 className="text-sm font-medium text-foreground leading-tight">
                      {member.nama}
                    </h3>
                    
                    <div className="space-y-2 mt-2">
                      <a 
                        href={`https://wa.me/60${member.no_telefon.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {member.no_telefon}
                      </a>
                      <a 
                        href={`mailto:${member.email}`}
                        className="flex items-center justify-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {member.email}
                      </a>
                    </div>
                  </motion.div>
                ))}
            </motion.div>
          )}
        </div>

        {/* Footer Note */}
        <motion.p
          className="text-center text-sm text-muted-foreground mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          Hubungi mana-mana ahli jawatankuasa untuk sebarang pertanyaan atau cadangan.
        </motion.p>
      </div>
    </section>
  );
}
