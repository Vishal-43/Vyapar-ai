import Footer from "../components/Footer";
import AboutOurApps from "../components/landing/AboutApp";
import ArchitectureSection from "../components/landing/Architecture";
import HeroSection from "../components/landing/HeroSection";
import LenisScroll from "../components/landing/LenisScroll";
import Navbar from "../components/landing/Navbar";
import SubscribeNewsletter from "../components/landing/Newsletter";
import OurLatestCreation from "../components/landing/OurLatestCreation";

const Landing: React.FC = () => {
  return (
    <div className=" bg-black overflow-x-hidden">
        <Navbar />
        <LenisScroll />
        
      <div className="relative z-10 px-6  md:px-16 lg:px-24 xl:px-32">

        <HeroSection />
        <OurLatestCreation />
        <AboutOurApps />
        <ArchitectureSection />
        <SubscribeNewsletter/>
      </div>
      <Footer/>
    </div>
  );
};

export default Landing;
