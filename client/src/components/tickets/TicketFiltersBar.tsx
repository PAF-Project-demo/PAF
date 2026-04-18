import type { ChangeEvent } from "react";
import Button from "../ui/button/Button";
import type { TicketFilters, TicketMeta } from "../../lib/ticketing/types";

interface TicketFiltersBarProps {
  filters: TicketFilters;
  meta: TicketMeta | null;
  onChange: (next: TicketFilters) => void;
}

const fieldClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function TicketFiltersBar({
  filters,
  meta,
  onChange,
}: TicketFiltersBarProps) {
  const handleFieldChange =
    (field: keyof TicketFilters) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        event.target instanceof HTMLInputElement &&
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;

      onChange({
        ...filters,
        [field]: value,
      });
    };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
      <input
        className={`${fieldClassName} lg:col-span-2`}
        placeholder="Search by ticket, title, location, reporter"
        value={filters.search ?? ""}
        onChange={handleFieldChange("search")}
      />
      <select
        className={fieldClassName}
        value={filters.status ?? ""}
        onChange={handleFieldChange("status")}
      >
        <option value="">All statuses</option>
        {meta?.statuses.map((status) => (
          <option key={status} value={status}>
            {status.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <select
        className={fieldClassName}
        value={filters.priority ?? ""}
        onChange={handleFieldChange("priority")}
      >
        <option value="">All priorities</option>
        {meta?.priorities.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </select>
      <select
        className={fieldClassName}
        value={filters.type ?? ""}
        onChange={handleFieldChange("type")}
      >
        <option value="">All types</option>
        {meta?.types.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <select
        className={fieldClassName}
        value={filters.category ?? ""}
        onChange={handleFieldChange("category")}
      >
        <option value="">All categories</option>
        {meta?.categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <input
        className={fieldClassName}
        placeholder="Location"
        value={filters.location ?? ""}
        onChange={handleFieldChange("location")}
      />
      <select
        className={fieldClassName}
        value={filters.assignedTechnicianId ?? ""}
        onChange={handleFieldChange("assignedTechnicianId")}
      >
        <option value="">Any assignee</option>
        {meta?.technicians.map((technician) => (
          <option key={technician.id} value={technician.id}>
            {technician.fullName}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
        <input
          type="checkbox"
          checked={filters.overdueOnly ?? false}
          onChange={handleFieldChange("overdueOnly")}
        />
        Overdue only
      </label>
      <div className="lg:col-span-2 lg:justify-self-end">
        <Button
          variant="outline"
          className="w-full lg:w-auto"
          onClick={() => onChange({})}
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
