export type Role = "OWNER" | "STAFF" | "TENANT";
export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
export type InvoiceStatus = "UNPAID" | "PAID" | "EXPIRED" | "CANCELLED";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
