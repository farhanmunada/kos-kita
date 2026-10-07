import { BillingService } from "@/services/billing.service";
import { TenantService } from "@/services/tenant.service";
import { InvoicesClient } from "@/components/dashboard/InvoicesClient";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const [invoices, tenants] = await Promise.all([
    BillingService.getAllInvoices(),
    TenantService.getAllTenants(true),
  ]);

  return <InvoicesClient invoices={invoices} tenants={tenants} />;
}
