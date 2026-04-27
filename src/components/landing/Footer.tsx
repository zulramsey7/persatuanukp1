import { MapPin, Phone, Mail, Facebook, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
export function Footer() {
  return <footer className="bg-foreground text-background py-16">
      <div className="container px-4">
        <div className="grid md:grid-cols-4 gap-10">
          {/* About */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-4">
              Persatuan Penduduk Ukay Perdana
            </h3>
            <p className="text-background/70 mb-6 leading-relaxed">
              Platform digital untuk menguruskan keahlian dan aktiviti komuniti. 
              Bersama kita bina kejiranan yang harmoni dan sejahtera.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://wa.me/60123456789" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-success transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Pautan Pantas</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/auth" className="text-background/70 hover:text-primary transition-colors">
                  Daftar / Log Masuk
                </Link>
              </li>
              <li>
                <Link to="/galeri" className="text-background/70 hover:text-primary transition-colors">
                  Galeri Aktiviti
                </Link>
              </li>
              <li>
                <Link to="#" className="text-background/70 hover:text-primary transition-colors">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="#" className="text-background/70 hover:text-primary transition-colors">
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Hubungi Kami</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-background/70 text-sm">
                  Jalan Ukay Perdana 1,<br />
                  Taman Ukay Perdana,<br />
                  68000 Ampang, Selangor
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <a href="tel:+60123456789" className="text-background/70 text-sm hover:text-primary">017-3304906</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <a href="mailto:info@ppup.my" className="text-background/70 text-sm hover:text-primary">persatuanukayperdana@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center">
          <p className="text-background/50 text-sm">
            © {new Date().getFullYear()} Persatuan Penduduk Ukay Perdana. Hak Cipta Terpelihara.
          </p>
        </div>
      </div>
    </footer>;
}