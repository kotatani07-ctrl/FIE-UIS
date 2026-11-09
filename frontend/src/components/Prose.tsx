import type { ReactNode } from "react";

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="prose mx-auto w-full max-w-[68ch] text-base leading-7 text-ink">
      {children}
    </div>
  );
}
