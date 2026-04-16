import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Link } from "react-router";
import ComponentCard from "../../components/common/ComponentCard";
import LoadingIndicator from "../../components/common/LoadingIndicator";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import TicketPriorityBadge from "../../components/tickets/TicketPriorityBadge";
import TicketStatusBadge from "../../components/tickets/TicketStatusBadge";
import TicketSummaryCard from "../../components/tickets/TicketSummaryCard";
import { formatDateTime, formatTicketLocation } from "../../lib/ticketing/helpers";
import { fetchDashboardSummary } from "../../lib/ticketing/ticketService";
import type { DashboardSummary } from "../../lib/ticketing/types";

export default function TicketDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        setSummary(await fetchDashboardSummary());
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const statusSeries = summary?.charts.statusBreakdown.map((item) => item.value) ?? [];
  const statusLabels = summary?.charts.statusBreakdown.map((item) => item.label) ?? [];
  const trendSeries = summary?.charts.monthlyTrend.map((item) => item.created) ?? [];
  const trendLabels = summary?.charts.monthlyTrend.map((item) => item.label) ?? [];

  return (
    <>
      <PageMeta
        title="Maintenance Ticketing Dashboard | PAF"
        description="Maintenance and incident summary dashboard"
      />
      <PageBreadCrumb pageTitle="Ticketing Dashboard" />

      {isLoading || !summary ? (
        <div className="py-16">
          <LoadingIndicator
            className="mx-auto"
            layout="stacked"
            size="lg"
            label="Loading dashboard"
            description="Preparing ticket summary, SLA health, and recent activity."
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TicketSummaryCard
              label="Total Tickets"
              value={summary.cards.totalTickets}
              description="All maintenance and incident requests in scope."
            />
            <TicketSummaryCard
              label="Open Work"
              value={summary.cards.openTickets}
              description="Tickets currently awaiting action or in progress."
            />
            <TicketSummaryCard
              label="Overdue"
              value={summary.cards.overdueTickets}
              description="Tickets that have crossed the current SLA deadline."
            />
            <TicketSummaryCard
              label="Resolved Rate"
              value={`${summary.cards.resolvedRate}%`}
              description="Share of tickets already resolved or closed."
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <ComponentCard
              title="Status Distribution"
              desc="Current workload split across lifecycle states."
              className="xl:col-span-2"
            >
              <ReactApexChart
                type="donut"
                height={320}
                series={statusSeries}
                options={{
                  labels: statusLabels,
                  legend: { position: "bottom" },
                  dataLabels: { enabled: false },
                  colors: ["#f59e0b", "#3b82f6", "#64748b", "#10b981", "#111827", "#ef4444"],
                  stroke: { colors: ["transparent"] },
                }}
              />
            </ComponentCard>

            <ComponentCard
              title="Monthly Intake"
              desc="New ticket creation trend over time."
              className="xl:col-span-3"
            >
              <ReactApexChart
                type="bar"
                height={320}
                series={[{ name: "Tickets", data: trendSeries }]}
                options={{
                  chart: { toolbar: { show: false } },
                  xaxis: { categories: trendLabels },
                  dataLabels: { enabled: false },
                  colors: ["#465fff"],
                  plotOptions: { bar: { borderRadius: 6, columnWidth: "42%" } },
                  grid: { borderColor: "#e5e7eb" },
                }}
              />
            </ComponentCard>
          </div>

          <ComponentCard
            title="Recent Tickets"
            desc="Quick view of the latest requests and their current SLA state."
          >
            <div className="mb-2 flex justify-end">
              <Link to="/tickets">
                <Button variant="outline">View full queue</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {summary.recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
                        {ticket.ticketId}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                        {ticket.title}
                      </h3>
                    </div>
                    <TicketStatusBadge status={ticket.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <TicketPriorityBadge priority={ticket.priority} />
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {ticket.type}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p>{formatTicketLocation(ticket.location)}</p>
                    <p>Due {formatDateTime(ticket.dueAt)}</p>
                    <p>Assigned to {ticket.assignedTechnician?.fullName ?? "Unassigned"}</p>
                  </div>

                  <div className="mt-5">
                    <Link to={`/tickets/${ticket.id}`}>
                      <Button size="sm">Open ticket</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </ComponentCard>
        </div>
      )}
    </>
  );
}
