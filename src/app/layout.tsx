import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kos Kita - Sistem Manajemen Kos & Penagihan Otomatis",
  description: "Platform manajemen kos terintegrasi: data penghuni, meteran listrik, penagihan dinamis, dan Midtrans Sandbox.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
