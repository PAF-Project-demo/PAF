import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";

export default function BasicTables() {
  return (
    <>
      <PageMeta
        title="Users Table | PAF Auth Dashboard"
        description="View signed-in users, their providers, joined dates, and roles."
      />
      <PageBreadcrumb pageTitle="Users" />
      <div className="space-y-6">
        <ComponentCard title="Signed-In Users">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </>
  );
}
