import { useState } from "react";
import { useTranslation } from "react-i18next";
interface MockRule {
  id: string;
  trigger: string;
  triggerConfig: { status: string };
  action: string;
  actionConfig: { templateId?: string };
  isActive: boolean;
}

interface MockTemplate {
  id: string;
  name: string;
  content: string;
  category?: string;
  language: string;
}

const MOCK_TEMPLATES: MockTemplate[] = [
  {
    id: "t1",
    name: "Welcome Message",
    content: "Hi {{lead.name}}! Welcome to {{org.name}}. How can we help you?",
    category: "Onboarding",
    language: "en",
  },
  {
    id: "t2",
    name: "Follow Up",
    content: "Hi {{lead.name}}, just checking in. Do you have any questions about our offer?",
    category: "Sales",
    language: "en",
  },
  {
    id: "t3",
    name: "Thank You",
    content:
      "Thank you for choosing {{org.name}}, {{lead.name}}! We look forward to working with you.",
    category: "Post-Sale",
    language: "en",
  },
];

const MOCK_RULES: MockRule[] = [
  {
    id: "r1",
    trigger: "status_change",
    triggerConfig: { status: "new" },
    action: "send_template",
    actionConfig: { templateId: "t1" },
    isActive: true,
  },
  {
    id: "r2",
    trigger: "status_change",
    triggerConfig: { status: "won" },
    action: "send_template",
    actionConfig: { templateId: "t3" },
    isActive: true,
  },
];

export function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"automations" | "templates">("automations");
  const [rules] = useState<MockRule[]>(MOCK_RULES);
  const [templates] = useState<MockTemplate[]>(MOCK_TEMPLATES);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-white border-b">
        <h1 className="text-xl font-bold mb-4">{t("nav.settings")}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("automations")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "automations" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Automations
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "templates" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Templates
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === "automations" && (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${rule.isActive ? "bg-green-500" : "bg-gray-300"}`}
                    />
                    <span className="font-medium text-sm">
                      When status changes to:{" "}
                      <span className="text-blue-600">
                        {t(`leads.${rule.triggerConfig.status}`)}
                      </span>
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={rule.isActive} readOnly className="rounded" />
                    <span className="text-xs text-gray-500">Active</span>
                  </label>
                </div>
                <div className="text-sm text-gray-500">
                  Action: Send template{" "}
                  <span className="text-gray-700 font-medium">
                    {templates.find((t) => t.id === rule.actionConfig.templateId)?.name || "—"}
                  </span>
                </div>
              </div>
            ))}

            <button className="w-full p-3 border-2 border-dashed rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:border-gray-400">
              + Add Automation Rule
            </button>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-3">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{tmpl.name}</span>
                  {tmpl.category && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {tmpl.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded font-mono">
                  {tmpl.content}
                </p>
              </div>
            ))}

            <button className="w-full p-3 border-2 border-dashed rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:border-gray-400">
              + Add Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
