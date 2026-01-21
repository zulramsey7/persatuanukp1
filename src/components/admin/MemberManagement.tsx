import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  UserCheck, 
  UserX, 
  Users, 
  Clock, 
  CheckCircle,
  XCircle,
  Filter,
  Shield,
  Crown,
  Wallet,
  UserCog,
  Receipt,
  Plus,
  Edit
} from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ms } from "date-fns/locale";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type StatusAhli = Database["public"]["Enums"]["status_ahli"];
type AppRole = Database["public"]["Enums"]["app_role"];
type YuranMasuk = Database["public"]["Tables"]["yuran_masuk"]["Row"];
type YuranBulanan = Database["public"]["Tables"]["yuran_bulanan"]["Row"];

interface MemberWithRoles extends Profile {
  roles: AppRole[];
  yuranMasuk?: YuranMasuk | null;
  yuranBulanan?: YuranBulanan[];
}

const MemberManagement = () => {
  const [members, setMembers] = useState<MemberWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<MemberWithRoles | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [yuranDialogOpen, setYuranDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("ahli");
  const [yuranType, setYuranType] = useState<"masuk" | "bulanan">("masuk");
  const [yuranForm, setYuranForm] = useState({
    jumlah: "",
    rujukan_bayaran: "",
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
  });
  const { toast } = useToast();
  const { isPengerusi, isBendahari, isNaibPengerusi, user } = useAuth();
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Fetch yuran masuk
      const { data: yuranMasukData } = await supabase
        .from("yuran_masuk")
        .select("*");

      // Fetch yuran bulanan
      const { data: yuranBulananData } = await supabase
        .from("yuran_bulanan")
        .select("*");

      // Combine profiles with roles and yuran
      const membersWithRoles: MemberWithRoles[] = (profilesData || []).map(profile => ({
        ...profile,
        roles: (rolesData || [])
          .filter(r => r.user_id === profile.id)
          .map(r => r.role),
        yuranMasuk: (yuranMasukData || []).find(y => y.user_id === profile.id && y.status === "confirmed") || null,
        yuranBulanan: (yuranBulananData || []).filter(y => y.user_id === profile.id)
      }));

      setMembers(membersWithRoles);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        title: "Ralat",
        description: "Gagal memuat senarai ahli",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (memberId: string, newStatus: StatusAhli) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status_ahli: newStatus })
        .eq("id", memberId);

      if (error) throw error;

      setMembers(members.map(m => 
        m.id === memberId ? { ...m, status_ahli: newStatus } : m
      ));

      toast({
        title: "Berjaya!",
        description: `Status ahli telah dikemaskini kepada ${newStatus === 'active' ? 'Aktif' : 'Tidak Aktif'}`,
      });

      setDialogOpen(false);
      setSelectedMember(null);
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Ralat",
        description: "Gagal mengemaskini status",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (memberId: string, newRole: AppRole) => {
    try {
      // First, delete existing non-ahli roles for this user
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", memberId)
        .neq("role", "ahli");

      if (deleteError) throw deleteError;

      // If the new role is not just 'ahli', add the new role
      if (newRole !== "ahli") {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({
            user_id: memberId,
            role: newRole,
            assigned_by: user?.id
          });

        if (insertError) throw insertError;
      }

      // Update local state
      setMembers(members.map(m => {
        if (m.id === memberId) {
          const baseRoles: AppRole[] = ["ahli"];
          if (newRole !== "ahli") {
            baseRoles.push(newRole);
          }
          return { ...m, roles: baseRoles };
        }
        return m;
      }));

      const roleLabels: Record<AppRole, string> = {
        pengerusi: "Pengerusi",
        naib_pengerusi: "Naib Pengerusi",
        setiausaha: "Setiausaha",
        penolong_setiausaha: "Penolong Setiausaha",
        bendahari: "Bendahari",
        ajk: "AJK",
        ahli: "Ahli Biasa"
      };

      toast({
        title: "Berjaya!",
        description: `Peranan telah ditukar kepada ${roleLabels[newRole]}`,
      });

      setRoleDialogOpen(false);
      setSelectedMember(null);
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Ralat",
        description: "Gagal mengemaskini peranan",
        variant: "destructive",
      });
    }
  };

  const openActionDialog = (member: MemberWithRoles, action: "approve" | "reject") => {
    setSelectedMember(member);
    setActionType(action);
    setDialogOpen(true);
  };

  const openRoleDialog = (member: MemberWithRoles) => {
    setSelectedMember(member);
    // Set current role (prioritize admin roles)
    const adminRole = member.roles.find(r => r !== "ahli");
    setSelectedRole(adminRole || "ahli");
    setRoleDialogOpen(true);
  };

  const openYuranDialog = (member: MemberWithRoles, type: "masuk" | "bulanan") => {
    setSelectedMember(member);
    setYuranType(type);
    setYuranForm({
      jumlah: type === "masuk" ? "20" : "5",
      rujukan_bayaran: "",
      bulan: new Date().getMonth() + 1,
      tahun: new Date().getFullYear(),
    });
    setYuranDialogOpen(true);
  };

  const handleAddYuran = async () => {
    if (!selectedMember || !yuranForm.jumlah) return;

    try {
      if (yuranType === "masuk") {
        // Check if already has yuran masuk
        const { data: existing } = await supabase
          .from("yuran_masuk")
          .select("id")
          .eq("user_id", selectedMember.id)
          .eq("status", "confirmed")
          .maybeSingle();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from("yuran_masuk")
            .update({
              jumlah: parseFloat(yuranForm.jumlah),
              rujukan_bayaran: yuranForm.rujukan_bayaran || `MANUAL-${Date.now()}`,
              tarikh_bayar: new Date().toISOString(),
              status: "confirmed"
            })
            .eq("id", existing.id);

          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase.from("yuran_masuk").insert({
            user_id: selectedMember.id,
            jumlah: parseFloat(yuranForm.jumlah),
            rujukan_bayaran: yuranForm.rujukan_bayaran || `MANUAL-${Date.now()}`,
            status: "confirmed"
          });

          if (error) throw error;
        }

        toast({
          title: "Berjaya!",
          description: "Yuran masuk telah dikemaskini",
        });
      } else {
        // Yuran bulanan
        const { data: existing } = await supabase
          .from("yuran_bulanan")
          .select("id")
          .eq("user_id", selectedMember.id)
          .eq("bulan", yuranForm.bulan)
          .eq("tahun", yuranForm.tahun)
          .maybeSingle();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from("yuran_bulanan")
            .update({
              jumlah: parseFloat(yuranForm.jumlah),
              rujukan_bayaran: yuranForm.rujukan_bayaran || `MANUAL-${Date.now()}`,
              tarikh_bayar: new Date().toISOString(),
              status: "sudah_bayar"
            })
            .eq("id", existing.id);

          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase.from("yuran_bulanan").insert({
            user_id: selectedMember.id,
            jumlah: parseFloat(yuranForm.jumlah),
            bulan: yuranForm.bulan,
            tahun: yuranForm.tahun,
            rujukan_bayaran: yuranForm.rujukan_bayaran || `MANUAL-${Date.now()}`,
            tarikh_bayar: new Date().toISOString(),
            status: "sudah_bayar"
          });

          if (error) throw error;
        }

        toast({
          title: "Berjaya!",
          description: `Yuran bulanan ${yuranForm.bulan}/${yuranForm.tahun} telah dikemaskini`,
        });
      }

      setYuranDialogOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error) {
      console.error("Error updating yuran:", error);
      toast({
        title: "Ralat",
        description: "Gagal mengemaskini yuran",
        variant: "destructive",
      });
    }
  };

  const getBulanLabel = (bulan: number) => {
    const bulanNames = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
    return bulanNames[bulan - 1];
  };

  // Get current month yuran status for a member
  const getCurrentMonthYuranStatus = (member: MemberWithRoles) => {
    const yuran = member.yuranBulanan?.find(
      y => y.bulan === currentMonth && y.tahun === currentYear && y.status === "sudah_bayar"
    );
    return yuran ? "sudah" : "belum";
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.nama_penuh.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.no_rumah.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || member.status_ahli === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = members.filter(m => m.status_ahli === "pending").length;
  const activeCount = members.filter(m => m.status_ahli === "active").length;
  const inactiveCount = members.filter(m => m.status_ahli === "inactive").length;

  const getStatusBadge = (status: StatusAhli) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium border border-green-500/20">
            <CheckCircle className="w-3 h-3" />
            Aktif
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium border border-yellow-500/20">
            <Clock className="w-3 h-3" />
            Menunggu
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium border border-red-500/20">
            <XCircle className="w-3 h-3" />
            Tidak Aktif
          </span>
        );
    }
  };

  const getRoleBadge = (roles: AppRole[]) => {
    const adminRole = roles.find(r => r !== "ahli");
    
    if (adminRole === "pengerusi") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium border border-purple-500/20">
          <Crown className="w-3 h-3" />
          Pengerusi
        </span>
      );
    }
    if (adminRole === "naib_pengerusi") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-medium border border-indigo-500/20">
          <Crown className="w-3 h-3" />
          Naib Pengerusi
        </span>
      );
    }
    if (adminRole === "setiausaha" || adminRole === "penolong_setiausaha") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-medium border border-cyan-500/20">
          <UserCog className="w-3 h-3" />
          {adminRole === "setiausaha" ? "Setiausaha" : "Pen. Setiausaha"}
        </span>
      );
    }
    if (adminRole === "bendahari") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-500/20">
          <Wallet className="w-3 h-3" />
          Bendahari
        </span>
      );
    }
    if (adminRole === "ajk") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-medium border border-orange-500/20">
          <Shield className="w-3 h-3" />
          AJK
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
        <Users className="w-3 h-3" />
        Ahli
      </span>
    );
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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <FloatingCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Jumlah</p>
              <p className="text-xl font-bold text-foreground">{members.length}</p>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Menunggu</p>
              <p className="text-xl font-bold text-foreground">{pendingCount}</p>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Aktif</p>
              <p className="text-xl font-bold text-foreground">{activeCount}</p>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tidak Aktif</p>
              <p className="text-xl font-bold text-foreground">{inactiveCount}</p>
            </div>
          </div>
        </FloatingCard>
      </div>

      {/* Filters */}
      <FloatingCard className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, email, atau no. rumah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FloatingCard>

      {/* Members Table */}
      <FloatingCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Ahli</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">No. Rumah</TableHead>
                <TableHead className="font-semibold hidden lg:table-cell">Email</TableHead>
                <TableHead className="font-semibold">Peranan</TableHead>
                <TableHead className="font-semibold">Yuran Masuk</TableHead>
                <TableHead className="font-semibold">
                  <div className="flex flex-col">
                    <span>Bulanan</span>
                    <span className="text-xs font-normal text-muted-foreground">{getBulanLabel(currentMonth)} {currentYear}</span>
                  </div>
                </TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member, index) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="py-4">
                    <div>
                      <p className="font-medium text-foreground">{member.nama_penuh}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{member.no_rumah}</p>
                      <p className="text-xs text-muted-foreground lg:hidden">{member.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{member.no_rumah}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{member.email}</TableCell>
                  <TableCell>{getRoleBadge(member.roles)}</TableCell>
                  <TableCell>
                    {member.yuranMasuk ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium border border-green-500/20">
                        <CheckCircle className="w-3 h-3" />
                        RM {Number(member.yuranMasuk.jumlah).toFixed(0)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium border border-red-500/20">
                        <XCircle className="w-3 h-3" />
                        Belum
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getCurrentMonthYuranStatus(member) === "sudah" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium border border-green-500/20">
                        <CheckCircle className="w-3 h-3" />
                        Sudah
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-500/20">
                        <XCircle className="w-3 h-3" />
                        Belum
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(member.status_ahli)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {/* Yuran Management - For Pengerusi and Bendahari */}
                      {(isPengerusi || isBendahari) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
                          onClick={() => openYuranDialog(member, "masuk")}
                        >
                          <Receipt className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Yuran</span>
                        </Button>
                      )}

                      {/* Role Management - Pengerusi & Naib Pengerusi */}
                      {(isPengerusi || isNaibPengerusi) && member.id !== user?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
                          onClick={() => openRoleDialog(member)}
                        >
                          <UserCog className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Peranan</span>
                        </Button>
                      )}
                      
                      {/* Status Management */}
                      {member.status_ahli === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={() => openActionDialog(member, "approve")}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Luluskan</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => openActionDialog(member, "reject")}
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Tolak</span>
                          </Button>
                        </>
                      )}
                      {member.status_ahli === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => openActionDialog(member, "reject")}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Nyahaktif</span>
                        </Button>
                      )}
                      {member.status_ahli === "inactive" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
                          onClick={() => openActionDialog(member, "approve")}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Aktifkan</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Tiada ahli dijumpai</p>
          </div>
        )}
      </FloatingCard>

      {/* Status Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "approve" ? (
                <UserCheck className="w-5 h-5 text-green-600" />
              ) : (
                <UserX className="w-5 h-5 text-red-600" />
              )}
              {actionType === "approve" ? "Luluskan Ahli" : "Tolak/Nyahaktifkan Ahli"}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {actionType === "approve" 
                ? `Adakah anda pasti mahu meluluskan ${selectedMember?.nama_penuh}?`
                : `Adakah anda pasti mahu menolak/nyahaktifkan ${selectedMember?.nama_penuh}?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={() => {
                if (selectedMember) {
                  handleStatusChange(
                    selectedMember.id,
                    actionType === "approve" ? "active" : "inactive"
                  );
                }
              }}
            >
              {actionType === "approve" ? "Luluskan" : "Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog - Only for Pengerusi */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-600" />
              Tukar Peranan Ahli
            </DialogTitle>
            <DialogDescription className="pt-2">
              Pilih peranan baru untuk <strong>{selectedMember?.nama_penuh}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih peranan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pengerusi">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-600" />
                    Pengerusi
                  </div>
                </SelectItem>
                <SelectItem value="naib_pengerusi">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-indigo-600" />
                    Naib Pengerusi
                  </div>
                </SelectItem>
                <SelectItem value="setiausaha">
                  <div className="flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-cyan-600" />
                    Setiausaha
                  </div>
                </SelectItem>
                <SelectItem value="penolong_setiausaha">
                  <div className="flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-cyan-500" />
                    Penolong Setiausaha
                  </div>
                </SelectItem>
                <SelectItem value="bendahari">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-600" />
                    Bendahari
                  </div>
                </SelectItem>
                <SelectItem value="ajk">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-600" />
                    AJK (Ahli Jawatankuasa)
                  </div>
                </SelectItem>
                <SelectItem value="ahli">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Ahli Biasa
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Nota:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Pengerusi</strong> - Akses penuh</li>
                <li><strong>Naib Pengerusi</strong> - Akses penuh kecuali padam</li>
                <li><strong>Setiausaha</strong> - Urus data ahli</li>
                <li><strong>Bendahari</strong> - Urus kewangan</li>
                <li><strong>AJK</strong> - Urus galeri, undian & pengumuman</li>
                <li><strong>Ahli</strong> - Akses asas sahaja</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                if (selectedMember) {
                  handleRoleChange(selectedMember.id, selectedRole);
                }
              }}
            >
              Simpan Peranan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yuran Management Dialog - For Pengerusi and Bendahari */}
      <Dialog open={yuranDialogOpen} onOpenChange={setYuranDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-600" />
              {yuranType === "masuk" ? "Urus Yuran Masuk" : "Urus Yuran Bulanan"}
            </DialogTitle>
            <DialogDescription className="pt-2">
              Kemaskini bayaran untuk <strong>{selectedMember?.nama_penuh}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Jenis Yuran</Label>
              <Select value={yuranType} onValueChange={(value: "masuk" | "bulanan") => {
                setYuranType(value);
                setYuranForm({
                  ...yuranForm,
                  jumlah: value === "masuk" ? "20" : "5"
                });
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masuk">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-green-600" />
                      Yuran Masuk (RM20)
                    </div>
                  </SelectItem>
                  <SelectItem value="bulanan">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-600" />
                      Yuran Bulanan (RM5)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {yuranType === "bulanan" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Bulan</Label>
                  <Select 
                    value={String(yuranForm.bulan)} 
                    onValueChange={(value) => setYuranForm({...yuranForm, bulan: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {getBulanLabel(i + 1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tahun</Label>
                  <Select 
                    value={String(yuranForm.tahun)} 
                    onValueChange={(value) => setYuranForm({...yuranForm, tahun: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Jumlah (RM)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={yuranForm.jumlah}
                onChange={(e) => setYuranForm({...yuranForm, jumlah: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Rujukan Bayaran (Pilihan)</Label>
              <Input
                placeholder="Contoh: TUNAI-001, TT-12345"
                value={yuranForm.rujukan_bayaran}
                onChange={(e) => setYuranForm({...yuranForm, rujukan_bayaran: e.target.value})}
              />
            </div>

            {selectedMember?.yuranMasuk && yuranType === "masuk" && (
              <div className="bg-green-500/10 rounded-lg p-3 text-sm">
                <p className="font-medium text-green-600 mb-1">✓ Sudah Bayar Yuran Masuk</p>
                <p className="text-xs text-muted-foreground">
                  Rujukan: {selectedMember.yuranMasuk.rujukan_bayaran || "-"}
                </p>
              </div>
            )}

            {yuranType === "bulanan" && selectedMember?.yuranBulanan && selectedMember.yuranBulanan.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium text-foreground mb-2 text-sm">Rekod Yuran Bulanan:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedMember.yuranBulanan
                    .filter(y => y.status === "sudah_bayar")
                    .sort((a, b) => (a.tahun * 12 + a.bulan) - (b.tahun * 12 + b.bulan))
                    .slice(-6)
                    .map((y) => (
                      <span key={y.id} className="px-2 py-1 bg-green-500/10 text-green-600 text-xs rounded-full">
                        {getBulanLabel(y.bulan)} {y.tahun}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setYuranDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddYuran} className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Simpan Bayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberManagement;
