import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./lib/trpc";
import { useTranslation } from "react-i18next";
import "./lib/i18n";
import "./styles/globals.css";

function App() {
  const { t } = useTranslation();
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
        <div className="min-h-screen bg-background text-foreground">
          <h1 className="text-2xl font-bold p-8">{t("app.name")}</h1>
          <p className="px-8 text-muted-foreground">{t("common.loading")}</p>
        </div>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
