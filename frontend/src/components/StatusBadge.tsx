import { statusClass, statusLabel } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {statusLabel[status] ?? status}
    </span>
  );
}
