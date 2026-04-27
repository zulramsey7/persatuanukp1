import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Plus,
  Vote,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  X
} from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";
import { Database, Json } from "@/integrations/supabase/types";

type Poll = Database["public"]["Tables"]["polls"]["Row"];
type PollVote = Database["public"]["Tables"]["poll_votes"]["Row"];

interface PollWithVotes extends Poll {
  votes: PollVote[];
}

const PollManagement = () => {
  const [polls, setPolls] = useState<PollWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [newPoll, setNewPoll] = useState({
    tajuk: "",
    deskripsi: "",
    pilihan: ["", ""],
    tarikh_tamat: "",
  });

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const { data: pollsData, error: pollsError } = await supabase
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false });

      if (pollsError) throw pollsError;

      // Fetch votes for all polls
      const pollsWithVotes: PollWithVotes[] = await Promise.all(
        (pollsData || []).map(async (poll) => {
          const { data: votes } = await supabase
            .from("poll_votes")
            .select("*")
            .eq("poll_id", poll.id);
          
          return { ...poll, votes: votes || [] };
        })
      );

      setPolls(pollsWithVotes);
    } catch (error) {
      console.error("Error fetching polls:", error);
      toast({
        title: "Ralat",
        description: "Gagal memuat undian",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    if (newPoll.pilihan.length < 5) {
      setNewPoll({ ...newPoll, pilihan: [...newPoll.pilihan, ""] });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (newPoll.pilihan.length > 2) {
      const updated = newPoll.pilihan.filter((_, i) => i !== index);
      setNewPoll({ ...newPoll, pilihan: updated });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...newPoll.pilihan];
    updated[index] = value;
    setNewPoll({ ...newPoll, pilihan: updated });
  };

  const handleCreatePoll = async () => {
    if (!newPoll.tajuk || !newPoll.tarikh_tamat || newPoll.pilihan.some(p => !p.trim())) {
      toast({
        title: "Ralat",
        description: "Sila isi semua maklumat yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("polls").insert({
        tajuk: newPoll.tajuk,
        deskripsi: newPoll.deskripsi || null,
        pilihan: newPoll.pilihan.filter(p => p.trim()) as unknown as Json,
        tarikh_tamat: newPoll.tarikh_tamat,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Undian telah dicipta",
      });

      setDialogOpen(false);
      setNewPoll({
        tajuk: "",
        deskripsi: "",
        pilihan: ["", ""],
        tarikh_tamat: "",
      });
      fetchPolls();
    } catch (error) {
      console.error("Error creating poll:", error);
      toast({
        title: "Ralat",
        description: "Gagal mencipta undian",
        variant: "destructive",
      });
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      const { error } = await supabase
        .from("polls")
        .update({ status: "tamat" })
        .eq("id", pollId);

      if (error) throw error;

      toast({
        title: "Berjaya!",
        description: "Undian telah ditutup",
      });
      fetchPolls();
    } catch (error) {
      console.error("Error closing poll:", error);
      toast({
        title: "Ralat",
        description: "Gagal menutup undian",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (poll: Poll) => {
    const now = new Date();
    const endDate = new Date(poll.tarikh_tamat);

    if (poll.status === "tamat" || endDate < now) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-600 text-xs font-medium">
          <XCircle className="w-3 h-3" />
          Tamat
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-600 text-xs font-medium">
        <CheckCircle className="w-3 h-3" />
        Aktif
      </span>
    );
  };

  const getPilihan = (poll: Poll): string[] => {
    if (Array.isArray(poll.pilihan)) {
      return poll.pilihan as string[];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">E-Undian</h2>
          <p className="text-sm text-muted-foreground">{polls.length} undian</p>
        </div>
        
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Cipta Undian
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cipta Undian Baru</DialogTitle>
                <DialogDescription>
                  Buat undian untuk ahli persatuan
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Tajuk Undian</Label>
                  <Input
                    placeholder="Contoh: Lokasi Majlis Hari Raya 2024"
                    value={newPoll.tajuk}
                    onChange={(e) => setNewPoll({ ...newPoll, tajuk: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Deskripsi (Pilihan)</Label>
                  <Textarea
                    placeholder="Maklumat tambahan..."
                    value={newPoll.deskripsi}
                    onChange={(e) => setNewPoll({ ...newPoll, deskripsi: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pilihan Undian</Label>
                  {newPoll.pilihan.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Pilihan ${index + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                      />
                      {newPoll.pilihan.length > 2 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {newPoll.pilihan.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Tambah Pilihan
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tarikh Tamat</Label>
                  <Input
                    type="datetime-local"
                    value={newPoll.tarikh_tamat}
                    onChange={(e) => setNewPoll({ ...newPoll, tarikh_tamat: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreatePoll}>Cipta</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Polls List */}
      <div className="space-y-4">
        {polls.map((poll, index) => {
          const pilihan = getPilihan(poll);
          const totalVotes = poll.votes.length;

          return (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <FloatingCard className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Vote className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground">{poll.tajuk}</h3>
                    </div>
                    {poll.deskripsi && (
                      <p className="text-sm text-muted-foreground">{poll.deskripsi}</p>
                    )}
                  </div>
                  {getStatusBadge(poll)}
                </div>

                {/* Results */}
                <div className="space-y-3 mb-4">
                  {pilihan.map((option, optIndex) => {
                    const voteCount = poll.votes.filter(v => v.pilihan_index === optIndex).length;
                    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

                    return (
                      <div key={optIndex} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{option}</span>
                          <span className="text-muted-foreground">
                            {voteCount} undi ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      {totalVotes} jumlah undi
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Tamat: {format(new Date(poll.tarikh_tamat), "dd MMM yyyy, HH:mm", { locale: ms })}
                    </span>
                  </div>

                  {isAdmin && poll.status === "aktif" && new Date(poll.tarikh_tamat) > new Date() && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleClosePoll(poll.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Tutup Undian
                    </Button>
                  )}
                </div>
              </FloatingCard>
            </motion.div>
          );
        })}
      </div>

      {polls.length === 0 && (
        <FloatingCard className="p-8">
          <div className="text-center">
            <Vote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Tiada undian</p>
            {isAdmin && (
              <Button className="mt-4 gap-2" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                Cipta Undian Pertama
              </Button>
            )}
          </div>
        </FloatingCard>
      )}
    </div>
  );
};

export default PollManagement;
