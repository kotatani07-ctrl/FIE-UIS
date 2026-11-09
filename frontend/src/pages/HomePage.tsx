import { Agenda } from "@/sections/Agenda";
import { Announcements } from "@/sections/Announcements";
import { CallToAction } from "@/sections/CallToAction";
import { Hero } from "@/sections/Hero";
import { News } from "@/sections/News";
import { Programs } from "@/sections/Programs";
import { Stats } from "@/sections/Stats";
import { PageShell } from "@/components/PageShell";
import { site } from "@/lib/site";
import { routes } from "@/app/routes";

export function HomePage() {
  return (
    <PageShell
      title={`${site.facultyName} | ${site.universityName}`}
      description={site.description}
      path={routes.home}
    >
      <Hero />
      <Stats />
      <Programs />
      <News />
      <Agenda />
      <Announcements />
      <CallToAction />
    </PageShell>
  );
}
