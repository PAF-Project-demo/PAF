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
import { formatDateTime, formatTicketLocation } from "../../lib/ticketing/helpers";
import { getSlaSummaryText } from "../../lib/ticketing/sla";
import { fetchDashboardSummary } from "../../lib/ticketing/ticketService";
import type { DashboardSummary } from "../../lib/ticketing/types";

const statusPresentation: Record<
  string,
  { label: string; color: string; description: string; accent: string }
> = {
  OPEN: {
    label: "Open",
    color: "#f59e0b",
    description: "New tickets waiting for triage.",
    accent: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "#3b82f6",
    description: "Tickets actively being worked on.",
    accent: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  },
  ON_HOLD: {
    label: "Pending",
    color: "#8b5cf6",
    description: "Tickets paused pending action or clarification.",
    accent: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  },
  RESOLVED: {
    label: "Resolved",
    color: "#10b981",
    description: "Issues fixed and awaiting closure or confirmation.",
    accent: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  CLOSED: {
    label: "Closed",
    color: "#111827",
    description: "Completed tickets with final closure.",
    accent: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#ef4444",
    description: "Requests closed without work proceeding.",
    accent: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  },
};

const priorityPresentation: Record<string, { color: string; accent: string }> = {
  LOW: { color: "#10b981", accent: "bg-emerald-500" },
  MEDIUM: { color: "#f59e0b", accent: "bg-amber-500" },
  HIGH: { color: "#f97316", accent: "bg-orange-500" },
  CRITICAL: { color: "#ef4444", accent: "bg-red-500" },
};

const slaPresentation: Record<string, { label: string; description: string; accent: string }> = {
  SAME_DAY: {
    label: "Same-day",
    description: "Low and Medium priority tickets are expected to move through the day quickly.",
    accent: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200",
  },
  TWO_DAY: {
    label: "Up to 2 days",
    description: "High and Critical tickets get a slightly longer working window when needed.",
    accent: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200",
  },
  EXTENDED: {
    label: "Extended repair",
    description: "Large repairs or replacement work are marked for extra resolution time.",
    accent: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200",
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

function lightenHex(hex: string, amount: number) {
  const normalized = hex.replace("#", "");
  const numeric = Number.parseInt(normalized, 16);
  const channel = (shift: number) =>
    Math.min(255, Math.max(0, ((numeric >> shift) & 0xff) + amount))
      .toString(16)
      .padStart(2, "0");

  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

export default function TicketDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const load = async (showLoader: boolean) => {
      if (showLoader) {
        setIsLoading(true);
      }

      try {
        const nextSummary = await fetchDashboardSummary();
        if (isActive) {
          setSummary(nextSummary);
        }
      } finally {
        if (isActive && showLoader) {
          setIsLoading(false);
        }
      }
    };

    void load(true);

    const intervalId = window.setInterval(() => {
      void load(false);
    }, 30000);
    const handleFocus = () => {
      void load(false);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const statusItems = useMemo(
    () =>
      (summary?.charts.statusBreakdown ?? []).map((item) => ({
        ...item,
        label: statusPresentation[item.label]?.label ?? item.label,
        color: statusPresentation[item.label]?.color ?? "#94a3b8",
        description: statusPresentation[item.label]?.description ?? "Ticket status group.",
        accent:
          statusPresentation[item.label]?.accent ??
          "bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
      })),
    [summary]
  );

  const statusSeries = statusItems.map((item) => item.value);
  const statusLabels = statusItems.map((item) => item.label);
  const statusColors = statusItems.map((item) => item.color);
  const statusTotal = statusSeries.reduce((sum, value) => sum + value, 0);
  const activeStatusItems = statusItems.filter((item) => item.value > 0);
  const activeStatusCount = activeStatusItems.length;
  const hasStatusData = statusTotal > 0;
  const dominantStatus =
    [...activeStatusItems].sort((left, right) => right.value - left.value)[0] ?? null;

  const trendData = summary?.charts.monthlyTrend ?? [];
  const trendLabels = trendData.map((item) => item.label);
  const trendSeries = trendData.map((item) => item.created);
  const totalTrendVolume = trendSeries.reduce((sum, value) => sum + value, 0);
  const hasMonthlyData = totalTrendVolume > 0;
  const maxMonthlyValue = Math.max(1, ...trendSeries);

  const priorityItems = summary?.charts.priorityBreakdown ?? [];
  const priorityTotal = priorityItems.reduce((sum, item) => sum + item.value, 0);
  const typeItems = summary?.charts.typeBreakdown ?? [];
  const slaItems = summary?.charts.slaBreakdown ?? [];

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
              desc="A live view of how tickets are spread across workflow stages. The dashboard refreshes automatically while you work."
              className="xl:col-span-4"
            >
              {hasStatusData ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Total tracked
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                        {statusTotal}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Active stages
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                        {activeStatusCount}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Dominant stage
                      </p>
                      <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                        {dominantStatus?.label ?? "None"}
                      </p>
                    </div>
                  </div>

                  {activeStatusCount >= 2 ? (
                    <div className="rounded-3xl bg-gradient-to-br from-white via-gray-50 to-slate-100 p-3 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
                      <ReactApexChart
                        type="donut"
                        height={320}
                        series={statusSeries}
                        options={{
                          labels: statusLabels,
                          colors: statusColors,
                          legend: { show: false },
                          fill: {
                            type: "gradient",
                            gradient: {
                              shade: "light",
                              type: "diagonal1",
                              shadeIntensity: 0.18,
                              gradientToColors: statusColors.map((color) => lightenHex(color, 28)),
                              stops: [0, 78, 100],
                            },
                          },
                          stroke: {
                            width: 4,
                            colors: ["#ffffff"],
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
                              donut: {
                                size: "70%",
                                labels: {
                                  show: true,
                                  name: {
                                    show: true,
                                    offsetY: 18,
                                  },
                                  value: {
                                    show: true,
                                    offsetY: -16,
                                    formatter: (value: string) =>
                                      `${Math.round(Number(value))}`,
                                  },
                                  total: {
                                    show: true,
                                    label: "Tickets",
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
                  ) : (
                    <div className="rounded-3xl bg-gradient-to-br from-white via-amber-50 to-orange-100 p-3 dark:from-gray-900 dark:via-amber-500/10 dark:to-orange-500/10">
                      <ReactApexChart
                        type="radialBar"
                        height={320}
                        series={[100]}
                        options={{
                          colors: [dominantStatus?.color ?? "#f59e0b"],
                          labels: [dominantStatus?.label ?? "Single Stage"],
                          fill: {
                            type: "gradient",
                            gradient: {
                              shade: "light",
                              type: "horizontal",
                              shadeIntensity: 0.24,
                              gradientToColors: [
                                lightenHex(dominantStatus?.color ?? "#f59e0b", 40),
                              ],
                              stops: [0, 100],
                            },
                          },
                          stroke: {
                            lineCap: "round",
                          },
                          plotOptions: {
                            radialBar: {
                              hollow: {
                                size: "58%",
                              },
                              track: {
                                background: "#e5e7eb",
                                strokeWidth: "100%",
                                margin: 0,
                              },
                              dataLabels: {
                                name: {
                                  offsetY: 30,
                                  fontSize: "15px",
                                  fontWeight: "600",
                                },
                                value: {
                                  offsetY: -16,
                                  fontSize: "32px",
                                  fontWeight: "700",
                                  formatter: () => `${dominantStatus?.value ?? 0}`,
                                },
                              },
                            },
                          },
                        }}
                      />
                      <p className="px-5 pb-4 text-center text-sm text-gray-600 dark:text-gray-300">
                        All current tickets are concentrated in{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {dominantStatus?.label ?? "one workflow stage"}
                        </span>
                        . The breakdown below still updates from real ticket data.
                      </p>
                    </div>
                  )}

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
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {item.label}
                                </p>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${item.accent}`}
                                >
                                  {percent}%
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                {item.value}
                              </p>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                              {item.description}
                            </p>
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
                      fill: {
                        type: "gradient",
                        gradient: {
                          shade: "light",
                          type: "vertical",
                          shadeIntensity: 0.15,
                          gradientToColors: ["#7c9bff"],
                          stops: [0, 100],
                        },
                      },
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
                          borderRadius: 10,
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
                          formatter: (value: number) =>
                            `${value} ticket${value === 1 ? "" : "s"}`,
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
              title="Priority, Type & SLA Snapshot"
              desc="Urgency mix, ticket type balance, and expected resolution windows."
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
                    Resolution Targets
                  </h4>
                  <div className="space-y-3">
                    {slaItems.map((item) => (
                      <div
                        key={item.label}
                        className={`rounded-2xl border px-4 py-4 ${
                          slaPresentation[item.label]?.accent ??
                          "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold">
                            {slaPresentation[item.label]?.label ?? item.label}
                          </p>
                          <p className="text-2xl font-semibold">{item.value}</p>
                        </div>
                        <p className="mt-2 text-xs leading-5 opacity-80">
                          {slaPresentation[item.label]?.description ?? "Current SLA grouping."}
                        </p>
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
            desc="Quick view of the latest requests, current status, and expected resolution target."
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
                      <p>Target {getSlaSummaryText(ticket)}</p>
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
            )}
          </ComponentCard>
        </div>
      )}
    </>
  );
}
