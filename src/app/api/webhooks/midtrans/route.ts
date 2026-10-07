import { NextResponse } from "next/server";
import { PaymentService } from "@/services/payment.service";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await PaymentService.handleWebhook(payload);
    return NextResponse.json({ status: "ok", result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook processing error";
    console.error("Midtrans webhook error:", message);
    return NextResponse.json({ status: "error", message }, { status: 400 });
  }
}
