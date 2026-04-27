import { Heart } from "lucide-react";

export function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-6 px-4 border-t border-border bg-card/50">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>
          © {currentYear} e-Penduduk. Hak Cipta Terpelihara.
        </p>
        <p className="flex items-center gap-1">
          Dibina dengan <Heart className="w-4 h-4 text-destructive fill-destructive" /> untuk komuniti
        </p>
      </div>
    </footer>
  );
}