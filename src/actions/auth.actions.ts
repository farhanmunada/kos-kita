"use server";

import { z } from "zod";
import { UserService } from "@/services/user.service";
import { TenantService } from "@/services/tenant.service";
import { signSession, setSessionCookie, clearSessionCookie } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().min(8, "Nomor telepon minimal 8 digit"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  roomId: z.string().optional(),
  referralCode: z.string().optional(),
});

export async function loginAction(formData: FormData) {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input tidak valid",
    };
  }

  const user = await UserService.verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return {
      success: false,
      error: "Email atau kata sandi salah",
    };
  }

  const token = await signSession(user);
  await setSessionCookie(token);

  const redirectUrl = user.role === "TENANT" ? "/portal" : "/dashboard";

  return {
    success: true,
    redirectUrl,
    role: user.role,
  };
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    roomId: formData.get("roomId") || undefined,
    referralCode: formData.get("referralCode") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input registrasi tidak valid",
    };
  }

  const existing = await UserService.getUserByEmail(parsed.data.email);
  if (existing) {
    return {
      success: false,
      error: "Email sudah terdaftar. Silakan gunakan email lain atau login.",
    };
  }

  try {
    let sessionUser;
    if (parsed.data.roomId) {
      // Konsumen langsung memesan kamar
      const today = new Date();
      const newTenant = await TenantService.createTenant({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        password: parsed.data.password,
        roomId: parsed.data.roomId,
        rentStartDate: today,
        billingDay: today.getDate(),
        referralCodeUsed: parsed.data.referralCode,
      });

      sessionUser = {
        id: newTenant.userId,
        email: parsed.data.email,
        name: parsed.data.name,
        phone: parsed.data.phone,
        role: "TENANT" as const,
      };
    } else {
      // Konsumen mendaftar akun dasar terlebih dahulu
      const newUser = await UserService.createUser({
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
        phone: parsed.data.phone,
        role: "TENANT",
      });

      sessionUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role as any,
      };
    }

    const token = await signSession(sessionUser);
    await setSessionCookie(token);

    return {
      success: true,
      redirectUrl: "/portal",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mendaftar";
    return {
      success: false,
      error: message,
    };
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  return { success: true };
}
