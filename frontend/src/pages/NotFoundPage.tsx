import { Link } from "react-router-dom";
import { routes } from "@/app/routes";
import { Seo } from "@/components/Seo";

export function NotFoundPage() {
  return (
    <>
      <Seo
        title="Halaman tidak ditemukan | Fakultas Ilmu Ekonomi"
        description="Halaman yang Anda cari tidak tersedia."
        noindex
      />
      <main
        id="konten-utama"
        className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center"
      >
        <p className="text-sm font-semibold text-brand-600">404</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-ink">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          Tautan mungkin sudah berubah atau halaman tidak tersedia.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            to={routes.home}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Kembali ke beranda
          </Link>
          <Link
            to={routes.programs}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-5 text-sm font-semibold text-ink hover:border-brand-500 hover:text-brand-600"
          >
            Lihat program studi
          </Link>
        </div>
      </main>
    </>
  );
}
