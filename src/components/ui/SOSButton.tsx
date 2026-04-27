import { Phone } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const emergencyContacts = [
  { name: "Polis", number: "999", icon: "🚔" },
  { name: "Bomba", number: "994", icon: "🚒" },
  { name: "Ambulans", number: "999", icon: "🚑" },
  { name: "Pengawal Keselamatan", number: "012-3456789", icon: "👮" },
  { name: "Pengerusi Persatuan", number: "012-9876543", icon: "📞" },
];

export function SOSButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.button
          className="sos-button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Nombor Kecemasan"
        >
          <Phone className="h-6 w-6 text-destructive-foreground" />
        </motion.button>
      </DialogTrigger>
      <DialogContent className="floating-card max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-destructive">
            🚨 Nombor Kecemasan
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {emergencyContacts.map((contact) => (
            <motion.a
              key={contact.name}
              href={`tel:${contact.number}`}
              className="flex items-center justify-between p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{contact.icon}</span>
                <span className="font-medium">{contact.name}</span>
              </div>
              <span className="text-primary font-semibold">{contact.number}</span>
            </motion.a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
