import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RunClient from "./RunClient";

export default async function RunPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const agent = await prisma.agent.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { slug: true, name: true, tagline: true },
  });

  if (!agent) notFound();

  return (
    <RunClient
      slug={agent.slug}
      agentName={agent.name}
      agentTagline={agent.tagline}
    />
  );
}
