import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
const navLinks = [{
  label: "Utama",
  href: "#"
}, {
  label: "Ciri-ciri",
  href: "#features"
}, {
  label: "Perihal Kami",
  href: "#about"
}, {
  label: "Keahlian",
  href: "#membership"
}, {
  label: "Galeri",
  href: "#gallery"
}];
export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return <>
      <motion.header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300", isScrolled ? "py-3" : "py-5")} initial={{
      y: -100
    }} animate={{
      y: 0
    }} transition={{
      duration: 0.5
    }}>
        <div className="container px-4">
          <div className={cn("flex items-center justify-between rounded-full px-6 py-3 transition-all duration-300", isScrolled ? "floating-card" : "bg-transparent")}>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">PP</span>
              </div>
              <span className="font-bold text-lg hidden sm:block">
                ​Ukay Perdana
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(link => <a key={link.label} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  {link.label}
                </a>)}
            </nav>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" className="hidden sm:inline-flex rounded-full">
                <Link to="/auth?mode=login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Masuk
                </Link>
              </Button>
              <Button asChild className="rounded-full gradient-primary hover:opacity-90">
                <Link to="/auth">
                  Daftar
                </Link>
              </Button>

              {/* Mobile Menu Toggle */}
              <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && <motion.div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-lg pt-24" initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -20
      }}>
            <nav className="container px-4 py-8">
              <ul className="space-y-6">
                {navLinks.map((link, index) => <motion.li key={link.label} initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: index * 0.1
            }}>
                    <a href={link.href} className="text-2xl font-semibold text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                      {link.label}
                    </a>
                  </motion.li>)}
              </ul>
            </nav>
          </motion.div>}
      </AnimatePresence>
    </>;
}