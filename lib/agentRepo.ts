import type { Agent, AgentCategory } from "./types";
import { prisma } from "./prisma";
import type { Agent as DbAgent } from "@prisma/client";

function mapPricing(row: DbAgent): Agent["pricing"] {
  if (row.pricingType === "FREE") return { type: "free", label: "Darmowy" };
  if (row.pricingType === "ONE_TIME") {
    return { type: "one_time", label: row.pricingLabel, amountPln: row.pricingAmountPln ?? 0 };
  }
  return { type: "subscription", label: row.pricingLabel, amountPlnPerMonth: row.pricingAmountPlnPerMonth ?? 0 };
}

function mapAgent(row: DbAgent): Agent {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    category: row.category as unknown as AgentCategory,
    pricing: mapPricing(row),
    description: row.description,
    limitations: JSON.parse(row.limitationsJson ?? "[]"),
    examples: JSON.parse(row.examplesJson ?? "[]"),
    lastUpdated: row.lastUpdated
  };
}

export async function getPublishedAgents(): Promise<Agent[]> {
  const rows = await prisma.agent.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" } });
  return rows.map(mapAgent);
}

export async function getPublishedAgentBySlug(slug: string): Promise<Agent | null> {
  const row = await prisma.agent.findFirst({ where: { slug, status: "PUBLISHED" } });
  return row ? mapAgent(row) : null;
}