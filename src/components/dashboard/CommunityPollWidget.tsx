import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Vote, Check, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ms } from "date-fns/locale";
import { toast } from "sonner";

interface Poll {
  id: string;
  tajuk: string;
  deskripsi: string | null;
  pilihan: string[];
  status: string;
  tarikh_tamat: string;
  created_at: string;
}

interface PollVote {
  poll_id: string;
  pilihan_index: number;
  user_id: string;
}

export function CommunityPollWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    fetchPolls();
  }, [user]);

  const fetchPolls = async () => {
    try {
      // Fetch active polls
      const { data: pollsData, error: pollsError } = await supabase
        .from("polls")
        .select("*")
        .eq("status", "aktif")
        .order("created_at", { ascending: false })
        .limit(2);

      if (pollsError) throw pollsError;

      // Process polls to extract pilihan as string array
      const processedPolls: Poll[] = (pollsData || []).map(poll => ({
        id: poll.id,
        tajuk: poll.tajuk,
        deskripsi: poll.deskripsi,
        pilihan: Array.isArray(poll.pilihan) 
          ? (poll.pilihan as unknown as string[])
          : [],
        status: poll.status,
        tarikh_tamat: poll.tarikh_tamat,
        created_at: poll.created_at
      }));

      setPolls(processedPolls);

      // Fetch all votes for these polls
      if (processedPolls.length > 0) {
        const pollIds = processedPolls.map(p => p.id);
        
        const { data: votesData, error: votesError } = await supabase
          .from("poll_votes")
          .select("*")
          .in("poll_id", pollIds);

        if (votesError) throw votesError;
        setVotes(votesData || []);

        // Get current user's votes
        if (user) {
          const userVotesMap: Record<string, number> = {};
          (votesData || []).forEach(vote => {
            if (vote.user_id === user.id) {
              userVotesMap[vote.poll_id] = vote.pilihan_index;
            }
          });
          setUserVotes(userVotesMap);
        }
      }
    } catch (error) {
      console.error("Error fetching polls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, pilihanIndex: number) => {
    if (!user) {
      toast.error("Sila log masuk untuk mengundi");
      return;
    }

    if (userVotes[pollId] !== undefined) {
      toast.error("Anda sudah mengundi untuk undian ini");
      return;
    }

    setVoting(pollId);

    try {
      const { error } = await supabase
        .from("poll_votes")
        .insert({
          poll_id: pollId,
          user_id: user.id,
          pilihan_index: pilihanIndex
        });

      if (error) throw error;

      toast.success("Undi anda telah direkodkan!");
      fetchPolls();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengundi");
    } finally {
      setVoting(null);
    }
  };

  const getVoteCount = (pollId: string, pilihanIndex: number) => {
    return votes.filter(v => v.poll_id === pollId && v.pilihan_index === pilihanIndex).length;
  };

  const getTotalVotes = (pollId: string) => {
    return votes.filter(v => v.poll_id === pollId).length;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-6 shadow-card"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Vote className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Undian Komuniti</h3>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-xl shimmer" />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Vote className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Undian Komuniti</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => navigate("/undian")}
        >
          Lihat Semua <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-8">
          <Vote className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Tiada undian aktif</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const hasVoted = userVotes[poll.id] !== undefined;
            const totalVotes = getTotalVotes(poll.id);
            const pilihan = poll.pilihan as string[];

            return (
              <div
                key={poll.id}
                className="p-4 rounded-xl bg-muted/30 border border-border/50"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-medium text-foreground text-sm">
                      {poll.tajuk}
                    </h4>
                    {poll.deskripsi && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {poll.deskripsi}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {format(new Date(poll.tarikh_tamat), "d MMM", { locale: ms })}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {pilihan.map((option, index) => {
                    const voteCount = getVoteCount(poll.id, index);
                    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                    const isSelected = userVotes[poll.id] === index;

                    return (
                      <button
                        key={index}
                        onClick={() => !hasVoted && handleVote(poll.id, index)}
                        disabled={hasVoted || voting === poll.id}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          hasVoted
                            ? "cursor-default"
                            : "hover:bg-muted/50 cursor-pointer"
                        } ${isSelected ? "bg-primary/10 border border-primary/30" : "bg-background/50"}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground flex items-center gap-2">
                            {option}
                            {isSelected && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </span>
                          {hasVoted && (
                            <span className="text-xs text-muted-foreground">
                              {voteCount} undi ({percentage.toFixed(0)}%)
                            </span>
                          )}
                        </div>
                        {hasVoted && (
                          <Progress 
                            value={percentage} 
                            className="h-1.5"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  {totalVotes} jumlah undi
                </p>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
