import { useTheme, type ThemePref } from "@/hooks/useTheme";

const order: ThemePref[] = ["system", "light", "dark"];

const labels: Record<ThemePref, string> = {
  system: "Sistem",
  light: "Terang",
  dark: "Gelap",
};

export function ThemeToggle() {
  const { pref, setThemePref } = useTheme();
  const next = order[(order.indexOf(pref) + 1) % order.length] ?? "system";

  return (
    <button
      type="button"
      onClick={() => setThemePref(next)}
      aria-label={`Tema saat ini: ${labels[pref]}. Ganti ke tema ${labels[next]}.`}
      title={`Tema: ${labels[pref]}`}
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-line bg-surface px-3 text-sm font-semibold text-muted transition-colors hover:border-brand-500 hover:text-brand-600"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
      </svg>
      <span className="hidden xl:inline">{labels[pref]}</span>
    </button>
  );
}
