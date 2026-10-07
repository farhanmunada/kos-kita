import { MeterService } from "@/services/meter.service";
import { MeterClient } from "@/components/dashboard/MeterClient";

export const dynamic = "force-dynamic";

export default async function MeterPage() {
  const [readings, meterContexts] = await Promise.all([
    MeterService.getAllMeterReadings(),
    MeterService.getMeterContexts(),
  ]);

  return <MeterClient readings={readings} meterContexts={meterContexts} />;
}
