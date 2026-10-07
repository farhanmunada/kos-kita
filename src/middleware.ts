import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { Role } from "./types";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "kos-kita-default-super-secret-key-min-32-chars-ok"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("kos_session")?.value;

  let session: { role: Role; id: string } | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      session = {
        role: payload.role as Role,
        id: payload.id as string,
      };
    } catch {
      session = null;
    }
  }

  // Jika sudah login dan akses /login, redirect sesuai role
  if (pathname === "/login") {
    if (session) {
      if (session.role === "TENANT") {
        return NextResponse.redirect(new URL("/portal", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Rute Owner / Staff
  const staffRoutes = ["/dashboard", "/rooms", "/tenants", "/meter", "/invoices"];
  const isStaffRoute = staffRoutes.some((route) => pathname.startsWith(route));

  if (isStaffRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "OWNER" && session.role !== "STAFF") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
  }

  // Rute Tenant Portal
  if (pathname.startsWith("/portal")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/rooms/:path*", "/tenants/:path*", "/meter/:path*", "/invoices/:path*", "/portal/:path*"],
};
