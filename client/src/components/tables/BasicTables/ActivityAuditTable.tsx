import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import LoadingIndicator from "../../common/LoadingIndicator";
import {
  fetchActivityAuditLog,
  formatActivityRoleSummary,
  formatActivityTimestamp,
  getActivityEventBadgeColor,
  getActivityEventLabel,
  type ActivityFeedItem,
} from "../../../lib/activity";

const tableColumnCount = 5;

export default function ActivityAuditTable() {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const abortController = new AbortController();

    const loadAuditLog = async () => {
      try {
        setIsLoading(true);
        setError("");
        const auditItems = await fetchActivityAuditLog(50, abortController.signal);
        setItems(auditItems);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError("Cannot reach the server to load the audit log.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadAuditLog();

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="border-b border-gray-100 dark:border-gray-800">
            <TableCell
              isHeader
              className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              Event
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              Actor
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              Affected User
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              Role Details
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              Time
            </TableCell>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={tableColumnCount} className="px-5 py-10">
                <LoadingIndicator
                  className="justify-center"
                  label="Loading audit log"
                  description="Fetching the latest activity history."
                />
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={tableColumnCount}
                className="px-5 py-8 text-center text-sm text-error-600 dark:text-error-400"
              >
                {error}
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={tableColumnCount}
                className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                No audit events have been recorded yet.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow
                key={item.id}
                className="border-b border-gray-100 align-top dark:border-gray-800"
              >
                <TableCell className="px-5 py-4">
                  <div className="space-y-2">
                    <Badge
                      size="sm"
                      color={getActivityEventBadgeColor(item.eventType)}
                    >
                      {getActivityEventLabel(item.eventType)}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {item.message}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-medium">
                    {item.actorDisplayName ?? item.actorEmail ?? "System"}
                  </p>
                  {item.actorEmail ? (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.actorEmail}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-medium">
                    {item.subjectDisplayName ?? item.subjectEmail ?? "Unknown user"}
                  </p>
                  {item.subjectEmail ? (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.subjectEmail}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                  <p>{formatActivityRoleSummary(item)}</p>
                  {item.roleRequestStatus ? (
                    <p className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Request status: {item.roleRequestStatus}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {formatActivityTimestamp(item.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
