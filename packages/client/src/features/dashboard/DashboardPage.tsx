import { useTranslation } from "react-i18next";
import { LEAD_STATUSES } from "@crm-ai/shared";

// Mock dashboard data for development
const MOCK_SUMMARY = {
  leads: {
    total: 156,
    byStatus: {
      new: 42,
      contacted: 35,
      qualified: 28,
      proposal: 18,
      negotiation: 12,
      won: 15,
      lost: 6,
    },
  },
  conversations: { total: 48, unread: 7 },
  messages: { today: 124, botToday: 89, agentToday: 35 },
  knowledgeBase: { documents: 12, chunks: 247 },
};

const MOCK_ACTIVITY = {
  leads: [
    {
      id: "1",
      name: "David Cohen",
      status: "new",
      source: "facebook",
      createdAt: new Date(Date.now() - 1800000),
    },
    {
      id: "2",
      name: "Sarah Levy",
      status: "qualified",
      source: "manual",
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: "3",
      name: "Yossi Amar",
      status: "proposal",
      source: "website",
      createdAt: new Date(Date.now() - 7200000),
    },
  ],
  messages: [
    {
      id: "m1",
      sender: "customer",
      direction: "inbound",
      preview: "Hi, I'm interested in your product",
      leadName: "David Cohen",
      createdAt: new Date(Date.now() - 600000),
    },
    {
      id: "m2",
      sender: "bot",
      direction: "outbound",
      preview: "Welcome! How can I help you?",
      leadName: "David Cohen",
      createdAt: new Date(Date.now() - 590000),
    },
    {
      id: "m3",
      sender: "agent",
      direction: "outbound",
      preview: "I'll send you the pricing details",
      leadName: "Sarah Levy",
      createdAt: new Date(Date.now() - 1200000),
    },
  ],
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  qualified: "bg-purple-500",
  proposal: "bg-indigo-500",
  negotiation: "bg-orange-500",
  won: "bg-green-500",
  lost: "bg-red-500",
};

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function DashboardPage() {
  const { t } = useTranslation();
  const summary = MOCK_SUMMARY;
  const activity = MOCK_ACTIVITY;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">{t("dashboard.title")}</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t("leads.title")} value={summary.leads.total} />
        <StatCard
          label={t("dashboard.conversations")}
          value={summary.conversations.total}
          sub={`${summary.conversations.unread} unread`}
        />
        <StatCard
          label="Messages Today"
          value={summary.messages.today}
          sub={`Bot: ${summary.messages.botToday} | Agent: ${summary.messages.agentToday}`}
        />
        <StatCard
          label={t("knowledgeBase.title")}
          value={summary.knowledgeBase.documents}
          sub={`${summary.knowledgeBase.chunks} chunks`}
        />
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-medium mb-4">{t("dashboard.pipeline")}</h2>
        <div className="flex gap-2">
          {LEAD_STATUSES.map((status) => {
            const count =
              summary.leads.byStatus[status as keyof typeof summary.leads.byStatus] || 0;
            const pct = summary.leads.total > 0 ? (count / summary.leads.total) * 100 : 0;
            return (
              <div key={status} className="flex-1 text-center">
                <div className="text-xs text-gray-500 mb-1">{t(`leads.${status}`)}</div>
                <div className="text-lg font-bold">{count}</div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${STATUS_COLORS[status]}`}
                    style={{ width: `${Math.max(pct, 5)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-medium mb-3">{t("leads.title")}</h2>
          <div className="space-y-2">
            {activity.leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <div className="text-sm font-medium">{lead.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{lead.source}</div>
                </div>
                <div className="text-end">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[lead.status]}`}
                  >
                    {t(`leads.${lead.status}`)}
                  </span>
                  <div className="text-xs text-gray-400 mt-1">{formatTimeAgo(lead.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-medium mb-3">{t("dashboard.recentActivity")}</h2>
          <div className="space-y-2">
            {activity.messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    msg.sender === "bot"
                      ? "bg-purple-500"
                      : msg.sender === "agent"
                        ? "bg-blue-500"
                        : "bg-gray-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-medium">{msg.leadName}</span>
                    <span className="text-gray-400 mx-1">·</span>
                    <span className="text-gray-500 capitalize">{msg.sender}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{msg.preview}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatTimeAgo(msg.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
