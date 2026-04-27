import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ms } from "date-fns/locale";
import { 
  History, 
  User, 
  Tag, 
  Calendar, 
  Info, 
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
  profiles: {
    nama_penuh: string;
  } | null;
}

const AuditLogManagement = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          *,
          profiles!admin_id (nama_penuh)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs((data as any) || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.profiles?.nama_penuh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter;
    
    return matchesSearch && matchesEntity;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE': return <Badge className="bg-green-500">CREATE</Badge>;
      case 'UPDATE': return <Badge className="bg-blue-500">UPDATE</Badge>;
      case 'DELETE': return <Badge className="bg-red-500">DELETE</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Log Aktiviti Pentadbir
          </h2>
          <p className="text-sm text-muted-foreground">Merekodkan setiap perubahan data oleh admin</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Segarkan
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama admin, tindakan..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-full md:w-48">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="Jenis Data" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            <SelectItem value="profiles">Profil Ahli</SelectItem>
            <SelectItem value="finance">Kewangan</SelectItem>
            <SelectItem value="notifications">Pengumuman</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FloatingCard className="overflow-hidden border-none shadow-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[180px]">Tarikh & Masa</TableHead>
                <TableHead>Pentadbir</TableHead>
                <TableHead>Tindakan</TableHead>
                <TableHead>Jenis Data</TableHead>
                <TableHead>Perincian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Tiada log aktiviti dijumpai
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs font-medium">
                      <div className="flex flex-col">
                        <span>{format(new Date(log.created_at), "dd MMM yyyy", { locale: ms })}</span>
                        <span className="text-muted-foreground">{format(new Date(log.created_at), "HH:mm:ss")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{log.profiles?.nama_penuh || "Sistem"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs uppercase tracking-wider font-semibold opacity-70">{log.entity_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate text-xs text-muted-foreground italic">
                        {log.action === 'UPDATE' ? (
                          <span>Mengemaskini data ({Object.keys(log.new_data || {}).join(", ")})</span>
                        ) : log.action === 'CREATE' ? (
                          <span>Mencipta rekod baru: {log.new_data?.tajuk || log.new_data?.nama_penuh || log.entity_id}</span>
                        ) : (
                          <span>Tindakan pada ID: {log.entity_id}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </FloatingCard>
    </div>
  );
};

export default AuditLogManagement;
