import { NextResponse } from "next/server";
import { BillingService } from "@/services/billing.service";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
  }

  try {
    const result = await BillingService.processDailyBillingCron(new Date());
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error executing billing cron";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
