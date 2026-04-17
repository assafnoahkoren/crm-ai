import { useState } from "react";
import { useTranslation } from "react-i18next";

interface KBDocument {
  id: string;
  title: string;
  category?: string;
  tags: string[];
  status: "processing" | "ready" | "error";
  chunkCount: number;
  createdAt: Date;
}

// Mock data for development
const MOCK_DOCS: KBDocument[] = [
  {
    id: "1",
    title: "Product Catalog 2024",
    category: "Products",
    tags: ["pricing", "features"],
    status: "ready",
    chunkCount: 12,
    createdAt: new Date(),
  },
  {
    id: "2",
    title: "FAQ - Common Questions",
    category: "Support",
    tags: ["faq"],
    status: "ready",
    chunkCount: 8,
    createdAt: new Date(),
  },
  {
    id: "3",
    title: "Return Policy",
    category: "Legal",
    tags: ["policy"],
    status: "processing",
    chunkCount: 0,
    createdAt: new Date(),
  },
];

const STATUS_BADGE: Record<string, string> = {
  ready: "bg-green-100 text-green-700",
  processing: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
};

export function KnowledgeBasePage() {
  const { t } = useTranslation();
  const [docs] = useState<KBDocument[]>(MOCK_DOCS);
  const [showUpload, setShowUpload] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const handleUpload = () => {
    // Would call tRPC knowledgeBase.create
    console.log("Upload:", { title: newTitle, content: newContent, category: newCategory });
    setShowUpload(false);
    setNewTitle("");
    setNewContent("");
    setNewCategory("");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <h1 className="text-xl font-bold">{t("knowledgeBase.title")}</h1>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + {t("knowledgeBase.upload")}
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {/* Document List */}
        <div className="bg-white rounded-xl border">
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="text-start p-3 font-medium">{t("leads.name")}</th>
                <th className="text-start p-3 font-medium">Category</th>
                <th className="text-start p-3 font-medium">{t("leads.status")}</th>
                <th className="text-start p-3 font-medium">Chunks</th>
                <th className="text-start p-3 font-medium">{t("leads.tags")}</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">{doc.title}</td>
                  <td className="p-3 text-sm text-gray-500">{doc.category || "—"}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_BADGE[doc.status]}`}>
                      {t(`knowledgeBase.${doc.status}`)}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-500">{doc.chunkCount}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowUpload(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold mb-4">{t("knowledgeBase.upload")}</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("leads.name")}</label>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Document title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="e.g., Products, Support, Legal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                    placeholder="Paste or type the document content..."
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpload}
                  disabled={!newTitle || !newContent}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {t("knowledgeBase.upload")}
                </button>
                <button
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
