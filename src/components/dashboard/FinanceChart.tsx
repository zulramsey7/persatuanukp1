import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";
import { TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ChartData {
  name: string;
  pendapatan: number;
  perbelanjaan: number;
}

interface FinanceChartProps {
  data: ChartData[];
  loading?: boolean;
}

export function FinanceChart({ data, loading }: FinanceChartProps) {
  const { toast } = useToast();

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast({
        title: "Tiada data",
        description: "Tiada data untuk dieksport",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Bulan", "Pendapatan (RM)", "Perbelanjaan (RM)"];
    const csvContent = [
      headers.join(","),
      ...data.map(item => 
        `${item.name},${item.pendapatan},${item.perbelanjaan}`
      )
    ].join("\n");

    const element = document.createElement("a");
    const file = new Blob([csvContent], {type: 'text/csv'});
    element.href = URL.createObjectURL(file);
    element.download = `kewangan_tahunan_${format(new Date(), "yyyy")}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Berjaya",
      description: "Laporan kewangan berjaya dimuat turun",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="chart-container"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Pendapatan vs Perbelanjaan
          </h3>
          <p className="text-sm text-muted-foreground">
            Perbandingan bulanan tahun semasa
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Eksport
        </Button>
      </div>

      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              className="text-xs fill-muted-foreground"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              className="text-xs fill-muted-foreground"
              tickFormatter={(value) => `RM${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "var(--shadow-lg)"
              }}
              formatter={(value: number) => [`RM ${value.toFixed(2)}`, ""]}
            />
            <Legend />
            <Bar 
              dataKey="pendapatan" 
              fill="hsl(var(--success))" 
              radius={[6, 6, 0, 0]}
              name="Pendapatan"
            />
            <Bar 
              dataKey="perbelanjaan" 
              fill="hsl(var(--destructive))" 
              radius={[6, 6, 0, 0]}
              name="Perbelanjaan"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

interface MemberGrowthChartProps {
  data: { name: string; ahli: number }[];
  loading?: boolean;
}

export function MemberGrowthChart({ data, loading }: MemberGrowthChartProps) {
  const { toast } = useToast();

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast({
        title: "Tiada data",
        description: "Tiada data untuk dieksport",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Bulan", "Jumlah Ahli"];
    const csvContent = [
      headers.join(","),
      ...data.map(item => 
        `${item.name},${item.ahli}`
      )
    ].join("\n");

    const element = document.createElement("a");
    const file = new Blob([csvContent], {type: 'text/csv'});
    element.href = URL.createObjectURL(file);
    element.download = `pertumbuhan_ahli_${format(new Date(), "yyyy")}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Berjaya",
      description: "Laporan keahlian berjaya dimuat turun",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="chart-container"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Pertumbuhan Ahli
            </h3>
            <p className="text-sm text-muted-foreground">
              Trend keahlian sepanjang tahun
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Eksport
        </Button>
      </div>

      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              className="text-xs fill-muted-foreground"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              className="text-xs fill-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "var(--shadow-lg)"
              }}
            />
            <Line 
              type="monotone" 
              dataKey="ahli" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
              name="Jumlah Ahli"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}