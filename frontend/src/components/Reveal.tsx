import { useEffect, useRef, useState, type ReactNode } from "react";

function initiallyVisible(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  const reducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  return reducedMotion || typeof IntersectionObserver === "undefined";
}

/**
 * Mengangkat konten sedikit saat masuk viewport. Dipakai satu kali per section,
 * bukan per elemen, dan langsung terlihat saat reduced-motion aktif.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(initiallyVisible);

  useEffect(() => {
    if (visible) {
      return;
    }
    const node = ref.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    const fallback = window.setTimeout(() => setVisible(true), 3000);
    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, [visible]);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      data-reveal={visible ? "in" : "out"}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
