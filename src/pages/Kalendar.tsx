import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowLeft,
  Calendar,
  Vote,
  CheckCircle,
  Clock,
  Users,
  CalendarDays,
  MapPin,
  Loader2,
  Plus,
  UserPlus,
  UserMinus,
  Banknote
} from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";

interface Poll {
  id: string;
  tajuk: string;
  deskripsi: string | null;
  pilihan: string[];
  status: string;
  tarikh_mula: string;
  tarikh_tamat: string;
}

interface PollVote {
  id: string;
  poll_id: string;
  pilihan_index: number;
}

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
  created_at: string;
}

interface Pendaftaran {
  id: string;
  aktiviti_id: string;
  status: string;
}

const Kalendar = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<PollVote[]>([]);
  const [allVotes, setAllVotes] = useState<{ poll_id: string; pilihan_index: number }[]>([]);
  const [aktiviti, setAktiviti] = useState<Aktiviti[]>([]);
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<{ aktiviti_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAktivitiId, setSelectedAktivitiId] = useState<string | null>(null);
  
  // Admin create activity states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAktiviti, setNewAktiviti] = useState({
    tajuk: "",
    deskripsi: "",
    lokasi: "",
    tarikh_mula: "",
    tarikh_tamat: "",
    max_peserta: "",
    yuran: "0"
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData(user.id);
    }
  }, [user]);

  const fetchData = async (uid: string) => {
    try {
      const [pollsRes, userVotesRes, allVotesRes, aktivitiRes, pendaftaranRes, allRegRes] = await Promise.all([
        supabase
          .from("polls")
          .select("*")
          .eq("status", "aktif")
          .order("tarikh_mula", { ascending: false }),
        supabase
          .from("poll_votes")
          .select("*")
          .eq("user_id", uid),
        supabase
          .from("poll_votes")
          .select("poll_id, pilihan_index"),
        supabase
          .from("aktiviti")
          .select("*")
          .eq("status", "aktif")
          .gte("tarikh_tamat", new Date().toISOString())
          .order("tarikh_mula", { ascending: true }),
        supabase
          .from("pendaftaran_aktiviti")
          .select("id, aktiviti_id, status")
          .eq("user_id", uid),
        supabase
          .from("pendaftaran_aktiviti")
          .select("aktiviti_id")
      ]);

      if (pollsRes.error) throw pollsRes.error;
      if (userVotesRes.error) throw userVotesRes.error;
      if (allVotesRes.error) throw allVotesRes.error;
      if (aktivitiRes.error) throw aktivitiRes.error;
      if (pendaftaranRes.error) throw pendaftaranRes.error;

      const parsedPolls = (pollsRes.data || []).map(poll => ({
        ...poll,
        pilihan: Array.isArray(poll.pilihan) ? poll.pilihan.map(p => String(p)) : []
      }));

      setPolls(parsedPolls);
      setUserVotes(userVotesRes.data || []);
      setAllVotes(allVotesRes.data || []);
      setAktiviti(aktivitiRes.data || []);
      setPendaftaran(pendaftaranRes.data || []);
      setAllRegistrations(allRegRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, pilihanIndex: number) => {
    if (!user) return;

    const existingVote = userVotes.find(v => v.poll_id === pollId);
    if (existingVote) {
      toast({
        title: "Sudah Mengundi",
        description: "Anda sudah mengundi untuk poll ini.",
        variant: "destructive"
      });
      return;
    }

    setVotingPollId(pollId);

    try {
      const { error } = await supabase
        .from("poll_votes")
        .insert({
          poll_id: pollId,
          user_id: user.id,
          pilihan_index: pilihanIndex
        });

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Undian anda telah direkodkan.",
      });

      fetchData(user.id);
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Ralat",
        description: "Gagal menghantar undian.",
        variant: "destructive"
      });
    } finally {
      setVotingPollId(null);
    }
  };

  const handleRegister = async (aktivitiId: string) => {
    if (!user) return;

    setRegisteringId(aktivitiId);

    try {
      const { error } = await supabase
        .from("pendaftaran_aktiviti")
        .insert({
          aktiviti_id: aktivitiId,
          user_id: user.id,
          status: "confirmed"
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Sudah Didaftar",
            description: "Anda sudah mendaftar untuk aktiviti ini.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Berjaya!",
        description: "Anda telah berjaya mendaftar untuk aktiviti ini.",
      });

      fetchData(user.id);
    } catch (error) {
      console.error("Error registering:", error);
      toast({
        title: "Ralat",
        description: "Gagal mendaftar aktiviti.",
        variant: "destructive"
      });
    } finally {
      setRegisteringId(null);
    }
  };

  const handleCancelRegistration = async () => {
    if (!user || !selectedAktivitiId) return;

    try {
      const { error } = await supabase
        .from("pendaftaran_aktiviti")
        .delete()
        .eq("aktiviti_id", selectedAktivitiId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Berjaya",
        description: "Pendaftaran anda telah dibatalkan.",
      });

      fetchData(user.id);
    } catch (error) {
      console.error("Error canceling:", error);
      toast({
        title: "Ralat",
        description: "Gagal membatalkan pendaftaran.",
        variant: "destructive"
      });
    } finally {
      setCancelDialogOpen(false);
      setSelectedAktivitiId(null);
    }
  };

  const handleCreateAktiviti = async () => {
    if (!user || !newAktiviti.tajuk || !newAktiviti.tarikh_mula || !newAktiviti.tarikh_tamat) {
      toast({
        title: "Ralat",
        description: "Sila isi semua maklumat yang diperlukan.",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);

    try {
      const { error } = await supabase
        .from("aktiviti")
        .insert({
          tajuk: newAktiviti.tajuk,
          deskripsi: newAktiviti.deskripsi || null,
          lokasi: newAktiviti.lokasi || null,
          tarikh_mula: new Date(newAktiviti.tarikh_mula).toISOString(),
          tarikh_tamat: new Date(newAktiviti.tarikh_tamat).toISOString(),
          max_peserta: newAktiviti.max_peserta ? parseInt(newAktiviti.max_peserta) : null,
          yuran: parseFloat(newAktiviti.yuran) || 0,
          created_by: user.id,
          status: "aktif"
        });

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Aktiviti baru telah dicipta.",
      });

      setCreateDialogOpen(false);
      setNewAktiviti({
        tajuk: "",
        deskripsi: "",
        lokasi: "",
        tarikh_mula: "",
        tarikh_tamat: "",
        max_peserta: "",
        yuran: "0"
      });
      fetchData(user.id);
    } catch (error) {
      console.error("Error creating aktiviti:", error);
      toast({
        title: "Ralat",
        description: "Gagal mencipta aktiviti.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const getVoteCount = (pollId: string, pilihanIndex: number) => {
    return allVotes.filter(v => v.poll_id === pollId && v.pilihan_index === pilihanIndex).length;
  };

  const getTotalVotes = (pollId: string) => {
    return allVotes.filter(v => v.poll_id === pollId).length;
  };

  const hasVoted = (pollId: string) => {
    return userVotes.some(v => v.poll_id === pollId);
  };

  const getUserVote = (pollId: string) => {
    return userVotes.find(v => v.poll_id === pollId)?.pilihan_index;
  };

  const isRegistered = (aktivitiId: string) => {
    return pendaftaran.some(p => p.aktiviti_id === aktivitiId);
  };

  const getRegistrationCount = (aktivitiId: string) => {
    return allRegistrations.filter(r => r.aktiviti_id === aktivitiId).length;
  };

  const isFull = (akt: Aktiviti) => {
    if (!akt.max_peserta) return false;
    return getRegistrationCount(akt.id) >= akt.max_peserta;
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
              <h1 className="text-xl font-bold text-foreground">Aktiviti & Undian</h1>
              <p className="text-muted-foreground text-sm">Sertai aktiviti komuniti</p>
            </div>
          </div>
          
          {isAdmin && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full gap-1">
                  <Plus className="w-4 h-4" />
                  Aktiviti
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cipta Aktiviti Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="tajuk">Tajuk Aktiviti *</Label>
                    <Input
                      id="tajuk"
                      value={newAktiviti.tajuk}
                      onChange={(e) => setNewAktiviti({ ...newAktiviti, tajuk: e.target.value })}
                      placeholder="cth: Gotong-royong Komuniti"
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deskripsi">Penerangan</Label>
                    <Textarea
                      id="deskripsi"
                      value={newAktiviti.deskripsi}
                      onChange={(e) => setNewAktiviti({ ...newAktiviti, deskripsi: e.target.value })}
                      placeholder="Keterangan aktiviti..."
                      className="rounded-xl mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lokasi">Lokasi</Label>
                    <Input
                      id="lokasi"
                      value={newAktiviti.lokasi}
                      onChange={(e) => setNewAktiviti({ ...newAktiviti, lokasi: e.target.value })}
                      placeholder="cth: Dewan Komuniti"
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="tarikh_mula">Tarikh Mula *</Label>
                      <Input
                        id="tarikh_mula"
                        type="datetime-local"
                        value={newAktiviti.tarikh_mula}
                        onChange={(e) => setNewAktiviti({ ...newAktiviti, tarikh_mula: e.target.value })}
                        className="rounded-xl mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tarikh_tamat">Tarikh Tamat *</Label>
                      <Input
                        id="tarikh_tamat"
                        type="datetime-local"
                        value={newAktiviti.tarikh_tamat}
                        onChange={(e) => setNewAktiviti({ ...newAktiviti, tarikh_tamat: e.target.value })}
                        className="rounded-xl mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="max_peserta">Had Peserta</Label>
                      <Input
                        id="max_peserta"
                        type="number"
                        value={newAktiviti.max_peserta}
                        onChange={(e) => setNewAktiviti({ ...newAktiviti, max_peserta: e.target.value })}
                        placeholder="Tiada had"
                        className="rounded-xl mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="yuran">Yuran (RM)</Label>
                      <Input
                        id="yuran"
                        type="number"
                        step="0.01"
                        value={newAktiviti.yuran}
                        onChange={(e) => setNewAktiviti({ ...newAktiviti, yuran: e.target.value })}
                        className="rounded-xl mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateAktiviti}
                    disabled={creating || !newAktiviti.tajuk || !newAktiviti.tarikh_mula || !newAktiviti.tarikh_tamat}
                    className="w-full rounded-xl"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mencipta...
                      </>
                    ) : (
                      "Cipta Aktiviti"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <main className="relative z-10 px-4">
        <Tabs defaultValue="aktiviti" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm rounded-2xl p-1">
            <TabsTrigger value="aktiviti" className="rounded-xl gap-1">
              <CalendarDays className="w-4 h-4" />
              Aktiviti
            </TabsTrigger>
            <TabsTrigger value="undian" className="rounded-xl gap-1">
              <Vote className="w-4 h-4" />
              Undian
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aktiviti" className="mt-4 space-y-4">
            {aktiviti.length === 0 ? (
              <FloatingCard className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Tiada Aktiviti Akan Datang</h3>
                <p className="text-muted-foreground text-sm">
                  Aktiviti komuniti akan dipaparkan di sini.
                </p>
              </FloatingCard>
            ) : (
              aktiviti.map((akt, index) => {
                const registered = isRegistered(akt.id);
                const regCount = getRegistrationCount(akt.id);
                const full = isFull(akt);

                return (
                  <motion.div
                    key={akt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <FloatingCard className="p-5 overflow-hidden">
                      {akt.image_url && (
                        <div className="relative h-32 -mx-5 -mt-5 mb-4">
                          <img
                            src={akt.image_url}
                            alt={akt.tajuk}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-lg">{akt.tajuk}</h3>
                          {akt.deskripsi && (
                            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                              {akt.deskripsi}
                            </p>
                          )}
                        </div>
                        {registered && (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 shrink-0">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Didaftar
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>
                            {format(new Date(akt.tarikh_mula), "d MMMM yyyy, h:mm a", { locale: ms })}
                          </span>
                        </div>
                        {akt.lokasi && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{akt.lokasi}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4 text-primary" />
                            <span>
                              {regCount} peserta
                              {akt.max_peserta && ` / ${akt.max_peserta}`}
                            </span>
                          </div>
                          {Number(akt.yuran) > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Banknote className="w-4 h-4 text-primary" />
                              <span>RM {Number(akt.yuran).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {akt.max_peserta && (
                        <div className="mb-4">
                          <Progress 
                            value={(regCount / akt.max_peserta) * 100} 
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {full ? "Penuh" : `${akt.max_peserta - regCount} slot tersisa`}
                          </p>
                        </div>
                      )}

                      {registered ? (
                        <Button
                          variant="outline"
                          className="w-full rounded-xl text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedAktivitiId(akt.id);
                            setCancelDialogOpen(true);
                          }}
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Batal Pendaftaran
                        </Button>
                      ) : (
                        <Button
                          className="w-full rounded-xl"
                          onClick={() => handleRegister(akt.id)}
                          disabled={registeringId === akt.id || full}
                        >
                          {registeringId === akt.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Mendaftar...
                            </>
                          ) : full ? (
                            "Slot Penuh"
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Daftar Sekarang
                            </>
                          )}
                        </Button>
                      )}
                    </FloatingCard>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="undian" className="mt-4 space-y-4">
            {polls.length === 0 ? (
              <FloatingCard className="p-8 text-center">
                <Vote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Tiada Undian Aktif</h3>
                <p className="text-muted-foreground text-sm">
                  Undian akan dipaparkan di sini apabila ada.
                </p>
              </FloatingCard>
            ) : (
              polls.map((poll, index) => {
                const voted = hasVoted(poll.id);
                const userVoteIndex = getUserVote(poll.id);
                const totalVotes = getTotalVotes(poll.id);

                return (
                  <motion.div
                    key={poll.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <FloatingCard className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{poll.tajuk}</h3>
                          {poll.deskripsi && (
                            <p className="text-muted-foreground text-sm mt-1">{poll.deskripsi}</p>
                          )}
                        </div>
                        {voted && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-600 rounded-full text-xs">
                            <CheckCircle className="w-3 h-3" />
                            Telah Undi
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        {poll.pilihan.map((pilihan, pIndex) => {
                          const voteCount = getVoteCount(poll.id, pIndex);
                          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                          const isUserVote = userVoteIndex === pIndex;

                          return (
                            <div key={pIndex}>
                              {voted ? (
                                <div className={`p-3 rounded-xl ${isUserVote ? "bg-primary/10 border border-primary/30" : "bg-muted/50"}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm ${isUserVote ? "font-medium text-primary" : "text-foreground"}`}>
                                      {pilihan}
                                      {isUserVote && <CheckCircle className="w-3 h-3 inline ml-1" />}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{voteCount} undi</span>
                                  </div>
                                  <Progress value={percentage} className="h-2" />
                                  <p className="text-xs text-muted-foreground mt-1">{percentage.toFixed(0)}%</p>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  className="w-full justify-start rounded-xl h-auto py-3"
                                  onClick={() => handleVote(poll.id, pIndex)}
                                  disabled={votingPollId === poll.id}
                                >
                                  {pilihan}
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{totalVotes} undian</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Tamat: {new Date(poll.tarikh_tamat).toLocaleDateString('ms-MY')}</span>
                        </div>
                      </div>
                    </FloatingCard>
                  </motion.div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Cancel Registration Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Batal Pendaftaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Adakah anda pasti mahu membatalkan pendaftaran untuk aktiviti ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Tidak</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRegistration}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileBottomNav />
    </div>
  );
};

export default Kalendar;
