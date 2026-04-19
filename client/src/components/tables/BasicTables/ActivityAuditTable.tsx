import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import "flatpickr/dist/flatpickr.min.css";
import Flatpickr from "react-flatpickr";
import Label from "../../form/Label";
import Input from "../../form/input/InputField";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import Button from "../../ui/button/Button";
import LoadingIndicator from "../../common/LoadingIndicator";
import {
  apiFetch,
  AUTH_CHANGE_EVENT,
  formatRoleLabel,
  parseResponsePayload,
} from "../../../lib/auth";
import {
  ArrowRightIcon,
  CalenderIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
} from "../../../icons";
import {
  fetchActivityAuditLog,
  formatActivityRoleSummary,
  formatRelativeActivityTime,
  formatActivityTimestamp,
  getActivityEventBadgeColor,
  getActivityEventLabel,
  type ActivityEventTypeValue,
  type ActivityFeedItem,
  type RoleRequestStatusValue,
} from "../../../lib/activity";

const tableColumnCount = 5;
const rowsPerPageOptions = [10, 20, 50] as const;
const maxVisiblePaginationButtons = 5;
const maxUserSuggestions = 6;

type AuditUserApiItem = {
  id: string;
  email: string;
  displayName?: string | null;
};

type AuditUserSuggestion = {
  id: string;
  email: string;
  displayName: string;
};

const eventTypeOptions: ActivityEventTypeValue[] = [
  "ROLE_REQUEST_CREATED",
  "ROLE_REQUEST_UPDATED",
  "ROLE_REQUEST_DELETED",
  "ROLE_REQUEST_APPROVED",
  "ROLE_REQUEST_REJECTED",
  "USER_ROLE_CHANGED",
];

const getStatusBadgeColor = (status: RoleRequestStatusValue) => {
  switch (status) {
    case "APPROVED":
      return "success" as const;
    case "REJECTED":
      return "error" as const;
    case "PENDING":
      return "warning" as const;
    default:
      return "light" as const;
  }
};

const isAuditUserApiItem = (value: unknown): value is AuditUserApiItem => {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      typeof value.id === "string" &&
      "email" in value &&
      typeof value.email === "string"
  );
};

const normalizeAuditUser = (user: AuditUserApiItem): AuditUserSuggestion => ({
  id: user.id,
  email: user.email.trim(),
  displayName:
    typeof user.displayName === "string" && user.displayName.trim()
      ? user.displayName.trim()
      : user.email.trim(),
});

const getVisiblePageNumbers = (currentPage: number, totalPages: number) => {
  if (totalPages <= maxVisiblePaginationButtons) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const tentativeStartPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(
    totalPages,
    tentativeStartPage + maxVisiblePaginationButtons - 1
  );
  const startPage = Math.max(1, endPage - maxVisiblePaginationButtons + 1);

  return Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index
  );
};

