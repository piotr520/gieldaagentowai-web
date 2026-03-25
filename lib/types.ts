export type AgentCategory =
  | "Biznes"
  | "Marketing"
  | "HR"
  | "E-commerce"
  | "Budownictwo"
  | "Prawo"
  | "IT"
  | "Edukacja";

export type AgentPricing =
  | { type: "free"; label: "Darmowy" }
  | { type: "one_time"; label: string; amountPln: number }
  | { type: "subscription"; label: string; amountPlnPerMonth: number };

export type AgentExample = {
  input: string;
  output: string;
};

export type Agent = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: AgentCategory;
  pricing: AgentPricing;
  description: string;
  limitations: string[];
  examples: AgentExample[];
  lastUpdated: string; // YYYY-MM-DD
};
