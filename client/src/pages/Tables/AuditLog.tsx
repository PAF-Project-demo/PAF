import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import ActivityAuditTable from "../../components/tables/BasicTables/ActivityAuditTable";

export default function AuditLog() {
  return (
    <>
      <PageMeta
        title="Audit Log | PAF Auth Dashboard"
        description="Review the stored history of role requests, approvals, rejections, and direct role changes."
      />
      <PageBreadcrumb pageTitle="Audit Log" />
      <div className="space-y-6">
        <ComponentCard
          title="Audit Log"
          desc="Persistent activity history for role requests, admin reviews, and manual role changes."
        >
          <ActivityAuditTable />
        </ComponentCard>
      </div>
    </>
  );
}
