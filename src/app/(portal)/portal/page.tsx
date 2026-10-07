import { getSession } from "@/lib/auth";
import { TenantService } from "@/services/tenant.service";
import { BillingService } from "@/services/billing.service";
import { PortalClient } from "@/components/portal/PortalClient";

export const dynamic = "force-dynamic";

export default async function TenantPortalPage() {
  const session = await getSession();
  if (!session) return null;

  const tenant = await TenantService.getTenantByUserId(session.id);
  const invoices = await BillingService.getInvoicesByTenantUserId(session.id);

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || process.env.MIDTRANS_CLIENT_KEY || "";

  return (
    <PortalClient
      tenant={tenant}
      invoices={invoices}
      clientKey={clientKey}
    />
  );
}
