import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useNotification } from "../../components/common/NotificationProvider";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import TroubleshootingPanel from "../../components/tickets/TroubleshootingPanel";
import Alert from "../../components/ui/alert/Alert";
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

type CreateTicketFormErrors = {
  title?: string;
  description?: string;
  category?: string;
  building?: string;
};

const getFieldClassName = (hasError?: boolean) =>
  `${inputClassName} ${hasError ? "border-error-500 focus:ring-error-200 dark:border-error-500" : ""}`;

const getTextAreaFieldClassName = (hasError?: boolean) =>
  `${textAreaClassName} ${hasError ? "border-error-500 focus:ring-error-200 dark:border-error-500" : ""}`;

export default function TicketCreatePage() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [meta, setMeta] = useState<TicketMeta | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<CreateTicketFormErrors>({});
  const [submitError, setSubmitError] = useState("");
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
      try {
        const ticketMeta = await fetchTicketMeta();
        setMeta(ticketMeta);
        setForm((current) => ({
          ...current,
          category: current.category || ticketMeta.categories[0] || "Other",
        }));
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load ticket form options right now.";

        setSubmitError(message);
      }
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

  const isValid = useMemo(
    () =>
      Boolean(
        form.title.trim() &&
          form.description.trim() &&
          form.category.trim() &&
          form.location.building.trim()
      ),
    [form]
  );

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
    setErrors((current) => ({
      ...current,
      building: field === "building" ? undefined : current.building,
    }));
    setSubmitError("");
    setForm((current) => ({
      ...current,
      location: {
        ...current.location,
        [field]: value,
      },
    }));
  };

  const validateForm = () => {
    const nextErrors: CreateTicketFormErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "Ticket title is required.";
    }

    if (!form.description.trim()) {
      nextErrors.description = "Description is required.";
    }

    if (!form.category.trim()) {
      nextErrors.category = "Please select a category.";
    }

    if (!form.location.building.trim()) {
      nextErrors.building = "Building or main area is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      showNotification({
        variant: "error",
        title: "Ticket not submitted",
        message: "Complete the required fields before creating the ticket.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createTicket({
        ...form,
        attachments,
      });
      showNotification({
        variant: "success",
        title: "Ticket created",
        message: `${created.ticketId} was submitted successfully.`,
      });
      navigate(`/tickets/${created.id}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create the ticket right now.";

      setSubmitError(message);
      showNotification({
        variant: "error",
        title: "Ticket creation failed",
        message,
      });
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
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {submitError ? (
              <Alert
                variant="error"
                title="Unable to create ticket"
                message={submitError}
              />
            ) : null}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ticket title
                </label>
                <input
                  className={getFieldClassName(Boolean(errors.title))}
                  value={form.title}
                  onChange={(event) => {
                    setErrors((current) => ({ ...current, title: undefined }));
                    setSubmitError("");
                    setForm((current) => ({ ...current, title: event.target.value }));
                  }}
                  placeholder="Brief issue summary"
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title ? (
                  <p className="mt-2 text-sm text-error-600 dark:text-error-400">
                    {errors.title}
                  </p>
                ) : null}
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
                  className={getFieldClassName(Boolean(errors.category))}
                  value={form.category}
                  onChange={(event) => {
                    setErrors((current) => ({ ...current, category: undefined }));
                    setSubmitError("");
                    setForm((current) => ({ ...current, category: event.target.value }));
                  }}
                  aria-invalid={Boolean(errors.category)}
                >
                  {meta?.categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category ? (
                  <p className="mt-2 text-sm text-error-600 dark:text-error-400">
                    {errors.category}
                  </p>
                ) : null}
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
                  className={getTextAreaFieldClassName(Boolean(errors.description))}
                  value={form.description}
                  onChange={(event) => {
                    setErrors((current) => ({ ...current, description: undefined }));
                    setSubmitError("");
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }));
                  }}
                  placeholder="Include symptoms, impact, and when the issue started."
                  aria-invalid={Boolean(errors.description)}
                />
                {errors.description ? (
                  <p className="mt-2 text-sm text-error-600 dark:text-error-400">
                    {errors.description}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Building
                </label>
                <input
                  className={getFieldClassName(Boolean(errors.building))}
                  value={form.location.building}
                  onChange={(event) => updateLocation("building", event.target.value)}
                  placeholder="Building or main area"
                  aria-invalid={Boolean(errors.building)}
                />
                {errors.building ? (
                  <p className="mt-2 text-sm text-error-600 dark:text-error-400">
                    {errors.building}
                  </p>
                ) : null}
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

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isValid
                  ? "Required details are ready to submit."
                  : "Fill in the required fields marked above before submitting."}
              </p>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Ticket"}
              </Button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </>
  );
}
