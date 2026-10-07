import { MeterService } from "@/services/meter.service";
import { RoomService } from "@/services/room.service";
import { MeterClient } from "@/components/dashboard/MeterClient";

export const dynamic = "force-dynamic";

export default async function MeterPage() {
  const [readings, rooms] = await Promise.all([
    MeterService.getAllMeterReadings(),
    RoomService.getAllRooms(),
  ]);

  return <MeterClient readings={readings} rooms={rooms} />;
}
