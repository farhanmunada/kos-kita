"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Zap, Clock, ShieldAlert } from "lucide-react";

export interface AlertItem {
  id: string;
  type: "overdue" | "due_soon" | "need_meter";
  message: string;
  roomNumber: string;
  href: string;
}

export function AlertTicker({ alerts }: { alerts: AlertItem[] }) {
  const [isPaused, setIsPaused] = useState(false);

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-emerald-800 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Semua operasional kos lancar: tidak ada tunggakan jatuh tempo maupun meteran tertunda.</span>
      </div>
    );
  }

  return (
    <div
      className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden py-2 px-3 relative shadow-xs"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 flex-shrink-0 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Perlu Perhatian ({alerts.length})</span>
        </div>

        <div className="overflow-hidden whitespace-nowrap flex-1 relative">
          <div
            className={`inline-flex items-center gap-8 ${
              isPaused ? "" : "animate-marquee"
            }`}
          >
            {alerts.concat(alerts).map((item, idx) => (
              <Link
                key={`${item.id}-${idx}`}
                href={item.href}
                className="inline-flex items-center gap-2 text-xs font-medium text-amber-900 hover:text-indigo-600 hover:underline transition"
              >
                {item.type === "overdue" && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                )}
                {item.type === "need_meter" && (
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                )}
                {item.type === "due_soon" && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
                <span>{item.message}</span>
                <span className="text-[10px] bg-amber-200/70 text-amber-800 px-1.5 py-0.5 rounded font-mono">
                  Kamar {item.roomNumber}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <span className="text-[10px] text-amber-600/80 hidden sm:inline flex-shrink-0">
          (Hover untuk jeda)
        </span>
      </div>
    </div>
  );
}
