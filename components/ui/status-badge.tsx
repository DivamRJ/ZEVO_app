"use client";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

type StatusBadgeProps = {
  status: BookingStatus;
  className?: string;
};

const statusConfig: Record<BookingStatus, { label: string; colors: string }> = {
  PENDING: {
    label: "Pending",
    colors: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  },
  CONFIRMED: {
    label: "Confirmed",
    colors: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  },
  COMPLETED: {
    label: "Completed",
    colors: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
  },
  CANCELLED: {
    label: "Cancelled",
    colors: "border-red-500/40 bg-red-500/15 text-red-400",
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${config.colors} ${className}`}
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {config.label}
    </span>
  );
}
