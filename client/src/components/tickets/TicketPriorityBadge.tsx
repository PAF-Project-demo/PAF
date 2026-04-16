import type { TicketPriority } from "../../lib/ticketing/types";
import { getPriorityTone } from "../../lib/ticketing/helpers";

export default function TicketPriorityBadge({
  priority,
}: {
  priority: TicketPriority;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
      <span className={`h-2.5 w-2.5 rounded-full ${getPriorityTone(priority)}`} />
      {priority}
    </span>
  );
}