export default function ActivityAuditTable() {
  const location = useLocation();
  const [auditRefreshNonce, setAuditRefreshNonce] = useState(0);
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [searchSourceUsers, setSearchSourceUsers] = useState<AuditUserSuggestion[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState<ActivityEventTypeValue | "">("");
  const [actorSearch, setActorSearch] = useState("");
  const [affectedUserSearch, setAffectedUserSearch] = useState("");
  const [selectedActorUser, setSelectedActorUser] =
    useState<AuditUserSuggestion | null>(null);
  const [selectedAffectedUser, setSelectedAffectedUser] =
    useState<AuditUserSuggestion | null>(null);
  const [activeSuggestionField, setActiveSuggestionField] = useState<
    "actor" | "affectedUser" | null
  >(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState<(typeof rowsPerPageOptions)[number]>(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const onAuthChange = () => {
      setAuditRefreshNonce((n) => n + 1);
    };
    window.addEventListener(AUTH_CHANGE_EVENT, onAuthChange);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, onAuthChange);
    };
  }, []);

  useEffect(() => {
    if (location.pathname !== "/audit-log") {
      return;
    }

    const abortController = new AbortController();

    const loadAuditLog = async () => {
      try {
        setIsLoading(true);
        setError("");
        const auditItems = await fetchActivityAuditLog(100, abortController.signal);
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
  }, [location.pathname, auditRefreshNonce]);

  useEffect(() => {
    const abortController = new AbortController();

    const loadSearchSourceUsers = async () => {
      try {
        const response = await apiFetch("/api/users", {
          signal: abortController.signal,
        });
        const rawResponse = await response.text();
        const payload = parseResponsePayload<unknown>(rawResponse);

        if (!response.ok || !Array.isArray(payload) || !payload.every(isAuditUserApiItem)) {
          setSearchSourceUsers([]);
          return;
        }

        setSearchSourceUsers(payload.map(normalizeAuditUser));
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setSearchSourceUsers([]);
      }
    };

    void loadSearchSourceUsers();

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    eventTypeFilter,
    actorSearch,
    affectedUserSearch,
    dateFrom,
    dateTo,
    rowsPerPage,
    selectedActorUser,
    selectedAffectedUser,
  ]);

  const handleActorSearchChange = (value: string) => {
    setActorSearch(value);
    setSelectedActorUser(null);
  };

  const handleAffectedUserSearchChange = (value: string) => {
    setAffectedUserSearch(value);
    setSelectedAffectedUser(null);
  };

  const handleUserSuggestionSelect = (
    field: "actor" | "affectedUser",
    user: AuditUserSuggestion
  ) => {
    if (field === "actor") {
      setActorSearch(user.displayName);
      setSelectedActorUser(user);
    } else {
      setAffectedUserSearch(user.displayName);
      setSelectedAffectedUser(user);
    }

    setActiveSuggestionField(null);
  };

  const getUserSuggestions = (query: string) => {
    const normalizedQuery = query.trim().toLowerCase();

    const seenUserIds = new Set<string>();

    return searchSourceUsers
      .filter((user) => {
        if (!normalizedQuery) {
          return true;
        }

        const displayName = user.displayName.toLowerCase();
        const email = user.email.toLowerCase();
        return displayName.includes(normalizedQuery) || email.includes(normalizedQuery);
      })
      .filter((user) => {
        if (seenUserIds.has(user.id)) {
          return false;
        }

        seenUserIds.add(user.id);
        return true;
      })
      .slice(0, maxUserSuggestions);
  };

  const actorSuggestions = getUserSuggestions(actorSearch);
  const affectedUserSuggestions = getUserSuggestions(affectedUserSearch);
  const showActorSuggestions =
    activeSuggestionField === "actor" && actorSuggestions.length > 0;
  const showAffectedUserSuggestions =
    activeSuggestionField === "affectedUser" && affectedUserSuggestions.length > 0;

  const hasActiveFilters = Boolean(
    eventTypeFilter || actorSearch.trim() || affectedUserSearch.trim() || dateFrom || dateTo
  );
  const showLoadingState = isLoading || isFiltering;
  const loadingAuditLabel = hasActiveFilters
    ? "Filtering audit log"
    : "Loading audit log";

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setIsFiltering(true);
    const timeoutId = window.setTimeout(() => {
      setIsFiltering(false);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isLoading, eventTypeFilter, actorSearch, affectedUserSearch, dateFrom, dateTo]);

  const filteredItems = items.filter((item) => {
    // Event type filter
    if (eventTypeFilter && item.eventType !== eventTypeFilter) {
      return false;
    }

    // Actor search
    const normalizedActor = actorSearch.trim().toLowerCase();
    if (selectedActorUser) {
      const actorMatchesSelectedUser =
        item.actorUserId === selectedActorUser.id ||
        String(item.actorEmail ?? "").trim().toLowerCase() ===
          selectedActorUser.email.toLowerCase();
      if (!actorMatchesSelectedUser) {
        return false;
      }
    } else if (normalizedActor) {
      const actorMatch = [item.actorDisplayName, item.actorEmail, item.actorUserId]
        .some((value) =>
          String(value ?? "").trim().toLowerCase().includes(normalizedActor)
        );
      if (!actorMatch) {
        return false;
      }
    }

    // Affected user search
    const normalizedAffected = affectedUserSearch.trim().toLowerCase();
    if (selectedAffectedUser) {
      const affectedMatchesSelectedUser =
        item.subjectUserId === selectedAffectedUser.id ||
        String(item.subjectEmail ?? "").trim().toLowerCase() ===
          selectedAffectedUser.email.toLowerCase();
      if (!affectedMatchesSelectedUser) {
        return false;
      }
    } else if (normalizedAffected) {
      const affectedMatch = [item.subjectDisplayName, item.subjectEmail, item.subjectUserId]
        .some((value) =>
          String(value ?? "").trim().toLowerCase().includes(normalizedAffected)
        );
      if (!affectedMatch) {
        return false;
      }
    }

    // Date range filter
    const itemTime = item.createdAt ? new Date(item.createdAt).getTime() : Number.NaN;
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      if (Number.isNaN(itemTime) || itemTime < from) return false;
    }
    if (dateTo) {
      // Include the full "to" day by setting time to end of day
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (Number.isNaN(itemTime) || itemTime > to.getTime()) return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * rowsPerPage;
  const visibleItems = filteredItems.slice(startIndex, startIndex + rowsPerPage);
  const visiblePageNumbers = getVisiblePageNumbers(activePage, totalPages);
  const rangeStart = filteredItems.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + rowsPerPage, filteredItems.length);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const clearFilters = () => {
    setEventTypeFilter("");
    setActorSearch("");
    setAffectedUserSearch("");
    setSelectedActorUser(null);
    setSelectedAffectedUser(null);
    setActiveSuggestionField(null);
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const renderTableBody = () => {
    if (showLoadingState) {
      return (
        <TableRow>
          <TableCell colSpan={tableColumnCount} className="px-5 py-10">
            <LoadingIndicator
              className="mx-auto"
              layout="stacked"
              size="md"
              label={loadingAuditLabel}
              description="Please wait while the latest activity history is prepared."
            />
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell
            colSpan={tableColumnCount}
            className="px-5 py-8 text-center text-sm text-error-600 dark:text-error-400"
          >
            {error}
          </TableCell>
        </TableRow>
      );
    }

    if (items.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={tableColumnCount}
            className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            No audit events have been recorded yet.
          </TableCell>
        </TableRow>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={tableColumnCount} className="px-5 py-10">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                No audit events matched your current filters.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search or reset the filters.
              </p>
              <Button size="sm" variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return visibleItems.map((item) => (
      <TableRow key={item.id} className="align-top">
        <TableCell className="px-5 py-4">
          <div className="space-y-3">
            <Badge size="sm" color={getActivityEventBadgeColor(item.eventType)}>
              {getActivityEventLabel(item.eventType)}
            </Badge>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {item.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                {item.message}
              </p>
              {item.roleRequestId ? (
                <p className="mt-2 break-all text-xs text-gray-400 dark:text-gray-500">
                  Request ID: {item.roleRequestId}
                </p>
              ) : null}
            </div>
          </div>
        </TableCell>

        <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-medium text-gray-800 dark:text-white/90">
            {item.actorDisplayName ?? item.actorEmail ?? "System"}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {item.actorEmail ?? "Internal system action"}
          </p>
        </TableCell>

        <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-medium text-gray-800 dark:text-white/90">
            {item.subjectDisplayName ?? item.subjectEmail ?? "Unknown user"}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {item.subjectEmail ?? "No email recorded"}
          </p>
        </TableCell>

        <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-medium text-gray-800 dark:text-white/90">
            {formatActivityRoleSummary(item)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {item.roleRequestStatus ? (
              <Badge size="sm" color={getStatusBadgeColor(item.roleRequestStatus)}>
                {formatRoleLabel(item.roleRequestStatus)}
              </Badge>
            ) : (
              <Badge size="sm" color="light">
                No request status
              </Badge>
            )}
          </div>
        </TableCell>

        <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-medium text-gray-800 dark:text-white/90">
            {formatActivityTimestamp(item.createdAt)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formatRelativeActivityTime(item.createdAt)}
          </p>
        </TableCell>
      </TableRow>
    ));
  };

  const renderPagination = () => {
    if (showLoadingState || error || filteredItems.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 dark:border-white/[0.05] sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            Showing {rangeStart}-{rangeEnd} of {filteredItems.length} matching event
            {filteredItems.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Page {activePage} of {totalPages}
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Label htmlFor="audit-rows-per-page" className="mb-0 whitespace-nowrap">
              Rows per page
            </Label>
            <div className="relative min-w-[130px]">
              <select
                id="audit-rows-per-page"
                name="audit-rows-per-page"
                value={rowsPerPage}
                onChange={(event) =>
                  setRowsPerPage(
                    Number(event.target.value) as (typeof rowsPerPageOptions)[number]
                  )
                }
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                {rowsPerPageOptions.map((pageSize) => (
                  <option
                    key={pageSize}
                    value={pageSize}
                    className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                  >
                    {pageSize} rows
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <ChevronDownIcon className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={activePage === 1}
              startIcon={<ChevronLeftIcon className="h-4 w-4" />}
            >
              Previous
            </Button>

            {visiblePageNumbers[0] > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="flex h-10 min-w-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                >
                  1
                </button>
                {visiblePageNumbers[0] > 2 ? (
                  <span className="px-1 text-sm text-gray-400">...</span>
                ) : null}
              </>
            ) : null}

            {visiblePageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={`flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${
                  pageNumber === activePage
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                }`}
                aria-current={pageNumber === activePage ? "page" : undefined}
              >
                {pageNumber}
              </button>
            ))}

            {visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages ? (
              <>
                {visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages - 1 ? (
                  <span className="px-1 text-sm text-gray-400">...</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className="flex h-10 min-w-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                >
                  {totalPages}
                </button>
              </>
            ) : null}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={activePage === totalPages}
              endIcon={<ArrowRightIcon className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderUserSuggestions = (
    field: "actor" | "affectedUser",
    suggestions: AuditUserSuggestion[]
  ) => {
    if (suggestions.length === 0) {
      return null;
    }

    return (
      <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
        {suggestions.map((suggestion) => (
          <button
            key={`${field}-${suggestion.id}`}
            type="button"
            className="flex w-full flex-col items-start px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
            onMouseDown={(event) => {
              event.preventDefault();
              handleUserSuggestionSelect(field, suggestion);
            }}
          >
            <span className="font-medium text-gray-800 dark:text-white/90">
              {suggestion.displayName}
            </span>
            <span className="mt-1 text-xs text-gray-400">{suggestion.email}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Filter Bar */}
      <div className="border-b border-gray-100 px-5 py-5 dark:border-white/[0.05] sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">

          {/* Event Type Dropdown */}
          <div>
            <Label htmlFor="audit-event-filter" className="mb-2">
              Event
            </Label>
            <div className="relative">
              <select
                id="audit-event-filter"
                name="audit-event-filter"
                value={eventTypeFilter}
                onChange={(event) =>
                  setEventTypeFilter(event.target.value as ActivityEventTypeValue | "")
                }
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="" className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                  All events
                </option>
                {eventTypeOptions.map((eventTypeOption) => (
                  <option
                    key={eventTypeOption}
                    value={eventTypeOption}
                    className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                  >
                    {getActivityEventLabel(eventTypeOption)}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <ChevronDownIcon className="h-4 w-4" />
              </span>
            </div>
          </div>

          {/* Actor Search */}
          <div>
            <Label htmlFor="audit-actor-search" className="mb-2">
              Actor
            </Label>
            <div className="relative">
              <Input
                id="audit-actor-search"
                name="audit-actor-search"
                value={actorSearch}
                onChange={(event) => handleActorSearchChange(event.target.value)}
                onFocus={() => setActiveSuggestionField("actor")}
                onBlur={() => setActiveSuggestionField(null)}
                autoComplete="off"
                placeholder="Search by actor name or email"
              />
              {showActorSuggestions
                ? renderUserSuggestions("actor", actorSuggestions)
                : null}
            </div>
          </div>

          {/* Affected User Search */}
          <div>
            <Label htmlFor="audit-affected-search" className="mb-2">
              Affected User
            </Label>
            <div className="relative">
              <Input
                id="audit-affected-search"
                name="audit-affected-search"
                value={affectedUserSearch}
                onChange={(event) =>
                  handleAffectedUserSearchChange(event.target.value)
                }
                onFocus={() => setActiveSuggestionField("affectedUser")}
                onBlur={() => setActiveSuggestionField(null)}
                autoComplete="off"
                placeholder="Search by affected user name or email"
              />
              {showAffectedUserSuggestions
                ? renderUserSuggestions("affectedUser", affectedUserSuggestions)
                : null}
            </div>
          </div>

          {/* Date From */}
          <div>
            <Label htmlFor="audit-date-from" className="mb-2">
              From
            </Label>
            <div className="relative w-full flatpickr-wrapper">
              <Flatpickr
                value={dateFrom}
                onChange={(_, selectedDate) => setDateFrom(selectedDate)}
                options={{
                  dateFormat: "Y-m-d",
                  maxDate: dateTo || undefined,
                }}
                placeholder="Select start date"
                className="h-11 w-full rounded-lg border appearance-none bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <CalenderIcon className="size-5" />
              </span>
            </div>
          </div>

          {/* Date To */}
          <div>
            <Label htmlFor="audit-date-to" className="mb-2">
              To
            </Label>
            <div className="relative w-full flatpickr-wrapper">
              <Flatpickr
                value={dateTo}
                onChange={(_, selectedDate) => setDateTo(selectedDate)}
                options={{
                  dateFormat: "Y-m-d",
                  minDate: dateFrom || undefined,
                }}
                placeholder="Select end date"
                className="h-11 w-full rounded-lg border appearance-none bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <CalenderIcon className="size-5" />
              </span>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <Button
              size="sm"
              variant="outline"
              className="w-full xl:w-auto"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              Clear
            </Button>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {showLoadingState
            ? hasActiveFilters
              ? "Applying your filters to the audit history."
              : "Loading the most recent audit history."
            : error
            ? "Audit history is unavailable right now."
            : `Loaded ${items.length} audit event${items.length === 1 ? "" : "s"}.${
                hasActiveFilters
                  ? ` ${filteredItems.length} match${filteredItems.length === 1 ? "" : "es"} current filters.`
                  : ""
              }`}
        </p>
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1080px]">
          <Table className="min-w-full">
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Event
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Actor
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Affected User
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Role Details
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Time
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {renderTableBody()}
            </TableBody>
          </Table>
        </div>
      </div>

      {renderPagination()}
    </div>
  );
}
