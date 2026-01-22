import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Facebook, MessageCircle, Clock, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const HubungiKami = () => {
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
      details: ["+60 10-285 8832 (Pengerusi-Kamal)", "+60 17-330 4906 (Setiausaha-Zulfikar)", "+60 11-110 76900 (Bendahari-A.Malik)],
      action: "Hubungi Sekarang",
      link: "tel:+60173304906"
    },
    {
      icon: Mail,
      title: "Emel",
      details: ["persatuanukayperdana@gmail.com", "persatuanukayperdana@gmail.com"],
      action: "Hantar Emel",
      link: "mailto:info@persatuanukp1.com"
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
    <MainLayout>
      <div className="space-y-8 pb-10">
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Hubungi Kami</h1>
          <p className="text-muted-foreground">
            Ada pertanyaan atau cadangan? Hubungi kami melalui saluran di bawah.
          </p>
        </div>

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
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-1">
                    {item.details.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                  {item.action && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-4" 
                      asChild
                    >
                      <a href={item.link || "#"} target="_blank" rel="noopener noreferrer">
                        {item.action}
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Social Media & Map Section */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2"
        >
          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Media Sosial
              </CardTitle>
              <CardDescription>
                Ikuti perkembangan terkini aktiviti persatuan di media sosial rasmi kami.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <Facebook className="mr-2 h-4 w-4" /> Facebook
                  </a>
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" asChild>
                  <a href="https://wa.me/60173304906" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Office Location Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Pejabat Urusan
              </CardTitle>
              <CardDescription>
                Lokasi pejabat urusan Persatuan Penduduk UKP1.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[150px] bg-muted/50 rounded-md flex items-center justify-center border-2 border-dashed">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Peta Lokasi Google Maps</p>
                <p className="text-xs mt-1">(Akan Datang)</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default HubungiKami;
