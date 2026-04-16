import Navbar from './landing/Navbar';
import Hero from './landing/Hero';
import About from './landing/About';
import Sessions from './landing/Sessions';
import Packages from './landing/Packages';
import HowItWorks from './landing/HowItWorks';
import Testimonials from './landing/Testimonials';
import Footer from './landing/Footer';

export default function LandingPage() {
  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }} className="min-h-screen bg-white text-slate-900 antialiased">
      <Navbar />
      <Hero />
      <About />
      <Sessions />
      <Packages />
      <HowItWorks />
      <Testimonials />
      <Footer />
    </div>
  );
}
