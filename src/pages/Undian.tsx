import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Vote,
  CheckCircle2,
  Clock,
  Users,
  Loader2,
  Calendar,
  Plus,
  X,
  Trash2,
  MoreVertical,
  XCircle
} from "lucide-react";
import { format, isPast, isFuture, addDays } from "date-fns";
import { ms } from "date-fns/locale";

interface Poll {
  id: string;
  tajuk: string;
  deskripsi: string | null;
  pilihan: string[];
  status: string;
  tarikh_mula: string;
  tarikh_tamat: string;
  created_at: string;
}

interface PollVote {
  poll_id: string;
  pilihan_index: number;
}

export default function Undian() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [voteCounts, setVoteCounts] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  
  // Create poll state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPoll, setNewPoll] = useState({
    tajuk: "",
    deskripsi: "",
    pilihan: ["", ""],
    tarikh_tamat: format(addDays(new Date(), 7), "yyyy-MM-dd")
  });

  const isMobile = useIsMobile();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const resetNewPoll = () => {
    setNewPoll({
      tajuk: "",
      deskripsi: "",
      pilihan: ["", ""],
      tarikh_tamat: format(addDays(new Date(), 7), "yyyy-MM-dd")
    });
  };

  const addOption = () => {
    if (newPoll.pilihan.length < 6) {
      setNewPoll({ ...newPoll, pilihan: [...newPoll.pilihan, ""] });
    }
  };

  const removeOption = (index: number) => {
    if (newPoll.pilihan.length > 2) {
      const updated = newPoll.pilihan.filter((_, i) => i !== index);
      setNewPoll({ ...newPoll, pilihan: updated });
    }
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...newPoll.pilihan];
    updated[index] = value;
    setNewPoll({ ...newPoll, pilihan: updated });
  };

  const handleCreatePoll = async () => {
    // Validation
    if (!newPoll.tajuk.trim()) {
      toast({ title: "Ralat", description: "Sila masukkan tajuk undian", variant: "destructive" });
      return;
    }
    
    const validOptions = newPoll.pilihan.filter(p => p.trim());
    if (validOptions.length < 2) {
      toast({ title: "Ralat", description: "Sila masukkan sekurang-kurangnya 2 pilihan", variant: "destructive" });
      return;
    }

    if (!newPoll.tarikh_tamat) {
      toast({ title: "Ralat", description: "Sila pilih tarikh tamat", variant: "destructive" });
      return;
    }

    setCreating(true);

    const { error } = await supabase.from("polls").insert({
      tajuk: newPoll.tajuk.trim(),
      deskripsi: newPoll.deskripsi.trim() || null,
      pilihan: validOptions,
      tarikh_mula: new Date().toISOString(),
      tarikh_tamat: new Date(newPoll.tarikh_tamat + "T23:59:59").toISOString(),
      status: "aktif",
      created_by: user?.id
    });

    if (error) {
      toast({ title: "Ralat", description: "Gagal mencipta undian", variant: "destructive" });
    } else {
      toast({ title: "Berjaya", description: "Undian baru telah dicipta" });
      setCreateDialogOpen(false);
      resetNewPoll();
      fetchPolls();
    }

    setCreating(false);
  };

  const fetchPolls = async () => {
    setLoading(true);

    // Fetch polls
    const { data: pollsData, error: pollsError } = await supabase
      .from("polls")
      .select("*")
      .order("created_at", { ascending: false });

    if (pollsError) {
      toast({
        title: "Ralat",
        description: "Gagal memuat undian",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Parse pilihan JSON
    const parsedPolls: Poll[] = (pollsData || []).map((p) => ({
      ...p,
      pilihan: Array.isArray(p.pilihan) ? p.pilihan as string[] : [],
    }));

    setPolls(parsedPolls);

    // Fetch user votes
    if (user) {
      const { data: votesData } = await supabase
        .from("poll_votes")
        .select("poll_id, pilihan_index")
        .eq("user_id", user.id);

      const votesMap: Record<string, number> = {};
      (votesData || []).forEach((v) => {
        votesMap[v.poll_id] = v.pilihan_index;
      });
      setUserVotes(votesMap);
    }

    // Fetch vote counts for each poll
    const countsMap: Record<string, number[]> = {};
    for (const poll of parsedPolls) {
      const { data: allVotes } = await supabase
        .from("poll_votes")
        .select("pilihan_index")
        .eq("poll_id", poll.id);

      const counts = new Array(poll.pilihan.length).fill(0);
      (allVotes || []).forEach((v) => {
        if (v.pilihan_index >= 0 && v.pilihan_index < counts.length) {
          counts[v.pilihan_index]++;
        }
      });
      countsMap[poll.id] = counts;
    }
    setVoteCounts(countsMap);

    setLoading(false);
  };

  useEffect(() => {
    fetchPolls();
  }, [user]);

  const handleVote = async (pollId: string, pilihanIndex: number) => {
    if (!user) {
      toast({
        title: "Ralat",
        description: "Sila log masuk untuk mengundi",
        variant: "destructive",
      });
      return;
    }

    setVoting(pollId);

    const { error } = await supabase.from("poll_votes").insert({
      poll_id: pollId,
      user_id: user.id,
      pilihan_index: pilihanIndex,
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Ralat",
          description: "Anda sudah mengundi untuk undian ini",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ralat",
          description: "Gagal mengundi",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Berjaya",
        description: "Undian anda telah direkodkan",
      });
      fetchPolls();
    }

    setVoting(null);
  };

  const getPollStatus = (poll: Poll) => {
    const now = new Date();
    const start = new Date(poll.tarikh_mula);
    const end = new Date(poll.tarikh_tamat);

    if (isFuture(start)) {
      return { label: "Akan Datang", color: "bg-blue-500", active: false };
    }
    if (isPast(end)) {
      return { label: "Tamat", color: "bg-gray-500", active: false };
    }
    return { label: "Aktif", color: "bg-green-500", active: true };
  };

  const getTotalVotes = (pollId: string) => {
    const counts = voteCounts[pollId] || [];
    return counts.reduce((a, b) => a + b, 0);
  };

  const handleClosePoll = async (pollId: string) => {
    const { error } = await supabase
      .from("polls")
      .update({ status: "tamat", tarikh_tamat: new Date().toISOString() })
      .eq("id", pollId);

    if (error) {
      toast({ title: "Ralat", description: "Gagal menutup undian", variant: "destructive" });
    } else {
      toast({ title: "Berjaya", description: "Undian telah ditutup" });
      fetchPolls();
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    // First delete all votes for this poll
    await supabase.from("poll_votes").delete().eq("poll_id", pollId);
    
    // Then delete the poll
    const { error } = await supabase.from("polls").delete().eq("id", pollId);

    if (error) {
      toast({ title: "Ralat", description: "Gagal memadam undian", variant: "destructive" });
    } else {
      toast({ title: "Berjaya", description: "Undian telah dipadam" });
      fetchPolls();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {!isMobile && (
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      <main
        className={`min-h-screen transition-all duration-300 ${
          isMobile
            ? "px-4 pb-24 pt-6"
            : sidebarCollapsed
            ? "ml-20 p-8"
            : "ml-[280px] p-8"
        }`}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <Vote className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Undian Komuniti
                </h1>
                <p className="text-muted-foreground">
                  Suara anda penting untuk komuniti
                </p>
              </div>
            </div>
            
            {/* Create Poll Button - Admin Only */}
            {isAdmin && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Cipta Undian</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Cipta Undian Baru</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="tajuk">Tajuk Undian *</Label>
                      <Input
                        id="tajuk"
                        placeholder="Contoh: Aktiviti Gotong-Royong"
                        value={newPoll.tajuk}
                        onChange={(e) => setNewPoll({ ...newPoll, tajuk: e.target.value })}
                      />
                    </div>
                    
                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="deskripsi">Deskripsi (Pilihan)</Label>
                      <Textarea
                        id="deskripsi"
                        placeholder="Terangkan tujuan undian ini..."
                        value={newPoll.deskripsi}
                        onChange={(e) => setNewPoll({ ...newPoll, deskripsi: e.target.value })}
                        rows={3}
                      />
                    </div>
                    
                    {/* Options */}
                    <div className="space-y-2">
                      <Label>Pilihan Undian * (Min 2, Max 6)</Label>
                      <div className="space-y-2">
                        {newPoll.pilihan.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder={`Pilihan ${index + 1}`}
                              value={option}
                              onChange={(e) => updateOption(index, e.target.value)}
                            />
                            {newPoll.pilihan.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(index)}
                                className="shrink-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      {newPoll.pilihan.length < 6 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOption}
                          className="gap-1 mt-2"
                        >
                          <Plus className="w-4 h-4" />
                          Tambah Pilihan
                        </Button>
                      )}
                    </div>
                    
                    {/* End Date */}
                    <div className="space-y-2">
                      <Label htmlFor="tarikh_tamat">Tarikh Tamat *</Label>
                      <Input
                        id="tarikh_tamat"
                        type="date"
                        value={newPoll.tarikh_tamat}
                        min={format(new Date(), "yyyy-MM-dd")}
                        onChange={(e) => setNewPoll({ ...newPoll, tarikh_tamat: e.target.value })}
                      />
                    </div>
                    
                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setCreateDialogOpen(false);
                          resetNewPoll();
                        }}
                      >
                        Batal
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleCreatePoll}
                        disabled={creating}
                      >
                        {creating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Mencipta...
                          </>
                        ) : (
                          "Cipta Undian"
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </motion.div>

        {/* Polls List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : polls.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Vote className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              Tiada undian
            </h3>
            <p className="text-sm text-muted-foreground/70">
              Undian baru akan dipaparkan di sini
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {polls.map((poll, idx) => {
              const status = getPollStatus(poll);
              const hasVoted = userVotes[poll.id] !== undefined;
              const totalVotes = getTotalVotes(poll.id);
              const counts = voteCounts[poll.id] || [];

              return (
                <motion.div
                  key={poll.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <FloatingCard className="p-6">
                    {/* Poll Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={`${status.color} text-white border-0`}
                          >
                            {status.label}
                          </Badge>
                          {hasVoted && (
                            <Badge
                              variant="outline"
                              className="gap-1 text-green-600 border-green-600"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Sudah Undi
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-xl font-semibold">{poll.tajuk}</h2>
                        {poll.deskripsi && (
                          <p className="text-muted-foreground mt-1">
                            {poll.deskripsi}
                          </p>
                        )}
                      </div>
                      
                      {/* Admin Actions */}
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            {status.active && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Tutup Undian
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Tutup Undian?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Undian "{poll.tajuk}" akan ditutup dan ahli tidak boleh mengundi lagi. Keputusan undian akan kekal.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleClosePoll(poll.id)}>
                                      Tutup
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Padam Undian
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Padam Undian?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Undian "{poll.tajuk}" dan semua undian yang telah dibuat akan dipadam secara kekal. Tindakan ini tidak boleh dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeletePoll(poll.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Padam
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Poll Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(poll.tarikh_mula), "dd MMM", {
                            locale: ms,
                          })}{" "}
                          -{" "}
                          {format(new Date(poll.tarikh_tamat), "dd MMM yyyy", {
                            locale: ms,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{totalVotes} undian</span>
                      </div>
                    </div>

                    {/* Poll Options */}
                    <div className="space-y-3">
                      {poll.pilihan.map((pilihan, pIdx) => {
                        const voteCount = counts[pIdx] || 0;
                        const percentage =
                          totalVotes > 0
                            ? Math.round((voteCount / totalVotes) * 100)
                            : 0;
                        const isUserChoice = userVotes[poll.id] === pIdx;

                        return (
                          <div key={pIdx} className="relative">
                            {hasVoted || !status.active ? (
                              // Show results
                              <div
                                className={`relative p-4 rounded-xl border transition-all ${
                                  isUserChoice
                                    ? "border-primary bg-primary/5"
                                    : "border-border"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {isUserChoice && (
                                      <CheckCircle2 className="w-4 h-4 text-primary" />
                                    )}
                                    <span className="font-medium">
                                      {pilihan}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                      {voteCount} undi
                                    </span>
                                    <span className="font-semibold">
                                      {percentage}%
                                    </span>
                                  </div>
                                </div>
                                <Progress value={percentage} className="h-2" />
                              </div>
                            ) : (
                              // Show voting button
                              <Button
                                variant="outline"
                                className="w-full justify-start p-4 h-auto text-left hover:bg-primary/5 hover:border-primary"
                                onClick={() => handleVote(poll.id, pIdx)}
                                disabled={voting === poll.id}
                              >
                                {voting === poll.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-current mr-2" />
                                )}
                                {pilihan}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Time remaining for active polls */}
                    {status.active && !hasVoted && (
                      <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          Tamat pada{" "}
                          {format(
                            new Date(poll.tarikh_tamat),
                            "dd MMMM yyyy, HH:mm",
                            { locale: ms }
                          )}
                        </span>
                      </div>
                    )}
                  </FloatingCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {isMobile && <MobileBottomNav />}
    </div>
  );
}
