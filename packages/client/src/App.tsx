import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./lib/trpc";
import { useSession } from "./lib/auth";
import { AuthFlow } from "./features/auth/AuthFlow";
import { useTranslation } from "react-i18next";
import "./lib/i18n";
import "./styles/globals.css";

function AppContent() {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t("common.loading")}</p>
      </div>
    );
  }

  if (!session?.user) {
    return <AuthFlow onAuthenticated={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("app.name")}</h1>
        <span className="text-sm text-gray-500">{session.user.name || session.user.email}</span>
      </header>
      <main className="p-6">
        <p className="text-gray-600">{t("dashboard.title")}</p>
      </main>
    </div>
  );
}

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: import.meta.env.VITE_API_URL || "/api/trpc",
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
