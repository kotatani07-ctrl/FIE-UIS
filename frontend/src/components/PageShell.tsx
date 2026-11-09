import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Seo } from "./Seo";
import { SkipLink } from "./SkipLink";

type PageShellProps = {
  title: string;
  description: string;
  path: string;
  children: ReactNode;
};

export function PageShell({
  title,
  description,
  path,
  children,
}: PageShellProps) {
  return (
    <>
      <Seo title={title} description={description} path={path} />
      <SkipLink />
      <Header />
      <main id="konten-utama" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
