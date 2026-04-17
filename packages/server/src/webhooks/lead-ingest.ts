import type { IncomingMessage, ServerResponse } from "http";
import { prisma } from "../db/client";
import { ingestLeadInput } from "@crm-ai/shared";
import { logger } from "../lib/logger";

// Simple API key validation
function validateApiKey(req: IncomingMessage): string | null {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export async function handleLeadIngest(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const apiKey = validateApiKey(req);
  if (!apiKey) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing or invalid API key" }));
    return;
  }

  // Find org by API key (stored in org settings)
  const org = await prisma.organization.findFirst({
    where: {
      settings: {
        path: ["apiKey"],
        equals: apiKey,
      },
    },
  });

  if (!org) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid API key" }));
    return;
  }

  // Parse body
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  let parsed;
  try {
    parsed = ingestLeadInput.parse(JSON.parse(body));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid payload", details: String(err) }));
    return;
  }

  const lead = await prisma.lead.create({
    data: {
      organizationId: org.id,
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email,
      company: parsed.company,
      source: parsed.source as string,
      sourceMetadata: parsed.metadata || {},
      status: "new",
      tags: [],
    },
  });

  logger.info({ leadId: lead.id, orgId: org.id, source: parsed.source }, "lead.ingested.webhook");

  res.writeHead(201, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ id: lead.id, status: "created" }));
}
