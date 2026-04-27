import { motion } from "framer-motion";
import { DigitalMemberCard } from "./DigitalMemberCard";

interface HeroSectionProps {
  userName: string;
  memberNumber?: string;
  memberStatus?: string;
  noRumah?: string;
  email?: string;
  phone?: string;
  roleLabel?: string;
  uuid?: string;
}

export function HeroSection({ 
  userName, 
  memberNumber = "1",
  memberStatus = "active",
  noRumah = "-",
  phone = "-",
  roleLabel = "Ahli",
  uuid
}: HeroSectionProps) {

  return (
    <div className="flex items-center justify-center py-4 w-full">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md lg:max-w-xl"
      >
        <DigitalMemberCard
          userName={userName}
          memberNumber={memberNumber}
          memberStatus={memberStatus}
          noRumah={noRumah}
          phone={phone}
          roleLabel={roleLabel}
          uuid={uuid}
        />
      </motion.div>
    </div>
  );
}
