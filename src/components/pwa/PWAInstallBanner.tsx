import { useState, useEffect } from "react";
import { X, Download, Smartphone, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Check if banner was dismissed
    const dismissed = sessionStorage.getItem("pwa-banner-dismissed");

    // Show banner after 3 seconds if not dismissed in this session
    if (!standalone && !dismissed) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-banner-dismissed", "true");
    setShowBanner(false);
  };

  if (isStandalone || !showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
      >
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden rounded-3xl shadow-2xl"
        >
          {/* Gradient background with blue theme */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900" />
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full blur-3xl -ml-8 -mb-8" />
          
          {/* Content */}
          <div className="relative p-5 md:p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex-shrink-0 w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20"
              >
                <Smartphone className="w-7 h-7 text-white" />
              </motion.div>
              
              {/* Text content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-lg">
                    Pasang Aplikasi
                  </h3>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  </motion.div>
                </div>
                <p className="text-blue-100 text-sm mt-1">
                  {isIOS 
                    ? "Tap Share → Add to Home Screen untuk akses cepat"
                    : "Aplikasi penuh dengan akses offline dan notifikasi"
                  }
                </p>
                
                {/* Buttons */}
                <div className="flex items-center gap-2 mt-4">
                  {!isIOS && deferredPrompt && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleInstall}
                        size="sm"
                        className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 px-4"
                      >
                        <Download className="w-4 h-4" />
                        Pasang Sekarang
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  )}
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleDismiss}
                      size="sm"
                      variant="ghost"
                      className="text-white/90 hover:text-white hover:bg-white/10 font-medium transition-all backdrop-blur-sm"
                    >
                      Kemudian
                    </Button>
                  </motion.div>
                </div>
              </div>
              
              {/* Close button */}
              <motion.button
                whileHover={{ rotate: 90 }}
                onClick={handleDismiss}
                className="flex-shrink-0 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallBanner;
