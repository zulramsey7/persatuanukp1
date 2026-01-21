import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/integrations/supabase/react-query/client";
import App from "./App.tsx";
import PWAInstallBanner from "./components/pwa/PWAInstallBanner.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <PWAInstallBanner />
  </QueryClientProvider>
);

