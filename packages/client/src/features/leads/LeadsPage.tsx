import { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  pointerWithin,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import { LEAD_STATUSES } from "@crm-ai/shared";
import type { Lead, LeadStatus } from "@crm-ai/shared";
import { KanbanColumn } from "./components/KanbanColumn";
import { LeadDetailPanel } from "./components/LeadDetailPanel";

// Mock data for development until DB is connected
const MOCK_LEADS: Lead[] = [
  {
    id: "1",
    organizationId: "org1",
    name: "David Cohen",
    phone: "+972521234567",
    email: "david@example.com",
    company: "Tech Solutions",
    status: "new",
    source: "facebook",
    tags: ["hot", "enterprise"],
    notes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    organizationId: "org1",
    name: "Sarah Levy",
    phone: "+972529876543",
    email: "sarah@example.com",
    status: "contacted",
    source: "manual",
    tags: ["follow-up"],
    notes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    organizationId: "org1",
    name: "Michael Ben-Ari",
    phone: "+972535555555",
    company: "StartupXYZ",
    status: "qualified",
    source: "website",
    tags: ["startup"],
    notes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    organizationId: "org1",
    name: "Rachel Green",
    phone: "+972541112222",
    status: "proposal",
    source: "api",
    tags: [],
    notes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    organizationId: "org1",
    name: "Yossi Amar",
    phone: "+972553334444",
    company: "BigCorp",
    status: "new",
    source: "facebook",
    tags: ["enterprise", "high-value"],
    notes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "6",
    organizationId: "org1",
    name: "Noa Shapira",
    phone: "+972567778888",
    status: "won",
    source: "manual",
    tags: [],
    notes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function LeadsPage() {
  const { t } = useTranslation();
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.company?.toLowerCase().includes(q),
    );
  }, [leads, searchQuery]);

  const leadsByStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const status of LEAD_STATUSES) {
      map[status] = filteredLeads.filter((l) => l.status === status);
    }
    return map;
  }, [filteredLeads]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    // Only update if dropped on a column (status)
    if (LEAD_STATUSES.includes(newStatus as LeadStatus)) {
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragOver = (_event: DragOverEvent) => {
    // Could add visual feedback here
  };

  const handleLeadUpdate = (id: string, data: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
    setSelectedLead(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <h1 className="text-xl font-bold">{t("leads.title")}</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("common.search")}
            className="px-3 py-2 border rounded-lg text-sm w-64"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + {t("leads.addLead")}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="flex gap-4 h-full">
            {LEAD_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                leads={leadsByStatus[status] || []}
                onLeadClick={setSelectedLead}
              />
            ))}
          </div>
        </DndContext>
      </div>

      {/* Lead Detail Panel */}
      {selectedLead && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedLead(null)} />
          <LeadDetailPanel
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdate={handleLeadUpdate}
          />
        </>
      )}
    </div>
  );
}
