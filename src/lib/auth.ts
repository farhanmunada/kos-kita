import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role, SessionUser } from "@/types";

const COOKIE_NAME = "kos_session";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "kos-kita-default-super-secret-key-min-32-chars-ok"
);

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      phone: payload.phone as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
