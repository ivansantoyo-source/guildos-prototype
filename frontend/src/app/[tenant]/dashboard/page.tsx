import { redirect } from "next/navigation";

// Next.js 16: params is a Promise
export default async function TenantDashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;

  // For now, subdomain-routed tenant views redirect to the main dashboard
  // In production, this would load tenant-specific public-facing storefront
  redirect(`/dashboard?tenant=${tenant}`);
}
