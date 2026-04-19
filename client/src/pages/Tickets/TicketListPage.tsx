import { useEffect, useState } from "react";
import { useNotification } from "../../components/common/NotificationProvider";
import { Link } from "react-router";
import ComponentCard from "../../components/common/ComponentCard";
import LoadingIndicator from "../../components/common/LoadingIndicator";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import {
  deleteTicket,
  fetchTicketMeta,
  fetchTickets,
  subscribeToTicketDataChanges,
} from "../../lib/ticketing/ticketApi";
import TicketFiltersBar from "../../components/tickets/TicketFiltersBar";
import TicketTable from "../../components/tickets/TicketTable";
import type { TicketFilters, TicketMeta, TicketRecord } from "../../lib/ticketing/types";

export default function TicketListPage() {
  const { showNotification } = useNotification();
  const [meta, setMeta] = useState<TicketMeta | null>(null);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [filters, setFilters] = useState<TicketFilters>({});
  const [isLoading, setIsLoading] = useState(true);

  const handleDelete = async (ticket: TicketRecord) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${ticket.title}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteTicket(ticket.id);
      showNotification({
        variant: "success",
        title: "Ticket deleted",
        message: `${ticket.ticketId} was deleted successfully.`,
      });
    } catch (error) {
      showNotification({
        variant: "error",
        title: "Delete failed",
        message:
          error instanceof Error
            ? error.message
            : "Unable to delete the ticket right now.",
      });
    }
  };

  useEffect(() => {
    const loadMeta = async () => {
      setMeta(await fetchTicketMeta());
    };

    void loadMeta();
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadTickets = async () => {
      setIsLoading(true);
      try {
        const result = await fetchTickets(filters);
        if (isActive) {
          setTickets(result.items);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadTickets();
    const unsubscribe = subscribeToTicketDataChanges(() => {
      void loadTickets();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [filters]);

  return (
    <>
      <PageMeta
        title="Ticket Queue | PAF"
        description="List and filter maintenance and incident tickets"
      />
      <PageBreadCrumb pageTitle="Ticket List" />

      <div className="space-y-6">
        <ComponentCard
          title="Ticket Queue"
          desc="Use the queue to view, search, filter, and track ticket progress. Workflow changes happen in ticket details and are limited to staff roles."
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tickets.length} ticket{tickets.length === 1 ? "" : "s"} match the current
                filters.
              </p>
            </div>
            <Link to="/dashboard/create-ticket">
              <Button>Create ticket</Button>
            </Link>
          </div>

          <TicketFiltersBar filters={filters} meta={meta} onChange={setFilters} />

          {isLoading ? (
            <div className="py-12">
              <LoadingIndicator
                className="mx-auto"
                layout="stacked"
                label="Loading tickets"
                description="Refreshing the latest queue."
              />
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center dark:border-gray-700">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                No tickets match your filters
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Adjust the filter set or create a new ticket to get started.
              </p>
            </div>
          ) : (
            <TicketTable tickets={tickets} onDelete={handleDelete} />
          )}
        </ComponentCard>
      </div>
    </>
  );
}
