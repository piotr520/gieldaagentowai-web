import { BecomeCreatorClient } from "@/components/BecomeCreatorClient";

export default async function BecomeCreatorPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectParam = params.redirect ?? "";
  return <BecomeCreatorClient redirectParam={redirectParam} />;
}
