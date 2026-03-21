import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import {
  authApiBaseUrl,
  getStoredAuthSession,
  parseResponsePayload,
} from "../../../lib/auth";

type UserTableItem = {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string | null;
  provider?: string | null;
  role?: string | null;
  createdAt?: string | null;
};

const tableColumnCount = 5;

const formatJoinedDate = (createdAt?: string | null) => {
  if (!createdAt) {
    return "Unavailable";
  }

  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "dark" as const;
    case "USER":
      return "primary" as const;
    default:
      return "info" as const;
  }
};

const getUserInitials = (displayName: string, email: string) => {
  const source = displayName.trim() || email.trim();
  const words = source.split(/[\s@._-]+/).filter(Boolean);

  if (words.length === 0) {
    return "U";
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

export default function BasicTableOne() {
  const [users, setUsers] = useState<UserTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const abortController = new AbortController();

    const loadUsers = async () => {
      try {
        setIsLoading(true);
        setError("");

        const authSession = getStoredAuthSession();
        if (!authSession?.userId) {
          setError("You must be signed in as an admin to view users.");
          return;
        }

        const response = await fetch(`${authApiBaseUrl}/api/users`, {
          signal: abortController.signal,
          headers: {
            "X-Auth-User-Id": authSession.userId,
          },
        });
        const rawResponse = await response.text();
        const payload = parseResponsePayload<
          UserTableItem[] | { message?: string }
        >(rawResponse);

        if (!response.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "message" in payload &&
            typeof payload.message === "string"
              ? payload.message
              : "Unable to load users right now.";
          setError(message);
          return;
        }

        if (!Array.isArray(payload)) {
          setError("The server returned an invalid users response.");
          return;
        }

        setUsers(
          payload.map((user) => ({
            id: user.id,
            email: user.email,
            displayName:
              typeof user.displayName === "string" && user.displayName.trim()
                ? user.displayName.trim()
                : user.email,
            photoUrl:
              typeof user.photoUrl === "string" && user.photoUrl.trim()
                ? user.photoUrl
                : null,
            provider:
              typeof user.provider === "string" && user.provider.trim()
                ? user.provider.toUpperCase()
                : "LOCAL",
            role:
              typeof user.role === "string" && user.role.trim()
                ? user.role.toUpperCase()
                : "USER",
            createdAt: user.createdAt ?? null,
          }))
        );
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setError("Cannot reach the server to load users.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadUsers();

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[760px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  User
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Email
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Provider
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Role
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Joined
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColumnCount}
                    className="px-5 py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : null}

              {!isLoading && error ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColumnCount}
                    className="px-5 py-6 text-center text-theme-sm text-error-600 dark:text-error-400"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : null}

              {!isLoading && !error && users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColumnCount}
                    className="px-5 py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                  >
                    No users have signed in yet.
                  </TableCell>
                </TableRow>
              ) : null}

              {!isLoading &&
                !error &&
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        {user.photoUrl ? (
                          <div className="h-10 w-10 overflow-hidden rounded-full">
                            <img
                              width={40}
                              height={40}
                              src={user.photoUrl}
                              alt={user.displayName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-theme-sm font-semibold text-brand-500 dark:bg-brand-500/20 dark:text-brand-400">
                            {getUserInitials(user.displayName, user.email)}
                          </div>
                        )}
                        <div>
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {user.displayName}
                          </span>
                          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                            {user.displayName === user.email
                              ? "Using email as display name"
                              : "Display name available"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                      {user.provider}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                      <Badge
                        size="sm"
                        variant="solid"
                        color={getRoleBadgeColor(user.role ?? "USER")}
                      >
                        {user.role ?? "USER"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                      {formatJoinedDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
