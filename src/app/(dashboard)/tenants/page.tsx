import { TenantService } from "@/services/tenant.service";
import { RoomService } from "@/services/room.service";
import { TenantsClient } from "@/components/dashboard/TenantsClient";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const [allTenants, allRooms] = await Promise.all([
    TenantService.getAllTenants(true),
    RoomService.getAllRooms(),
  ]);

  const availableRooms = allRooms.filter((r) => r.status === "AVAILABLE");

  return <TenantsClient tenants={allTenants} availableRooms={availableRooms} />;
}
