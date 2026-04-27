import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { CommitteeSection } from "@/components/landing/CommitteeSection";
import { BureauSection } from "@/components/landing/BureauSection";
import { GallerySection } from "@/components/landing/GallerySection";
import { MembershipSection } from "@/components/landing/MembershipSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <div id="jawatankuasa">
          <CommitteeSection />
        </div>
        <div id="biro">
          <BureauSection />
        </div>
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="about">
          <AboutSection />
        </div>
        <div id="membership">
          <MembershipSection />
        </div>
        <div id="gallery">
          <GallerySection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
