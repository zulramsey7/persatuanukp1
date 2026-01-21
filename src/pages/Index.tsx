import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { GallerySection } from "@/components/landing/GallerySection";
import { MembershipSection } from "@/components/landing/MembershipSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="about">
          <AboutSection />
        </div>
        <div id="gallery">
          <GallerySection />
        </div>
        <div id="membership">
          <MembershipSection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
