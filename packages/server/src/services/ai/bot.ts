import { prisma } from "../../db/client";
import { createLLMProvider, type LLMMessage } from "./index";
import { retrieveChunks } from "../knowledge-base/retriever";
import { createWhatsAppProvider } from "../whatsapp";
import { logger } from "../../lib/logger";

const llm = createLLMProvider();
const whatsapp = createWhatsAppProvider();

const DEFAULT_SYSTEM_PROMPT = `You are a helpful customer support assistant for a business.
Answer questions based on the knowledge base context provided.
Be friendly, concise, and professional.
If you don't know the answer, say so honestly and offer to connect the customer with a human agent.
Always respond in the same language the customer is using.`;

const CONFIDENCE_THRESHOLD = 0.4;
const MAX_HISTORY_MESSAGES = 10;
const RESPONSE_DELAY_MS = 3000; // 3 second delay to feel natural

interface BotContext {
  conversationId: string;
  organizationId: string;
  leadId: string;
  chatId: string;
  customerMessage: string;
}

/**
 * Process an incoming customer message through the AI bot pipeline:
 * 1. Check if bot is active for this conversation
 * 2. Retrieve relevant knowledge base chunks via RAG
 * 3. Build prompt with system prompt + KB context + conversation history
 * 4. Generate response via LLM
 * 5. Send response via WhatsApp
 * 6. Store bot message in DB
 */
export async function handleBotResponse(ctx: BotContext): Promise<void> {
  const start = performance.now();

  // 1. Check if bot is active
  const conversation = await prisma.conversation.findUnique({
    where: { id: ctx.conversationId },
  });

  if (!conversation?.isBot) {
    logger.info({ conversationId: ctx.conversationId }, "bot.skipped.disabled");
    return;
  }

  // 2. Retrieve relevant knowledge base chunks
  const ragResults = await retrieveChunks(
    ctx.organizationId,
    ctx.customerMessage,
    5,
    CONFIDENCE_THRESHOLD,
  );

  const kbContext =
    ragResults.length > 0
      ? ragResults.map((r) => `[${r.documentTitle}]: ${r.content}`).join("\n\n")
      : "No relevant knowledge base content found.";

  const topScore = ragResults[0]?.score || 0;

  // 3. Get conversation history
  const recentMessages = await prisma.message.findMany({
    where: { conversationId: ctx.conversationId },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY_MESSAGES,
  });

  const history: LLMMessage[] = recentMessages.reverse().map((m) => ({
    role: m.direction === "inbound" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));

  // 4. Get org system prompt (or use default)
  const org = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
  });

  const systemPrompt =
    ((org?.settings as Record<string, unknown>)?.systemPrompt as string) || DEFAULT_SYSTEM_PROMPT;

  // 5. Build messages for LLM
  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `${systemPrompt}\n\n--- Knowledge Base Context ---\n${kbContext}`,
    },
    ...history,
  ];

  // 6. Check confidence — if too low, escalate
  if (ragResults.length === 0 || topScore < CONFIDENCE_THRESHOLD) {
    logger.warn(
      { conversationId: ctx.conversationId, topScore, threshold: CONFIDENCE_THRESHOLD },
      "bot.confidence.low",
    );
  }

  // 7. Generate response
  const llmResponse = await llm.chat(messages);

  const duration = performance.now() - start;
  logger.info(
    {
      conversationId: ctx.conversationId,
      model: llmResponse.model,
      tokensUsed: llmResponse.tokensUsed,
      ragChunks: ragResults.length,
      topScore: topScore.toFixed(3),
      duration: `${duration.toFixed(0)}ms`,
    },
    "bot.response.generated",
  );

  // 8. Delay to feel natural
  await new Promise((resolve) => setTimeout(resolve, RESPONSE_DELAY_MS));

  // 9. Send via WhatsApp
  const sendResult = await whatsapp.sendMessage({
    chatId: ctx.chatId,
    message: llmResponse.content,
  });

  // 10. Store bot message in DB
  await prisma.message.create({
    data: {
      conversationId: ctx.conversationId,
      direction: "outbound",
      sender: "bot",
      type: "text",
      content: llmResponse.content,
      status: sendResult.success ? "sent" : "failed",
      metadata: {
        idMessage: sendResult.idMessage,
        model: llmResponse.model,
        tokensUsed: llmResponse.tokensUsed,
        ragChunks: ragResults.length,
        topScore,
      },
    },
  });

  // 11. Update conversation timestamp
  await prisma.conversation.update({
    where: { id: ctx.conversationId },
    data: { lastMessageAt: new Date() },
  });
}
