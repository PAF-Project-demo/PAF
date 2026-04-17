import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import ComponentCard from "../../components/common/ComponentCard";
import LoadingIndicator from "../../components/common/LoadingIndicator";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import TicketSummaryCard from "../../components/tickets/TicketSummaryCard";
import { fetchReports, subscribeToTicketDataChanges } from "../../lib/ticketing/ticketService";
import type { TicketReports } from "../../lib/ticketing/types";

export default function TicketReportsPage() {
  const [reports, setReports] = useState<TicketReports | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      const nextReports = await fetchReports();
      if (isActive) {
        setReports(nextReports);
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

  return (
    <>
      <PageMeta title="Ticket Reports | PAF" description="Maintenance ticket analytics and reports" />
      <PageBreadCrumb pageTitle="Reports" />

      {!reports ? (
        <div className="py-16">
          <LoadingIndicator
            className="mx-auto"
            layout="stacked"
            size="lg"
            label="Loading reports"
            description="Crunching category, SLA, and technician analytics."
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <TicketSummaryCard
              label="Average Resolution"
              value={`${reports.summary.averageResolutionHours}h`}
              description="Average elapsed time to resolve completed tickets."
            />
            <TicketSummaryCard
              label="SLA Met"
              value={reports.summary.slaMetTickets}
              description="Completed tickets resolved inside target time."
            />
            <TicketSummaryCard
              label="SLA Breached"
              value={reports.summary.slaBreachedTickets}
              description="Completed tickets that missed the target deadline."
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ComponentCard
              title="Category Breakdown"
              desc="Which issue types consume the most maintenance effort."
            >
              <ReactApexChart
                type="bar"
                height={320}
                series={[{ name: "Tickets", data: reports.categoryBreakdown.map((item) => item.value) }]}
                options={{
                  chart: { toolbar: { show: false } },
                  xaxis: { categories: reports.categoryBreakdown.map((item) => item.label) },
                  dataLabels: { enabled: false },
                  colors: ["#0ea5e9"],
                  plotOptions: { bar: { borderRadius: 6, horizontal: true } },
                }}
              />
            </ComponentCard>

            <ComponentCard
              title="Technician Workload"
              desc="Resolved ticket distribution across available staff."
            >
              <ReactApexChart
                type="donut"
                height={320}
                series={reports.technicianWorkload.map((item) => item.value)}
                options={{
                  labels: reports.technicianWorkload.map((item) => item.label),
                  legend: { position: "bottom" },
                  dataLabels: { enabled: false },
                  colors: ["#465fff", "#f59e0b", "#10b981", "#ef4444", "#a855f7"],
                }}
              />
            </ComponentCard>
          </div>

          <ComponentCard title="Ticket Type Mix" desc="Maintenance work versus incidents over time.">
            <ReactApexChart
              type="bar"
              height={280}
              series={[{ name: "Tickets", data: reports.typeBreakdown.map((item) => item.value) }]}
              options={{
                chart: { toolbar: { show: false } },
                xaxis: { categories: reports.typeBreakdown.map((item) => item.label) },
                dataLabels: { enabled: false },
                colors: ["#111827"],
                plotOptions: { bar: { borderRadius: 6, columnWidth: "35%" } },
              }}
            />
          </ComponentCard>
        </div>
      )}
    </>
  );
}
