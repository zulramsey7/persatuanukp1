import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Search,
  Home,
  Phone,
  MessageCircle,
  Users,
  User,
  Mail,
  MapPin,
  Calendar,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";

interface Member {
  id: string;
  nama_penuh: string;
  no_rumah: string;
  no_telefon: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
  member_number?: number;
  no_ahli?: number;
  roles?: string[];
}

const ROLE_LABELS: Record<string, string> = {
  pengerusi: "Pengerusi",
  naib_pengerusi: "Naib Pengerusi",
  setiausaha: "Setiausaha",
  penolong_setiausaha: "Penolong Setiausaha",
  bendahari: "Bendahari",
  ajk: "Ahli Jawatankuasa",
  ahli: "Ahli"
};

const Direktori = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth?mode=login");
      return;
    }
    fetchMembers();
  }, [user, navigate]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMembers(
        members.filter(
          (m) =>
            m.nama_penuh.toLowerCase().includes(query) ||
            m.no_rumah.toLowerCase().includes(query) ||
            m.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, members]);

  const fetchMembers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nama_penuh, no_rumah, no_telefon, email, avatar_url, created_at, member_number, no_ahli")
        .eq("status_ahli", "active")
        .order("no_rumah", { ascending: true });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        // Continue even if roles fail, just show as members
      }

      const membersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        roles: (roles || [])
          .filter(r => r.user_id === profile.id)
          .map(r => r.role)
      }));

      setMembers(membersWithRoles);
      setFilteredMembers(membersWithRoles);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        title: "Ralat",
        description: "Gagal memuat senarai ahli. Sila semak sambungan internet anda.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, "_self");
  };

  const handleWhatsApp = (phone: string, name: string) => {
    let formattedPhone = phone.replace(/[\s-]/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "60" + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith("60")) {
      formattedPhone = "60" + formattedPhone;
    }
    const message = encodeURIComponent(`Assalamualaikum ${name}, `);
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, "_self");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMemberNumber = (index: number) => {
    return String(index + 1).padStart(5, "0");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 pb-24">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
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
              <h1 className="text-xl font-bold text-foreground">Direktori Ahli</h1>
              <p className="text-muted-foreground text-sm">
                {members.length} ahli aktif berdaftar
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1 bg-primary/10 text-primary border-0">
            <Users className="w-3 h-3 mr-1" />
            Komuniti
          </Badge>
        </div>
      </header>

      {/* Search Bar & Stats */}
      <div className="relative z-10 px-4 mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Cari nama, nombor rumah atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 rounded-2xl bg-background/80 backdrop-blur-sm border-primary/20 h-14 text-base shadow-lg"
          />
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3">
          <FloatingCard className="p-3 text-center bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="text-2xl font-bold text-primary">{members.length}</div>
            <div className="text-xs text-muted-foreground">Jumlah Ahli</div>
          </FloatingCard>
          <FloatingCard className="p-3 text-center bg-gradient-to-br from-green-500/10 to-green-500/5">
            <div className="text-2xl font-bold text-green-600">{filteredMembers.length}</div>
            <div className="text-xs text-muted-foreground">Dipaparkan</div>
          </FloatingCard>
          <FloatingCard className="p-3 text-center bg-gradient-to-br from-accent/10 to-accent/5">
            <div className="text-2xl font-bold text-accent-foreground">
              {new Set(members.map(m => m.no_rumah.split("-")[0])).size}
            </div>
            <div className="text-xs text-muted-foreground">Jalan</div>
          </FloatingCard>
        </div>
      </div>

      {/* Members List */}
      <div className="relative z-10 px-4 space-y-4">
        {filteredMembers.length === 0 ? (
          <FloatingCard className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Tiada Ahli Dijumpai</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? `Tiada hasil untuk "${searchQuery}"` : "Tiada ahli aktif dalam sistem"}
            </p>
          </FloatingCard>
        ) : (
          filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
            >
              <FloatingCard className="p-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Member Header with gradient */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.nama_penuh}
                            className="w-full h-full rounded-2xl object-cover"
                          />
                        ) : (
                          getInitials(member.nama_penuh)
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-background" />
                    </div>

                    {/* Name & Member Number */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-lg truncate">
                        {member.nama_penuh}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-background/50">
                          No. {String(member.member_number || member.no_ahli || index + 1).padStart(5, '0')}
                        </Badge>
                        {member.roles && member.roles.length > 0 ? (
                          member.roles.map((role, i) => (
                            <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-0 gap-1">
                              <Shield className="w-3 h-3" />
                              {ROLE_LABELS[role]}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-0 gap-1">
                             <User className="w-3 h-3" />
                             Ahli
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Member Details */}
                <div className="p-4 space-y-3">
                  {/* House & Join Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Home className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">No. Rumah</div>
                        <div className="font-medium text-foreground">{member.no_rumah}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-accent-foreground" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Ahli Sejak</div>
                        <div className="font-medium text-foreground">
                          {format(new Date(member.created_at), "MMM yyyy", { locale: ms })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {member.no_telefon && (
                      <div className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg px-3 py-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{member.no_telefon}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg px-3 py-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground truncate">{member.email}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {member.no_telefon && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-xl h-10 border-primary/30 hover:bg-primary/10"
                          onClick={() => handleCall(member.no_telefon!)}
                        >
                          <Phone className="w-4 h-4 mr-2 text-primary" />
                          Telefon
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 rounded-xl h-10 bg-green-500 hover:bg-green-600"
                          onClick={() => handleWhatsApp(member.no_telefon!, member.nama_penuh)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl h-10"
                      onClick={() => handleEmail(member.email)}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  </div>
                </div>
              </FloatingCard>
            </motion.div>
          ))
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Direktori;
