import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Link } from "react-router-dom";
import { isSafeInternalHref } from "@/app/routes";

type ButtonVariant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 py-2 text-sm font-semibold transition-[background-color,color,border-color,transform] duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary:
    "border border-line bg-surface text-ink hover:border-brand-500 hover:text-brand-600",
  ghost: "text-brand-600 hover:bg-brand-50",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  to,
  variant = "primary",
  className = "",
  children,
}: {
  to: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  if (!isSafeInternalHref(to)) {
    throw new Error("LinkButton hanya menerima path internal.");
  }
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-card border border-line bg-surface p-6 ${className}`}
    >
      {children}
    </article>
  );
}

export function SectionHeading({
  title,
  description,
  id,
}: {
  title: string;
  description?: string;
  id?: string;
}) {
  return (
    <div className="max-w-2xl">
      <span
        aria-hidden="true"
        className="mb-4 block h-1 w-10 rounded-full bg-accent-400"
      />
      <h2
        id={id}
        className="font-display text-3xl font-bold leading-tight tracking-[-0.01em] text-ink sm:text-4xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-prose text-base leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

const fieldClassName =
  "block min-h-11 w-full rounded-xl border border-line bg-surface px-4 py-2 text-ink outline-none transition focus:border-brand-500";

function FieldMessages({ id, hint, error }: Omit<FieldProps, "label">) {
  return (
    <>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1 text-sm font-medium text-danger-600"
        >
          {error}
        </p>
      ) : null}
    </>
  );
}

function fieldDescriptionIds(id: string, hint?: string, error?: string) {
  return (
    [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
      .filter(Boolean)
      .join(" ") || undefined
  );
}

export function Input({
  id,
  label,
  hint,
  error,
  className = "",
  ...rest
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescriptionIds(id, hint, error)}
        className={`${fieldClassName} ${className}`}
      />
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

export function Textarea({
  id,
  label,
  hint,
  error,
  className = "",
  ...rest
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-ink">
        {label}
      </label>
      <textarea
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescriptionIds(id, hint, error)}
        className={`${fieldClassName} min-h-32 resize-y ${className}`}
      />
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

export function Select({
  id,
  label,
  hint,
  error,
  className = "",
  children,
  ...rest
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-ink">
        {label}
      </label>
      <select
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescriptionIds(id, hint, error)}
        className={`${fieldClassName} ${className}`}
      >
        {children}
      </select>
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

export function SearchBox({
  label = "Cari informasi",
  initialValue = "",
  onSearch,
}: {
  label?: string;
  initialValue?: string;
  onSearch: (query: string) => void;
}) {
  const id = useId();
  const [query, setQuery] = useState(initialValue);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(query.trim());
      }}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <Input
        id={id}
        label={label}
        type="search"
        minLength={2}
        maxLength={80}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="sm:flex-1"
      />
      <Button type="submit" className="sm:self-end">
        Cari
      </Button>
    </form>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-surface-2 ${className}`}
    />
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-card border border-dashed border-line bg-surface-2 p-8 text-center">
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}

export function ErrorState({
  title = "Informasi belum dapat dimuat",
  description = "Periksa koneksi Anda, lalu coba lagi.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-card border border-line bg-surface p-6"
    >
      <h3 className="font-display font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <Button
        type="button"
        variant="secondary"
        className="mt-4"
        onClick={onRetry}
      >
        Coba lagi
      </Button>
    </div>
  );
}

export function Toast({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: "info" | "success" | "error";
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={`rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-lg ${
        variant === "error" ? "border-danger-600" : ""
      }`}
    >
      {children}
    </div>
  );
}

export function Breadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Jejak navigasi">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          if (item.href && !isSafeInternalHref(item.href)) {
            throw new Error("Tautan breadcrumb harus berupa path internal.");
          }
          return (
            <li
              key={`${item.label}-${index}`}
              className="inline-flex items-center gap-2"
            >
              {current || !item.href ? (
                <span aria-current={current ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="underline underline-offset-2 hover:text-brand-600"
                >
                  {item.label}
                </a>
              )}
              {!current ? <span aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages < 2) {
    return null;
  }
  const page = Math.min(Math.max(currentPage, 1), totalPages);

  return (
    <nav aria-label="Paginasi">
      <ul className="flex items-center justify-center gap-2">
        <li>
          <Button
            type="button"
            variant="secondary"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Halaman sebelumnya"
          >
            Sebelumnya
          </Button>
        </li>
        <li aria-live="polite" className="px-2 text-sm text-muted">
          Halaman {page} dari {totalPages}
        </li>
        <li>
          <Button
            type="button"
            variant="secondary"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Halaman berikutnya"
          >
            Berikutnya
          </Button>
        </li>
      </ul>
    </nav>
  );
}

export function Accordion({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="rounded-xl border border-line bg-surface px-5 py-4">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">
        {title}
      </summary>
      <div className="pb-2 pt-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </details>
  );
}

type TabItem = {
  label: string;
  content: ReactNode;
};

export function Tabs({ items }: { items: TabItem[] }) {
  const id = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const direction =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!direction || items.length === 0) {
      return;
    }
    event.preventDefault();
    const nextIndex = (activeIndex + direction + items.length) % items.length;
    setActiveIndex(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <div role="tablist" aria-label="Pilihan informasi" className="flex gap-2">
        {items.map((item, index) => (
          <button
            key={item.label}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            id={`${id}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={activeIndex === index}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={activeIndex === index ? 0 : -1}
            onClick={() => setActiveIndex(index)}
            onKeyDown={onKeyDown}
            className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${
              activeIndex === index
                ? "bg-brand-600 text-white"
                : "bg-surface-2 text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, index) => (
        <div
          key={item.label}
          id={`${id}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${index}`}
          tabIndex={0}
          hidden={activeIndex !== index}
          className="pt-4"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}

export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const id = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current
      ?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      ?.focus();

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first && last) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last && first) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-brand-900/60"
        aria-label={`Tutup ${title}`}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-card border border-line bg-surface p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id={`${id}-title`}
            className="font-display text-xl font-bold text-ink"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label={`Tutup ${title}`}
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line text-ink"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
