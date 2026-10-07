import assert from "assert";
import { MeterService } from "../src/services/meter.service";
import { BillingService } from "../src/services/billing.service";
import { formatPhoneNumber, generateWhatsAppReminderUrl } from "../src/lib/whatsapp";
import { signSession, verifySession } from "../src/lib/auth";
import { verifyMidtransSignature } from "../src/lib/midtrans";
import crypto from "crypto";

async function runSelfChecks() {
  console.log("Running self-check tests...");

  // 1. Meter Usage & Calculation
  {
    const usage = MeterService.calculateUsage(100, 150, 2000);
    assert.strictEqual(usage.usageKwh, 50);
    assert.strictEqual(usage.totalCost, 100000);

    const zeroUsage = MeterService.calculateUsage(100, 100, 2000);
    assert.strictEqual(zeroUsage.usageKwh, 0);
    assert.strictEqual(zeroUsage.totalCost, 0);

    assert.throws(
      () => MeterService.calculateUsage(150, 100, 2000),
      /kWh akhir tidak boleh lebih kecil/
    );
    console.log("✓ Meter usage calculation logic passed");
  }

  // 2. Invoice Number Formatting
  {
    const date = new Date(2026, 9, 7); // Oct 7, 2026
    const invNum = BillingService.generateInvoiceNumber("101", date);
    assert(invNum.startsWith("INV-20261007-101-"));
    console.log("✓ Invoice number generation logic passed");
  }

  // 3. WhatsApp Formatter & Link Generator
  {
    assert.strictEqual(formatPhoneNumber("081234567890"), "6281234567890");
    assert.strictEqual(formatPhoneNumber("81234567890"), "6281234567890");
    assert.strictEqual(formatPhoneNumber("+62 812-3456-7890"), "6281234567890");

    const link = generateWhatsAppReminderUrl({
      phone: "081234567890",
      tenantName: "Budi",
      roomNumber: "101",
      invoiceNumber: "INV-001",
      totalAmount: 1500000,
      dueDate: new Date(2026, 9, 10),
    });
    assert(link.startsWith("https://wa.me/6281234567890?text="));
    assert(link.includes("Budi"));
    console.log("✓ WhatsApp reminder link generation logic passed");
  }

  // 4. JWT Auth Token Sign & Verify
  {
    const mockUser = {
      id: "usr-123",
      email: "test@koskita.com",
      name: "Test User",
      phone: "0812345678",
      role: "STAFF" as const,
    };
    const token = await signSession(mockUser);
    const decoded = await verifySession(token);
    assert(decoded !== null);
    assert.strictEqual(decoded.id, mockUser.id);
    assert.strictEqual(decoded.role, "STAFF");
    console.log("✓ JWT sign and verify session passed");
  }

  // 5. Midtrans Signature Verification
  {
    const orderId = "INV-20261007-101-TEST";
    const statusCode = "200";
    const grossAmount = "1500000.00";
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-test-key";
    const expectedHash = crypto
      .createHash("sha512")
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest("hex");

    const isValid = verifyMidtransSignature(orderId, statusCode, grossAmount, expectedHash);
    assert.strictEqual(isValid, true);

    const isInvalid = verifyMidtransSignature(orderId, statusCode, grossAmount, "wronghash");
    assert.strictEqual(isInvalid, false);
    console.log("✓ Midtrans SHA512 signature validation passed");
  }

  // 6. Referral Code Generation
  {
    const { TenantService } = await import("../src/services/tenant.service");
    const code = TenantService.generateReferralCode("Budi Santoso");
    assert(code.startsWith("KOS-BUDI"));
    assert.strictEqual(code.length, 12);
    console.log("✓ Referral code generation logic passed");
  }

  console.log("ALL SELF-CHECK TESTS PASSED!");
}

runSelfChecks().catch((err) => {
  console.error("Self check failed:", err);
  process.exit(1);
});
