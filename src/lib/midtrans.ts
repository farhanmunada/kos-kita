import crypto from "crypto";

// @ts-expect-error midtrans-client lacks complete TypeScript definitions
import midtransClient from "midtrans-client";

const serverKey = process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-test-key";
const clientKey = process.env.MIDTRANS_CLIENT_KEY || "SB-Mid-client-test-key";

// Inisialisasi Midtrans Snap client
export const snap = new midtransClient.Snap({
  isProduction: false, // Selalu sandbox untuk pengujian
  serverKey: serverKey,
  clientKey: clientKey,
});

export interface SnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
  itemDetails?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
}

export async function createSnapToken(params: SnapTransactionParams): Promise<string> {
  const transactionDetails = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: {
      first_name: params.customerDetails.name,
      email: params.customerDetails.email,
      phone: params.customerDetails.phone,
    },
    item_details: params.itemDetails,
  };

  const response = await snap.createTransaction(transactionDetails);
  return response.token;
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  receivedSignature: string
): boolean {
  const payload = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const computedHash = crypto.createHash("sha512").update(payload).digest("hex");
  return computedHash.toLowerCase() === receivedSignature.toLowerCase();
}
