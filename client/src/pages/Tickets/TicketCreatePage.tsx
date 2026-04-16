import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import TroubleshootingPanel from "../../components/tickets/TroubleshootingPanel";
import Button from "../../components/ui/button/Button";
import { getTroubleshootingTips } from "../../lib/ticketing/troubleshooting";
import { createTicket, fetchTicketMeta } from "../../lib/ticketing/ticketService";
import type {
  CreateTicketInput,
  TicketMeta,
  TicketType,
} from "../../lib/ticketing/types";

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

const textAreaClassName =
  "w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function TicketCreatePage() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState<TicketMeta | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [form, setForm] = useState<CreateTicketInput>({
    title: "",
    description: "",
    type: "MAINTENANCE",
    category: "",
    location: {
      building: "",
      floor: "",
      room: "",
      campus: "",
      note: "",
    },
  });

  useEffect(() => {
    const load = async () => {
      const ticketMeta = await fetchTicketMeta();
      setMeta(ticketMeta);
      setForm((current) => ({
        ...current,
        category: current.category || ticketMeta.categories[0] || "Electrical",
      }));
    };

    void load();
  }, []);

  useEffect(() => {
    if (form.type !== "INCIDENT" && form.location.note) {
      setForm((current) => ({
        ...current,
        location: {
          ...current.location,
          note: "",
        },
      }));
    }
  }, [form.type, form.location.note]);

  const isValid = useMemo(() => {
    return (
      form.title.trim() &&
      form.description.trim() &&
      form.category.trim() &&
      form.location.building.trim()
    );
  }, [form]);

  const troubleshootingTips = useMemo(
    () =>
      getTroubleshootingTips({
        title: form.title,
        description: form.description,
        category: form.category,
        type: form.type,
      }),
    [form.title, form.description, form.category, form.type]
  );

  const updateLocation = (field: keyof CreateTicketInput["location"], value: string) => {
    setForm((current) => ({
      ...current,
      location: {
        ...current.location,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const created = await createTicket({
        ...form,
        attachments,
      });
      navigate(`/tickets/${created.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Create Ticket | PAF"
        description="Create a maintenance or incident ticket"
      />
      <PageBreadCrumb pageTitle="Create Ticket" />

      <div className="space-y-6">
        <TroubleshootingPanel tips={troubleshootingTips} />

        <ComponentCard
          title="New Maintenance / Incident Ticket"
          desc="Students submit the issue details here. The system automatically evaluates urgency and assigns a priority for staff follow-up."
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ticket title
              </label>
              <input
                className={inputClassName}
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Brief issue summary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ticket type
              </label>
              <select
                className={inputClassName}
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as TicketType,
                  }))
                }
              >
                {meta?.types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                className={inputClassName}
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
              >
                {meta?.categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-4 text-sm text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-200">
                Priority is assigned automatically after submission using the ticket
                type, category, and issue description. Technicians and admins can
                review it later if needed.
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                rows={5}
                className={textAreaClassName}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Include symptoms, impact, and when the issue started."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Building
              </label>
              <input
                className={inputClassName}
                value={form.location.building}
                onChange={(event) => updateLocation("building", event.target.value)}
                placeholder="Building or main area"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Room / Area
              </label>
              <input
                className={inputClassName}
                value={form.location.room ?? ""}
                onChange={(event) => updateLocation("room", event.target.value)}
                placeholder="Optional room, lab, or nearby area"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location note
              </label>
              <textarea
                rows={3}
                className={textAreaClassName}
                value={form.location.note ?? ""}
                disabled={form.type !== "INCIDENT"}
                onChange={(event) => updateLocation("note", event.target.value)}
                placeholder={
                  form.type === "INCIDENT"
                    ? "Add landmarks, safety concerns, or incident-specific details"
                    : "Available only for incidents"
                }
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {form.type === "INCIDENT"
                  ? "Use this for incident-specific safety or access notes."
                  : "Switch the ticket type to Incident if extra location context is needed."}
              </p>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Attachments
              </label>
              <input
                type="file"
                multiple
                className={inputClassName}
                onChange={(event) => setAttachments(Array.from(event.target.files ?? []))}
              />
              {attachments.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((file) => (
                    <span
                      key={`${file.name}-${file.size}`}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                      {file.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create ticket"}
            </Button>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
