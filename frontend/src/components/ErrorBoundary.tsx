import { Component, type ReactNode } from "react";

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          id="konten-utama"
          className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center"
          role="alert"
        >
          <h1 className="font-display text-3xl font-bold text-ink">
            Halaman tidak dapat ditampilkan
          </h1>
          <p className="mt-4 text-muted">
            Terjadi kendala saat memuat halaman. Silakan coba muat ulang.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Muat ulang halaman
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
