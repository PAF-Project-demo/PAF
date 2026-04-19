import { formatDateTime } from "../../lib/ticketing/helpers";
import type { TicketActivityItem } from "../../lib/ticketing/types";

export default function ActivityTimeline({
  items,
}: {
  items: TicketActivityItem[];
}) {
  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No activity recorded yet.
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-3 w-3 rounded-full bg-brand-500" />
              <span className="h-full w-px bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="pb-6">
              <p className="font-medium text-gray-900 dark:text-white">{item.message}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {item.actor?.fullName ?? "Unknown"} • {item.actor?.role ?? "N/A"}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-gray-400">
                {item.action}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formatDateTime(item.createdAt)}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
