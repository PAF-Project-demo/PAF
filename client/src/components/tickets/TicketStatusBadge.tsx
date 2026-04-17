import Badge from "../ui/badge/Badge";
import { getStatusColor } from "../../lib/ticketing/helpers";
import type { TicketStatus } from "../../lib/ticketing/types";

export default function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge size="sm" variant="light" color={getStatusColor(status)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
