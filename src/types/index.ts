export type Role = "OWNER" | "STAFF" | "TENANT";
export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
export type InvoiceStatus = "UNPAID" | "PAID" | "EXPIRED" | "CANCELLED";
export type RoomChangeStatus = "PENDING" | "APPROVED" | "REJECTED";

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

export interface RoomWithDetails {
  id: string;
  roomNumber: string;
  name?: string | null;
  type: string;
  basePrice: string;
  facilities: string[];
  status: RoomStatus;
  createdAt: Date;
}
