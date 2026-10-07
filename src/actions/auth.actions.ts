"use server";

import { z } from "zod";
import { UserService } from "@/services/user.service";
import { signSession, setSessionCookie, clearSessionCookie } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
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

export async function logoutAction() {
  await clearSessionCookie();
  return { success: true };
}
