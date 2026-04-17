import { useState } from "react";
import { useTranslation } from "react-i18next";

interface MockConversation {
  id: string;
  leadName: string;
  phone: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  isBot: boolean;
}

interface MockMessage {
  id: string;
  direction: "inbound" | "outbound";
  sender: "customer" | "agent" | "bot";
  content: string;
  createdAt: Date;
}

const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: "c1",
    leadName: "David Cohen",
    phone: "+972521234567",
    lastMessage: "Hi, I'm interested in your product",
    lastMessageAt: new Date(Date.now() - 300000),
    unreadCount: 2,
    isBot: true,
  },
  {
    id: "c2",
    leadName: "Sarah Levy",
    phone: "+972529876543",
    lastMessage: "Thank you for the information",
    lastMessageAt: new Date(Date.now() - 3600000),
    unreadCount: 0,
    isBot: false,
  },
  {
    id: "c3",
    leadName: "Michael Ben-Ari",
    phone: "+972535555555",
    lastMessage: "Can you send me the pricing?",
    lastMessageAt: new Date(Date.now() - 7200000),
    unreadCount: 1,
    isBot: true,
  },
];

const MOCK_MESSAGES: Record<string, MockMessage[]> = {
  c1: [
    {
      id: "m1",
      direction: "inbound",
      sender: "customer",
      content: "Hi, I saw your ad on Facebook",
      createdAt: new Date(Date.now() - 600000),
    },
    {
      id: "m2",
      direction: "outbound",
      sender: "bot",
      content: "Welcome! Thanks for reaching out. How can I help you today?",
      createdAt: new Date(Date.now() - 590000),
    },
    {
      id: "m3",
      direction: "inbound",
      sender: "customer",
      content: "I'm interested in your product",
      createdAt: new Date(Date.now() - 300000),
    },
    {
      id: "m4",
      direction: "outbound",
      sender: "bot",
      content:
        "Great! Our product offers several features that might interest you. Would you like me to send you more details?",
      createdAt: new Date(Date.now() - 290000),
    },
  ],
  c2: [
    {
      id: "m5",
      direction: "inbound",
      sender: "customer",
      content: "Hello",
      createdAt: new Date(Date.now() - 7200000),
    },
    {
      id: "m6",
      direction: "outbound",
      sender: "agent",
      content: "Hi Sarah! How can I help?",
      createdAt: new Date(Date.now() - 7100000),
    },
    {
      id: "m7",
      direction: "inbound",
      sender: "customer",
      content: "Thank you for the information",
      createdAt: new Date(Date.now() - 3600000),
    },
  ],
  c3: [
    {
      id: "m8",
      direction: "inbound",
      sender: "customer",
      content: "Can you send me the pricing?",
      createdAt: new Date(Date.now() - 7200000),
    },
  ],
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export function ConversationsPage() {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = searchQuery
    ? MOCK_CONVERSATIONS.filter(
        (c) =>
          c.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery),
      )
    : MOCK_CONVERSATIONS;
  const selected = MOCK_CONVERSATIONS.find((c) => c.id === selectedId);
  const messages = selectedId ? MOCK_MESSAGES[selectedId] || [] : [];

  const handleSend = () => {
    if (!newMessage.trim()) return;
    console.log("Send:", { conversationId: selectedId, content: newMessage });
    setNewMessage("");
  };

  return (
    <div className="h-full flex">
      {/* Conversation List */}
      <div className="w-80 bg-white border-e border-gray-200 flex flex-col">
        <div className="p-3 border-b">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("common.search")}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                selectedId === conv.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{conv.leadName}</span>
                <span className="text-xs text-gray-400">{formatTime(conv.lastMessageAt)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500 truncate flex-1">{conv.lastMessage}</p>
                {conv.unreadCount > 0 && (
                  <span className="ms-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="mt-1">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    conv.isBot ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {conv.isBot ? t("conversations.botActive") : t("conversations.botInactive")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b flex items-center justify-between">
              <div>
                <h2 className="font-medium">{selected.leadName}</h2>
                <p className="text-xs text-gray-500" dir="ltr">
                  {selected.phone}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  selected.isBot ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}
              >
                {selected.isBot ? t("conversations.botActive") : t("conversations.botInactive")}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "outbound" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                      msg.direction === "outbound"
                        ? msg.sender === "bot"
                          ? "bg-purple-100 text-purple-900"
                          : "bg-blue-100 text-blue-900"
                        : "bg-white text-gray-800 border"
                    }`}
                  >
                    {msg.sender === "bot" && (
                      <div className="text-xs font-medium text-purple-600 mb-1">Bot</div>
                    )}
                    <p>{msg.content}</p>
                    <div className="text-xs text-gray-400 mt-1 text-end">
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-3 bg-white border-t flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={t("conversations.typeMessage")}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {t("conversations.sendMessage")}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>{t("conversations.title")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
