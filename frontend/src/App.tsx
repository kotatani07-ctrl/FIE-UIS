import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AgendaPage } from "@/pages/AgendaPage";
import { AnnouncementsPage } from "@/pages/AnnouncementsPage";
import { ContactPage } from "@/pages/ContactPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { NewsPage } from "@/pages/NewsPage";
import { ProgramsPage } from "@/pages/ProgramsPage";
import { HomePage } from "@/pages/HomePage";
import { routes } from "@/app/routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path={routes.home} element={<HomePage />} />
            <Route path={routes.programs} element={<ProgramsPage />} />
            <Route path={routes.news} element={<NewsPage />} />
            <Route path={routes.agenda} element={<AgendaPage />} />
            <Route
              path={routes.announcements}
              element={<AnnouncementsPage />}
            />
            <Route path={routes.contact} element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
