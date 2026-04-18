import { useEffect, useMemo, useState } from "react";
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
import {
  fetchDashboardSummary,
  subscribeToTicketDataChanges,
} from "../../lib/ticketing/ticketApi";
import {
  formatDateTime,
  formatTicketLocation,
} from "../../lib/ticketing/helpers";
import type { DashboardSummary } from "../../lib/ticketing/types";

const statusPresentation: Record<
  string,
  { label: string; color: string; description: string }
> = {
  OPEN: {
    label: "Open",
    color: "#f59e0b",
    description: "New tickets waiting for triage.",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "#3b82f6",
    description: "Tickets actively being worked on.",
  },
  ON_HOLD: {
    label: "Pending",
    color: "#8b5cf6",
    description: "Tickets paused pending action or clarification.",
  },
  RESOLVED: {
    label: "Resolved",
    color: "#10b981",
    description: "Issues fixed and awaiting closure or confirmation.",
  },
  CLOSED: {
    label: "Closed",
    color: "#111827",
    description: "Completed tickets with final closure.",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#ef4444",
    description: "Requests closed without work proceeding.",
  },
};

const priorityPresentation: Record<string, { color: string; accent: string }> = {
  LOW: { color: "#10b981", accent: "bg-emerald-500" },
  MEDIUM: { color: "#f59e0b", accent: "bg-amber-500" },
  HIGH: { color: "#f97316", accent: "bg-orange-500" },
  CRITICAL: { color: "#ef4444", accent: "bg-red-500" },
};

const slaBucketPresentation: Record<string, { accent: string; surface: string }> = {
  "Same-day target": {
    accent: "text-emerald-700 dark:text-emerald-200",
    surface: "bg-emerald-50 dark:bg-emerald-500/10",
  },
  "2-day target": {
    accent: "text-amber-700 dark:text-amber-200",
    surface: "bg-amber-50 dark:bg-amber-500/10",
  },
  "Extended repair window": {
    accent: "text-blue-700 dark:text-blue-200",
    surface: "bg-blue-50 dark:bg-blue-500/10",
  },
};

function AnalyticsEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-900/30">
      <div className="h-14 w-14 rounded-full bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700" />
      <h4 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
      <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

