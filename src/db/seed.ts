import * as dotenv from "dotenv";
dotenv.config();

import { UserService } from "../services/user.service";
import { RoomService } from "../services/room.service";
import { TenantService } from "../services/tenant.service";

async function main() {
  console.log("Seeding database di Neon PostgreSQL...");

  // 1. Seed Owner
  let owner = await UserService.getUserByEmail("owner@koskita.com");
  if (!owner) {
    owner = await UserService.createUser({
      name: "Bapak H. Sukardi (Owner)",
      email: "owner@koskita.com",
      password: "password123",
      phone: "081122334455",
      role: "OWNER",
    });
    console.log("Created Owner: owner@koskita.com");
  }

  // 2. Seed Staff
  let staff = await UserService.getUserByEmail("staff@koskita.com");
  if (!staff) {
    staff = await UserService.createUser({
      name: "Mas Joko (Pengelola)",
      email: "staff@koskita.com",
      password: "password123",
      phone: "081298765432",
      role: "STAFF",
    });
    console.log("Created Staff: staff@koskita.com");
  }

  // 3. Seed Rooms
  const existingRooms = await RoomService.getAllRooms();
  if (existingRooms.length === 0) {
    const room101 = await RoomService.createRoom({
      roomNumber: "101",
      type: "AC Standard + KM Dalam",
      basePrice: "1500000",
      status: "AVAILABLE",
    });

    const room102 = await RoomService.createRoom({
      roomNumber: "102",
      type: "Non-AC Standard",
      basePrice: "900000",
      status: "AVAILABLE",
    });

    const room201 = await RoomService.createRoom({
      roomNumber: "201",
      type: "VIP Balkon + Water Heater",
      basePrice: "2200000",
      status: "AVAILABLE",
    });

    console.log("Created 3 initial rooms (101, 102, 201)");

    // 4. Seed 1 Sample Tenant in Room 101
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() - 15); // Masuk 15 hari lalu

    await TenantService.createTenant({
      name: "Andi Pratama",
      email: "tenant@koskita.com",
      password: "password123",
      phone: "081345678910",
      roomId: room101.id,
      rentStartDate: checkInDate,
      billingDay: 15,
      ktpNumber: "3201123456780001",
      emergencyPhone: "081233445566 (Ibu)",
    });

    console.log("Created sample tenant: tenant@koskita.com in Room 101");
  }

  console.log("Seeding selesai!");
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
