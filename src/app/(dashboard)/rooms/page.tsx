import { RoomService } from "@/services/room.service";
import { getSession } from "@/lib/auth";
import { RoomsClient } from "@/components/dashboard/RoomsClient";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const session = await getSession();
  const rooms = await RoomService.getAllRooms();

  return <RoomsClient initialRooms={rooms} role={session?.role || "STAFF"} />;
}
