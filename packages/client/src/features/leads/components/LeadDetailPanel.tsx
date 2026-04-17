import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Lead } from "@crm-ai/shared";
import { LEAD_STATUSES } from "@crm-ai/shared";

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Lead>) => void;
}

export function LeadDetailPanel({ lead, onClose, onUpdate }: LeadDetailPanelProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(lead.name);
  const [notes, setNotes] = useState(lead.notes || "");
  const [status, setStatus] = useState(lead.status);

  const handleSave = () => {
    onUpdate(lead.id, { name, notes, status });
  };

  return (
    <div className="fixed inset-y-0 end-0 w-96 bg-white shadow-2xl border-s border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-bold text-lg">{lead.name}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
          &times;
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">{t("leads.name")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">{t("leads.phone")}</label>
          <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm" dir="ltr">
            {lead.phone}
          </div>
        </div>

        {lead.email && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {t("leads.email")}
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm">{lead.email}</div>
          </div>
        )}

        {lead.company && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {t("leads.company")}
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm">{lead.company}</div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            {t("leads.status")}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Lead["status"])}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`leads.${s}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            {t("leads.source")}
          </label>
          <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm capitalize">{lead.source}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">{t("leads.notes")}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
          />
        </div>

        {lead.tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {t("leads.tags")}
            </label>
            <div className="flex flex-wrap gap-1">
              {lead.tags.map((tag) => (
                <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {t("common.save")}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
