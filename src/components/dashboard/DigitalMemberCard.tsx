import { useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { User, Home, Phone, Shield, RotateCcw, CreditCard } from "lucide-react";

interface DigitalMemberCardProps {
  userName: string;
  memberNumber?: string;
  memberStatus?: string;
  noRumah?: string;
  email?: string;
  phone?: string;
  roleLabel?: string;
  uuid?: string;
}

export function DigitalMemberCard({
  userName,
  memberNumber = "1",
  memberStatus = "active",
  noRumah = "-",
  phone = "-",
  roleLabel = "Ahli",
  uuid
}: DigitalMemberCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const formattedMemberNumber = memberNumber.padStart(5, '0');
  
  const qrData = JSON.stringify({
    type: "PPUP_MEMBER",
    id: formattedMemberNumber,
    uuid: uuid,
    name: userName,
    noRumah: noRumah,
    status: memberStatus,
    verified: new Date().toISOString().split('T')[0]
  });

  const statusLabel = memberStatus === "active" ? "Aktif" : memberStatus === "pending" ? "Menunggu" : "Tidak Aktif";
  const statusColor = memberStatus === "active" ? "bg-emerald-400" : memberStatus === "pending" ? "bg-amber-400" : "bg-red-400";

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const bylaws = [
    "1. Membayar yuran bulanan RM5.00 sebelum 7 haribulan",
    "2. Menghadiri mesyuarat agung tahunan",
    "3. Menjaga dan keharmonian sesama ahli",
    "4. Mematuhi peraturan ahlijawatankuasa",
    "5. Melaporkan sebarang isu kepada jawatankuasa",
    "6. Menghormati hak dan privasi ahli"
  ];

  return (
    <div 
      className="relative w-full max-w-md mx-auto cursor-pointer select-none"
      style={{ perspective: "2000px", minHeight: "280px", aspectRatio: "1.586/1" }}
      onClick={handleFlip}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 60, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT OF CARD */}
        <div 
          className="absolute inset-0 w-full h-full rounded-[24px] overflow-hidden shadow-2xl border border-white/10"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="relative h-full bg-[#0f172a] p-5 lg:p-6 text-white flex flex-col justify-between">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20 opacity-40" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            
            {/* Header */}
            <div className="relative flex justify-between items-start z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                  <img src="/pwa-192x192.png" alt="Logo" className="w-7 h-7 object-contain" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight leading-tight uppercase">Ukay Perdana</h2>
                  <p className="text-[9px] text-blue-400 font-semibold tracking-[0.2em] uppercase">Kad ahli Digital 2026</p>
                </div>
              </div>
              <div className="w-8 h-6 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-700 opacity-80 shadow-inner flex items-center justify-center">
                 <div className="w-full h-[1px] bg-black/20" />
              </div>
            </div>

            {/* Member Number Section */}
            <div className="relative z-10 my-2">
              <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Membership Number</p>
              <div className="flex flex-col gap-1.5">
                <span className="text-3xl lg:text-4xl font-mono font-bold tracking-tighter bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                  {formattedMemberNumber}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor} shadow-[0_0_8px_rgba(52,211,153,0.5)]`} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">{statusLabel}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20`}>
                    <Shield className="w-2.5 h-2.5 text-blue-400" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-100">{roleLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Data */}
            <div className="relative z-10 grid grid-cols-[1fr_auto] gap-3 items-end border-t border-white/10 pt-3">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2.5">
                   <div className="p-1 bg-white/5 rounded-md shrink-0"><User className="w-3 h-3 text-blue-400" /></div>
                   <div className="min-w-0">
                      <p className="text-[8px] text-white/40 uppercase leading-none mb-0.5">Nama Ahli</p>
                      <p className="text-[11px] font-semibold truncate uppercase leading-tight">{userName}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2.5">
                   <div className="p-1 bg-white/5 rounded-md shrink-0"><Home className="w-3 h-3 text-blue-400" /></div>
                   <div className="min-w-0">
                      <p className="text-[8px] text-white/40 uppercase leading-none mb-0.5">Alamat Lengkap</p>
                      <p className="text-[11px] font-semibold uppercase truncate leading-tight">{noRumah}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2.5">
                   <div className="p-1 bg-white/5 rounded-md shrink-0"><Phone className="w-3 h-3 text-blue-400" /></div>
                   <div className="min-w-0">
                      <p className="text-[8px] text-white/40 uppercase leading-none mb-0.5">No. Telefon</p>
                      <p className="text-[11px] font-semibold uppercase truncate leading-tight">{phone}</p>
                   </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="bg-white p-1 rounded-lg shadow-xl ring-2 ring-black/20">
                  <QRCodeSVG value={qrData} size={48} level="H" />
                </div>
                <div className="flex items-center gap-1 text-[8px] text-white/30 uppercase tracking-tighter">
                  <RotateCcw className="w-2.5 h-2.5" /> Tap to flip
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BACK OF CARD */}
        <div 
          className="absolute inset-0 w-full h-full rounded-[24px] overflow-hidden shadow-2xl border border-white/10"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="relative h-full bg-[#0f172a] p-7 text-white flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 to-slate-900 opacity-100" />
            
            <div className="relative z-10 flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Terms & Regulations</h3>
              </div>
              <p className="text-[10px] font-mono text-white/40 italic">Ver. 2026.01</p>
            </div>

            <div className="relative z-10 flex-1 bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/5 mb-4 overflow-hidden">
              <ul className="space-y-2">
                {bylaws.slice(0, 5).map((law, index) => (
                  <li key={index} className="text-[10px] text-white/70 flex items-start gap-2 leading-tight">
                    <span className="text-blue-500">•</span> {law}
                  </li>
                ))}
                <li className="text-[10px] text-white/40 italic mt-2">+ See full bylaws on official portal</li>
              </ul>
            </div>

            <div className="relative z-10 flex justify-between items-center border-t border-white/10 pt-4 mt-auto">
              <div className="text-[10px]">
                <p className="text-white/30 uppercase text-[8px] mb-0.5">Official Support</p>
                <p className="font-medium text-blue-400">persatuanukayperdana@gmail.com</p>
              </div>
              <div className="text-right">
                <p className="text-white/30 uppercase text-[8px] mb-0.5">Validity</p>
                <p className="text-sm font-bold tracking-widest text-white/90">{new Date().getFullYear()}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
