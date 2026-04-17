import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import ActivityAuditTable from "../../components/tables/BasicTables/ActivityAuditTable";

export default function AuditLog() {
  return (
    <>
      <PageMeta
        title="EduNexus"
        description="EduNexus - Student Management System"
      />
      <PageBreadcrumb pageTitle="Audit Log" />
      <div className="space-y-6">
        <ComponentCard
          title="Audit Log"
          desc="Search, filter, and paginate the stored history of role requests, admin reviews, and direct role changes."
        >
          <ActivityAuditTable />
        </ComponentCard>
      </div>
    </>
  );
}
