import { Link } from "react-router-dom";
import type { ProgramCard } from "@/lib/content";
import { routes } from "@/app/routes";

export function ProgramList({ items }: { items: ProgramCard[] }) {
  return (
    <ol className="divide-y divide-line border-y border-line">
      {items.map((program, index) => (
        <li
          key={program.slug}
          className="grid gap-4 py-8 sm:grid-cols-[4rem_1fr_auto] sm:items-start sm:gap-8"
        >
          <span className="font-display text-2xl font-bold text-brand-600">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="font-display text-2xl font-bold text-ink">
              {program.name}
            </h3>
            <p className="mt-1 text-sm font-medium text-muted">
              {program.degree}
            </p>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
              {program.summary}
            </p>
          </div>
          <Link
            to={routes.contact}
            className="self-start text-sm font-semibold text-brand-600 hover:text-brand-700 sm:pt-1"
          >
            Informasi pendaftaran
          </Link>
        </li>
      ))}
    </ol>
  );
}
