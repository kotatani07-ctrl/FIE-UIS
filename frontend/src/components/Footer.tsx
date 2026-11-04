import { navigation, site } from "@/lib/site";
import { Container } from "./ui";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface-2">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-display text-sm font-bold text-white">
              FIE
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-display text-base font-bold text-ink">
                {site.facultyName}
              </span>
              <span className="text-xs text-muted">{site.universityName}</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            {site.description}
          </p>
        </div>

        <nav aria-label="Tautan footer">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink">
            Jelajahi
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {navigation.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm text-muted transition-colors hover:text-brand-600"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink">
            Informasi
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Alamat, telepon, dan email resmi fakultas akan tampil di sini
            setelah tersedia dari pengaturan situs (Django Admin).
          </p>
        </div>
      </Container>

      <div className="border-t border-line py-6">
        <Container className="text-center text-xs text-muted">
          © {year} {site.facultyName} — {site.universityName}. Seluruh hak cipta
          dilindungi.
        </Container>
      </div>
    </footer>
  );
}
