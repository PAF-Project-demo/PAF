import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import ActivityTimeline from "../../components/tickets/ActivityTimeline";
import CommentsPanel from "../../components/tickets/CommentsPanel";
import TicketPriorityBadge from "../../components/tickets/TicketPriorityBadge";
import TicketStatusBadge from "../../components/tickets/TicketStatusBadge";
import ComponentCard from "../../components/common/ComponentCard";
import LoadingIndicator from "../../components/common/LoadingIndicator";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { isAdminOrTechnicianRole, isAdminRole } from "../../lib/auth";
import {
  formatDateTime,
  formatTicketLocation,
  getTicketDueLabel,
} from "../../lib/ticketing/helpers";
import {
  addTicketComment,
  assignTechnician,
  fetchTicketById,
  fetchTicketMeta,
  updateTicket,
  uploadTicketAttachments,
} from "../../lib/ticketing/ticketApi";
import type { TicketMeta, TicketPriority, TicketRecord, TicketStatus } from "../../lib/ticketing/types";
import { useAuthSession } from "../../context/AuthSessionContext";

const fieldClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function TicketDetailsPage() {
  const { id = "" } = useParams();
  const { authSession } = useAuthSession();
  const [ticket, setTicket] = useState<TicketRecord | null>(null);
  const [meta, setMeta] = useState<TicketMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
  const [workflowMessage, setWorkflowMessage] = useState("");
  const [status, setStatus] = useState<TicketStatus>("OPEN");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [requiresExtendedResolution, setRequiresExtendedResolution] = useState(false);
  const [technicianId, setTechnicianId] = useState("");
  const currentRole = authSession?.role ?? "USER";

  const canManage = useMemo(
    () => isAdminOrTechnicianRole(currentRole),
    [currentRole]
  );
  const isAdmin = isAdminRole(currentRole);
  const isStudent = !canManage;
  const availableStatuses = useMemo(
    () => ticket?.allowedStatusOptions ?? (["OPEN"] as TicketStatus[]),
    [ticket]
  );

  const loadTicket = async () => {
    setIsLoading(true);
    try {
      const [ticketItem, ticketMeta] = await Promise.all([
        fetchTicketById(id),
        fetchTicketMeta(),
      ]);

      setTicket(ticketItem);
      setMeta(ticketMeta);
      setStatus(ticketItem.status);
      setPriority(ticketItem.priority);
      setRequiresExtendedResolution(Boolean(ticketItem.requiresExtendedResolution));
      setTechnicianId(ticketItem.assignedTechnician?.id ?? "");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTicket();
  }, [id]);

  useEffect(() => {
    if (ticket && !availableStatuses.includes(status)) {
      setStatus(availableStatuses[0] ?? ticket.status);
    }
  }, [availableStatuses, status, ticket]);

  if (isLoading || !ticket) {
    return (
      <div className="py-16">
        <LoadingIndicator
          className="mx-auto"
          layout="stacked"
          size="lg"
          label="Loading ticket"
          description="Pulling full details, comments, and activity history."
        />
      </div>
    );
  }

  const slaPolicy = ticket.slaPolicy;

  const handleUpdate = async () => {
    if (!canManage) {
      return;
    }

    setIsSavingWorkflow(true);
    setWorkflowMessage("");

    try {
      let nextTicket = ticket;

      if (isAdmin && technicianId && technicianId !== ticket.assignedTechnician?.id) {
        nextTicket = await assignTechnician(ticket.id, technicianId);
      }

      if (isAdmin && !technicianId && ticket.assignedTechnician) {
        nextTicket = await assignTechnician(ticket.id, null);
      }

      if (
        status !== nextTicket.status ||
        priority !== nextTicket.priority ||
        requiresExtendedResolution !== Boolean(nextTicket.requiresExtendedResolution)
      ) {
        nextTicket = await updateTicket(ticket.id, {
          status,
          priority,
          requiresExtendedResolution,
        });
      }

      setTicket(nextTicket);
      setStatus(nextTicket.status);
      setPriority(nextTicket.priority);
      setRequiresExtendedResolution(Boolean(nextTicket.requiresExtendedResolution));
      setTechnicianId(nextTicket.assignedTechnician?.id ?? "");
      setWorkflowMessage("Workflow updated successfully.");
    } catch (error) {
      setWorkflowMessage(
        error instanceof Error ? error.message : "Unable to update workflow right now."
      );
    } finally {
      setIsSavingWorkflow(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    const nextTicket = await uploadTicketAttachments(ticket.id, files);
    setTicket({ ...nextTicket });
  };

  return (
    <>
      <PageMeta
        title={`${ticket.ticketId} | PAF`}
        description="Ticket details, comments, activity history, and assignment"
      />
      <PageBreadCrumb pageTitle="Ticket Details" />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
            {ticket.ticketId}
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {ticket.title}
          </h1>
          <div className="flex flex-wrap gap-3">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {ticket.type}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Link to="/dashboard/ticket-queue">
            <Button variant="outline">Back to list</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <ComponentCard title="Issue Overview" desc="Core request details and current SLA state.">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </p>
                <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-300">
                  {ticket.description}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {formatTicketLocation(ticket.location)}
                </p>
                {ticket.location.note ? (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {ticket.location.note}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Reporter</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {ticket.reporter?.fullName ?? "Unknown reporter"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.reporter?.email ?? "No email available"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Due</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {formatDateTime(ticket.dueAt)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{getTicketDueLabel(ticket)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Created</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {formatDateTime(ticket.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Expected resolution
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {slaPolicy.targetLabel}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {slaPolicy.description}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Workflow target
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {slaPolicy.workflowPath.map((item) => item.replace(/_/g, " ")).join(" -> ")}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {ticket.requiresExtendedResolution
                    ? "Extended timing is active for a major or large repair."
                    : "Standard rule-based workflow is active for this ticket."}
                </p>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Comments" desc="Operational discussion and stakeholder updates.">
            <CommentsPanel
              comments={ticket.comments}
              onSubmit={async (message) => {
                const nextTicket = await addTicketComment(ticket.id, message);
                setTicket({ ...nextTicket });
              }}
            />
          </ComponentCard>

          <ComponentCard title="Activity Timeline" desc="Every important change recorded on the ticket.">
            <ActivityTimeline items={ticket.activity} />
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard
            title={isStudent ? "Progress Tracking" : "Workflow Controls"}
            desc={
              isStudent
                ? "Students can monitor progress here. Technicians and admins manage workflow updates."
                : "Technicians and admins can move the ticket through workflow stages here."
            }
          >
            {isStudent ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                  You can track progress, comments, attachments, and activity history here.
                  Workflow stage changes are handled by technicians and admins.
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      SLA expectation
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {slaPolicy.targetLabel}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {slaPolicy.workflowPath.map((item) => item.replace(/_/g, " ")).join(" -> ")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Current status
                    </p>
                    <div className="mt-2">
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Priority
                    </p>
                    <div className="mt-2">
                      <TicketPriorityBadge priority={ticket.priority} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Assigned technician
                    </p>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                      {ticket.assignedTechnician?.fullName ?? "Awaiting assignment"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Last updated
                    </p>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                      {formatDateTime(ticket.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Staff workflow mode is active. Status and workflow changes made here
                  will be visible to the student as tracking updates.
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    SLA rule
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                    {slaPolicy.targetLabel}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {slaPolicy.description}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Recommended workflow
                  </p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {slaPolicy.workflowPath.map((item) => item.replace(/_/g, " ")).join(" -> ")}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    className={fieldClassName}
                    value={status}
                    disabled={!canManage || isSavingWorkflow}
                    onChange={(event) => setStatus(event.target.value as TicketStatus)}
                  >
                    {availableStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Available stages come from the current backend workflow rules.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priority
                  </label>
                  <select
                    className={fieldClassName}
                    value={priority}
                    disabled={!canManage || isSavingWorkflow}
                    onChange={(event) => setPriority(event.target.value as TicketPriority)}
                  >
                    {meta?.priorities.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assigned technician
                  </label>
                  <select
                    className={fieldClassName}
                    value={technicianId}
                    disabled={!isAdmin || isSavingWorkflow}
                    onChange={(event) => setTechnicianId(event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {meta?.technicians.map((technician) => (
                      <option key={technician.id} value={technician.id}>
                        {technician.fullName}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Only admins can assign technicians. Technicians and admins can update status.
                  </p>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-gray-200 px-4 py-4 dark:border-gray-800">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-200"
                    checked={requiresExtendedResolution}
                    disabled={!canManage || isSavingWorkflow}
                    onChange={(event) => setRequiresExtendedResolution(event.target.checked)}
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">
                      Mark as major or large repair
                    </span>
                    <span className="block text-xs leading-5 text-gray-500 dark:text-gray-400">
                      Use this when the issue needs a longer planned repair window and may need
                      Pending status while work is coordinated.
                    </span>
                  </span>
                </label>

                {workflowMessage ? (
                  <div className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
                    {workflowMessage}
                  </div>
                ) : null}

                <Button onClick={handleUpdate} disabled={!canManage || isSavingWorkflow}>
                  {isSavingWorkflow ? "Saving..." : "Save workflow changes"}
                </Button>
              </div>
            )}
          </ComponentCard>

          <ComponentCard title="Attachments" desc="Upload photos, PDFs, or supporting files.">
            <div className="space-y-4">
              <input
                type="file"
                multiple
                className={fieldClassName}
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.length) {
                    void handleUpload(files);
                  }
                }}
              />
              <div className="space-y-3">
                {ticket.attachments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    No attachments yet.
                  </div>
                ) : (
                  ticket.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {attachment.originalName}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Uploaded by {attachment.uploadedBy?.fullName ?? "Unknown"} on{" "}
                        {formatDateTime(attachment.uploadedAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}