export default function TicketDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const nextSummary = await fetchDashboardSummary();
        if (isActive) {
          setSummary(nextSummary);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void load();
    const unsubscribe = subscribeToTicketDataChanges(() => {
      void load();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const statusItems = useMemo(
    () =>
      (summary?.charts.statusBreakdown ?? []).map((item) => ({
        ...item,
        label: statusPresentation[item.label]?.label ?? item.label,
        color: statusPresentation[item.label]?.color ?? "#94a3b8",
        description: statusPresentation[item.label]?.description ?? "Ticket status group.",
      })),
    [summary]
  );

  const statusSeries = statusItems.map((item) => item.value);
  const statusLabels = statusItems.map((item) => item.label);
  const statusColors = statusItems.map((item) => item.color);
  const statusTotal = statusSeries.reduce((sum, value) => sum + value, 0);
  const hasStatusData = statusTotal > 0;
  const activeStatusCount = statusItems.filter((item) => item.value > 0).length;
  const singleStatusMode = activeStatusCount <= 1;
  const dominantStatus = statusItems.reduce(
    (top, item) => (item.value > top.value ? item : top),
    statusItems[0] ?? { label: "No status", value: 0, color: "#94a3b8", description: "" }
  );

  const trendData = summary?.charts.monthlyTrend ?? [];
  const trendLabels = trendData.map((item) => item.label);
  const trendSeries = trendData.map((item) => item.created);
  const totalTrendVolume = trendSeries.reduce((sum, value) => sum + value, 0);
  const hasMonthlyData = totalTrendVolume > 0;
  const maxMonthlyValue = Math.max(1, ...trendSeries);

  const priorityItems = summary?.charts.priorityBreakdown ?? [];
  const priorityTotal = priorityItems.reduce((sum, item) => sum + item.value, 0);
  const typeItems = summary?.charts.typeBreakdown ?? [];
  const slaBuckets = summary?.slaBuckets ?? [];

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

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <ComponentCard
              title="Status Distribution"
              desc="A balanced view of how tickets are currently spread across workflow stages."
              className="xl:col-span-4"
            >
              {hasStatusData ? (
                <div className="space-y-5">
                  <div className="rounded-[28px] bg-gradient-to-br from-slate-50 via-white to-sky-50 p-4 ring-1 ring-gray-200 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900 dark:ring-gray-800">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
                        {activeStatusCount} active segment{activeStatusCount === 1 ? "" : "s"}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
                        Lead stage: {dominantStatus.label}
                      </span>
                    </div>

                    <ReactApexChart
                      type="donut"
                      height={320}
                      series={statusSeries}
                      options={{
                        chart: {
                          toolbar: {
                            show: false,
                          },
                        },
                        labels: statusLabels,
                        colors: statusColors,
                        legend: {
                          show: false,
                        },
                        fill: {
                          type: singleStatusMode ? "gradient" : "solid",
                          gradient: singleStatusMode
                            ? {
                                shade: "light",
                                type: "diagonal1",
                                shadeIntensity: 0.35,
                                gradientToColors: ["#e0f2fe"],
                                opacityFrom: 1,
                                opacityTo: 0.85,
                                stops: [0, 55, 100],
                              }
                            : undefined,
                        },
                        stroke: {
                          width: 4,
                          colors: ["#f8fafc"],
                        },
                        states: {
                          hover: {
                            filter: {
                              type: "lighten",
                            },
                          },
                        },
                        dataLabels: {
                          enabled: true,
                          formatter: (value: number) => `${Math.round(value)}%`,
                          style: {
                            fontSize: "11px",
                            fontWeight: "600",
                          },
                          dropShadow: {
                            enabled: false,
                          },
                        },
                        plotOptions: {
                          pie: {
                            expandOnClick: false,
                            donut: {
                              size: "70%",
                              background: "#eef2ff",
                              labels: {
                                show: true,
                                name: {
                                  show: true,
                                  offsetY: -6,
                                },
                                value: {
                                  show: true,
                                  fontSize: "22px",
                                  fontWeight: "700",
                                  formatter: (value: string) => `${Math.round(Number(value))}%`,
                                },
                                total: {
                                  show: true,
                                  label: singleStatusMode
                                    ? `${dominantStatus.label} focus`
                                    : "Total tickets",
                                  formatter: () => `${statusTotal}`,
                                },
                              },
                            },
                          },
                        },
                        tooltip: {
                          y: {
                            formatter: (value: number) => {
                              const percent = statusTotal
                                ? Math.round((value / statusTotal) * 100)
                                : 0;
                              return `${value} tickets (${percent}%)`;
                            },
                          },
                        },
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {statusItems.map((item) => {
                      const percent = statusTotal
                        ? Math.round((item.value / statusTotal) * 100)
                        : 0;

                      return (
                        <div
                          key={item.label}
                          className="flex items-start gap-3 rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800"
                        >
                          <span
                            className="mt-1 h-3 w-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {item.label}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                {item.value} | {percent}%
                              </p>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                              {item.description}
                            </p>
                            <div className="mt-3 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                              <div
                                className="h-1.5 rounded-full transition-all"
                                style={{
                                  width: `${statusTotal ? Math.max(percent, item.value > 0 ? 10 : 0) : 0}%`,
                                  backgroundColor: item.color,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <AnalyticsEmptyState
                  title="No sufficient data yet"
                  description="Status distribution will appear here once tickets start moving through the workflow."
                />
              )}
            </ComponentCard>

            <ComponentCard
              title="Monthly Intake"
              desc="Ticket creation volume across the latest six-month window for a clearer trend view."
              className="xl:col-span-5"
            >
              {hasMonthlyData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Months tracked
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                        {trendLabels.length}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Tickets logged
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                        {totalTrendVolume}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Peak month
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                        {maxMonthlyValue}
                      </p>
                    </div>
                  </div>

                  <ReactApexChart
                    type="bar"
                    height={320}
                    series={[{ name: "Tickets created", data: trendSeries }]}
                    options={{
                      chart: {
                        toolbar: { show: false },
                        animations: {
                          speed: 600,
                        },
                      },
                      colors: ["#465fff"],
                      dataLabels: {
                        enabled: false,
                      },
                      grid: {
                        borderColor: "#e5e7eb",
                        strokeDashArray: 4,
                        padding: {
                          left: 12,
                          right: 12,
                        },
                      },
                      plotOptions: {
                        bar: {
                          borderRadius: 8,
                          columnWidth: "46%",
                          distributed: false,
                        },
                      },
                      xaxis: {
                        categories: trendLabels,
                        labels: {
                          rotate: 0,
                          trim: false,
                        },
                        axisBorder: { show: false },
                        axisTicks: { show: false },
                      },
                      yaxis: {
                        min: 0,
                        forceNiceScale: true,
                        tickAmount: Math.min(5, maxMonthlyValue + 1),
                        labels: {
                          formatter: (value: number) => `${Math.round(value)}`,
                        },
                      },
                      tooltip: {
                        y: {
                          formatter: (value: number) => `${value} ticket${value === 1 ? "" : "s"}`,
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <AnalyticsEmptyState
                  title="No sufficient data yet"
                  description="Monthly intake will become more informative once tickets have been created over time."
                />
              )}
            </ComponentCard>

            <ComponentCard
              title="Priority & Type Snapshot"
              desc="A quick read of urgency mix and ticket type balance."
              className="xl:col-span-3"
            >
              <div className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Tickets by Priority
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Live from current data
                    </span>
                  </div>
                  <div className="space-y-3">
                    {priorityItems.map((item) => {
                      const share = priorityTotal
                        ? Math.round((item.value / priorityTotal) * 100)
                        : 0;
                      const width = priorityTotal ? Math.max(share, item.value > 0 ? 8 : 0) : 0;

                      return (
                        <div key={item.label} className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  priorityPresentation[item.label]?.accent ?? "bg-slate-400"
                                }`}
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {item.label}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.value} | {share}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${width}%`,
                                backgroundColor:
                                  priorityPresentation[item.label]?.color ?? "#94a3b8",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Tickets by Type
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {typeItems.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-gray-200 px-4 py-4 text-center dark:border-gray-800"
                      >
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {item.label === "MAINTENANCE" ? "Maintenance" : "Incident"}
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Expected SLA windows
                  </h4>
                  <div className="space-y-3">
                    {slaBuckets.map((bucket) => (
                      <div
                        key={bucket.label}
                        className={`rounded-2xl px-4 py-4 ${
                          slaBucketPresentation[bucket.label]?.surface ??
                          "bg-gray-50 dark:bg-gray-900/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {bucket.label}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                              {bucket.description}
                            </p>
                          </div>
                          <p
                            className={`text-2xl font-semibold ${
                              slaBucketPresentation[bucket.label]?.accent ??
                              "text-gray-900 dark:text-white"
                            }`}
                          >
                            {bucket.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    SLA health
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                        {summary.cards.overdueTickets}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        overdue tickets
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {summary.cards.totalTickets - summary.cards.overdueTickets}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        currently on time
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ComponentCard>
          </div>

          <ComponentCard
            title="Recent Tickets"
            desc="Quick view of the latest requests and their current SLA state."
          >
            <div className="mb-2 flex justify-end">
              <Link to="/dashboard/ticket-queue">
                <Button variant="outline">View full queue</Button>
              </Link>
            </div>

            {summary.recentTickets.length === 0 ? (
              <AnalyticsEmptyState
                title="No recent tickets yet"
                description="Recent activity cards will appear here once tickets start coming into the system."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {summary.recentTickets.map((ticket) => {
                  const slaPolicy = ticket.slaPolicy;

                  return (
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
                        <p>
                          SLA target: {slaPolicy.targetLabel}
                          {ticket.requiresExtendedResolution ? " for major repair" : ""}
                        </p>
                        <p>Assigned to {ticket.assignedTechnician?.fullName ?? "Unassigned"}</p>
                      </div>

                      <div className="mt-5">
                        <Link to={`/tickets/${ticket.id}`}>
                          <Button size="sm">Open ticket</Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ComponentCard>
        </div>
      )}
    </>
  );
}
