import { useEffect, useState } from "react";
import { Link } from "react-router";
import ComponentCard from "../../components/common/ComponentCard";
import LoadingIndicator from "../../components/common/LoadingIndicator";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import TicketFiltersBar from "../../components/tickets/TicketFiltersBar";
import TicketTable from "../../components/tickets/TicketTable";
import { fetchTicketMeta, fetchTickets } from "../../lib/ticketing/ticketService";
import type { TicketFilters, TicketMeta, TicketRecord } from "../../lib/ticketing/types";

export default function TicketListPage() {
  const [meta, setMeta] = useState<TicketMeta | null>(null);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [filters, setFilters] = useState<TicketFilters>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMeta = async () => {
      setMeta(await fetchTicketMeta());
    };

    void loadMeta();
  }, []);

  useEffect(() => {
    const loadTickets = async () => {
      setIsLoading(true);
      try {
        const result = await fetchTickets(filters);
        setTickets(result.items);
      } finally {
        setIsLoading(false);
      }
    };

    void loadTickets();
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
          desc="Search, filter, and monitor the maintenance and incident pipeline."
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tickets.length} ticket{tickets.length === 1 ? "" : "s"} match the current
                filters.
              </p>
            </div>
            <Link to="/tickets/new">
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
            <TicketTable tickets={tickets} />
          )}
        </ComponentCard>
      </div>
    </>
  );
}
