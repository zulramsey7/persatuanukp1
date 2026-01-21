import { Home, Wallet, Image, FolderOpen, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Utama", path: "/dashboard" },
  { icon: Wallet, label: "Kewangan", path: "/kewangan" },
  { icon: FolderOpen, label: "Dokumen", path: "/dokumen" },
  { icon: Image, label: "Galeri", path: "/galeri" },
  { icon: User, label: "Profil", path: "/profil" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <motion.nav
      className="bottom-nav"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
    >
      <div className="flex items-center gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center px-4 py-2 rounded-full transition-all duration-300",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {isActive && (
                <motion.span
                  className="text-xs font-medium mt-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
