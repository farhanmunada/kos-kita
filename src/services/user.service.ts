import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { Role } from "@/types";

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  phone: string;
  role?: Role;
}

export class UserService {
  static async getUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  static async getUserById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  static async createUser(input: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const [newUser] = await db
      .insert(users)
      .values({
        email: input.email,
        password: hashedPassword,
        name: input.name,
        phone: input.phone,
        role: input.role || "TENANT",
      })
      .returning();
    return newUser;
  }

  static async verifyCredentials(email: string, plainTextPassword: string) {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(plainTextPassword, user.password);
    if (!isValid) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role as Role,
    };
  }

  static async getAllStaff() {
    return db.select().from(users).where(eq(users.role, "STAFF"));
  }
}
