import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { trpc } from "./lib/trpc";
import { useSession, signOut } from "./lib/auth";
import { AuthFlow } from "./features/auth/AuthFlow";
import { LeadsPage } from "./features/leads/LeadsPage";
import { KnowledgeBasePage } from "./features/knowledge-base/KnowledgeBasePage";
import { useTranslation } from "react-i18next";
import "./lib/i18n";
import "./styles/globals.css";

function Sidebar() {
  const { t } = useTranslation();

  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: "📊" },
    { to: "/leads", label: t("nav.leads"), icon: "👤" },
    { to: "/conversations", label: t("nav.conversations"), icon: "💬" },
    { to: "/knowledge-base", label: t("nav.knowledgeBase"), icon: "📚" },
    { to: "/settings", label: t("nav.settings"), icon: "⚙️" },
  ];

  return (
    <aside className="w-60 bg-white border-e border-gray-200 flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold">{t("app.name")}</h1>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors ${
                isActive ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t">
        <button
          onClick={() => signOut()}
          className="w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg text-start"
        >
          {t("auth.logout")}
        </button>
      </div>
    </aside>
  );
}

function DashboardPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">{t("dashboard.title")}</h2>
      <p className="text-gray-500">Dashboard coming in Phase 8</p>
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <p className="text-gray-500">Coming soon</p>
    </div>
  );
}

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
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/dashboard" element={<DashboardPlaceholder />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route
              path="/conversations"
              element={<PlaceholderPage title={t("nav.conversations")} />}
            />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="/settings" element={<PlaceholderPage title={t("nav.settings")} />} />
            <Route path="*" element={<Navigate to="/leads" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
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
