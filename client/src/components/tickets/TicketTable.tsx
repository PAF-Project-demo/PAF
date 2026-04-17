import { Link } from "react-router";
import {
  formatDateTime,
  formatTicketLocation,
  getTicketDueLabel,
  getTicketSlaPolicy,
} from "../../lib/ticketing/helpers";
import type { TicketRecord } from "../../lib/ticketing/types";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Button from "../ui/button/Button";
import TicketPriorityBadge from "./TicketPriorityBadge";
import TicketStatusBadge from "./TicketStatusBadge";

export default function TicketTable({ tickets }: { tickets: TicketRecord[] }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <div className="min-w-[1100px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start text-xs uppercase text-gray-500">
                Ticket
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-xs uppercase text-gray-500">
                Type
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-xs uppercase text-gray-500">
                Priority
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-xs uppercase text-gray-500">
                Status
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-xs uppercase text-gray-500">
                Location
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-xs uppercase text-gray-500">
                SLA
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-xs uppercase text-gray-500">
                Assignee
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start text-xs uppercase text-gray-500">
                Action
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id} className="border-t border-gray-100 dark:border-gray-800">
                <TableCell className="px-5 py-4 align-top">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                      {ticket.ticketId}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">{ticket.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {ticket.category}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {ticket.type}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <TicketPriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell className="px-5 py-4">
                  <TicketStatusBadge status={ticket.status} />
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="space-y-1">
                    <p>{formatTicketLocation(ticket.location)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reported by {ticket.reporter.fullName}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="space-y-1">
                    <p>{getTicketDueLabel(ticket)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Due {formatDateTime(ticket.dueAt)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getTicketSlaPolicy(ticket).targetLabel}
                      {ticket.requiresExtendedResolution ? " | extended repair" : ""}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {ticket.assignedTechnician?.fullName ?? "Unassigned"}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <Link to={`/tickets/${ticket.id}`}>
                    <Button size="sm" variant="outline">
                      View details
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
