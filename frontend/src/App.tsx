import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SkipLink } from "@/components/SkipLink";
import { Agenda } from "@/sections/Agenda";
import { Announcements } from "@/sections/Announcements";
import { CallToAction } from "@/sections/CallToAction";
import { Hero } from "@/sections/Hero";
import { News } from "@/sections/News";
import { Partners } from "@/sections/Partners";
import { Programs } from "@/sections/Programs";
import { Stats } from "@/sections/Stats";

export default function App() {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="konten-utama" tabIndex={-1}>
        <Hero />
        <Stats />
        <Programs />
        <News />
        <Agenda />
        <Announcements />
        <Partners />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
