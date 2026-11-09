import { Link } from "react-router-dom";
import { useSiteSettings } from "@/api/hooks";
import { navigation, site } from "@/lib/site";
import { BrandLogo } from "./BrandLogo";
import { LocationMap } from "./LocationMap";
import { Container } from "./ui";

export function Footer() {
  const year = new Date().getFullYear();
  const { data } = useSiteSettings();

  return (
    <footer className="border-t border-line bg-surface-2">
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.1fr_0.7fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-14 shrink-0 rounded-lg bg-white p-1" />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-base font-bold text-ink">
                {data?.faculty_name ?? site.facultyName}
              </span>
              <span className="text-xs text-muted">
                {data?.university_name ?? site.universityName}
              </span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            {site.description}
          </p>
        </div>

        <nav aria-label="Tautan footer">
          <h2 className="font-display text-base font-semibold text-ink">
            Jelajahi
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {navigation.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-sm text-muted transition-colors hover:text-brand-600"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-2 lg:col-span-1">
          <h2 className="font-display text-base font-semibold text-ink">
            Lokasi
          </h2>
          <p className="mt-2 text-sm text-muted">
            {data?.university_name ?? site.universityName}
          </p>
          <div className="mt-4">
            <LocationMap embedUrl={data?.maps_embed_url || undefined} />
          </div>
        </div>
      </Container>

      <div className="border-t border-line py-6">
        <Container className="text-center text-xs text-muted">
          © {year} {data?.faculty_name ?? site.facultyName},{" "}
          {data?.university_name ?? site.universityName}.
        </Container>
      </div>
    </footer>
  );
}
