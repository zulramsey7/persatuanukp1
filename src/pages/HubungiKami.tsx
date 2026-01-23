import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";

const HubungiKami = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate(-1);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Alamat",
      details: ["Jalan Ukay Perdana 1,", "Taman Ukay Perdana,", "68000 Ampang, Selangor"],
      action: "Lihat di Peta",
      link: "https://maps.google.com/?q=Taman+Ukay+Perdana+Ampang"
    },
    {
      icon: Phone,
      title: "Telefon",
      details: ["+60 10-285 8832 (Pengerusi-Kamal)", "+60 17-330 4906 (Setiausaha-Zulfikar)", "+60 11-110 76900 (Bendahari-A.Malik)"],
      action: "Hubungi Sekarang",
      link: "tel:+60173304906"
    },
    {
      icon: Mail,
      title: "Emel",
      details: ["persatuanukayperdana@gmail.com"],
      action: "Hantar Emel",
      link: "mailto:persatuanukayperdana@gmail.com"
    },
    {
      icon: Clock,
      title: "Waktu Urusan",
      details: ["Setiap Hari boleh whatsapp/call"],
      action: null,
      link: null
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 pb-24">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={handleBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Hubungi Kami</h1>
            <p className="text-muted-foreground text-sm">Saluran komunikasi rasmi persatuan</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 space-y-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {contactInfo.map((item, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {item.details.map((detail, i) => (
                        <p key={i} className="text-muted-foreground">{detail}</p>
                      ))}
                    </div>
                    {item.action && item.link && (
                      <Button asChild className="w-full" variant="outline">
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          {item.action}
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default HubungiKami;
