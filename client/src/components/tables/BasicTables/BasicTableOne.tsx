import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { PencilIcon } from "../../../icons";
import Badge from "../../ui/badge/Badge";
import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";
import { useModal } from "../../../hooks/useModal";
import {
  authApiBaseUrl,
  getStoredAuthSession,
  isAdminRole,
  parseResponsePayload,
  replaceStoredAuthSession,
} from "../../../lib/auth";

type UserRoleValue = "USER" | "TECHNICIAN" | "MANAGER" | "ADMIN";

type UserTableApiItem = {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string | null;
  provider?: string | null;
  role?: string | null;
  createdAt?: string | null;
};

type UserTableItem = {
  id: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  provider: string;
  role: UserRoleValue;
  createdAt: string | null;
};

const availableRoles: UserRoleValue[] = [
  "USER",
  "TECHNICIAN",
  "MANAGER",
  "ADMIN",
];

const roleDescriptions: Record<UserRoleValue, string> = {
  USER: "Default application access for signed-in users.",
  TECHNICIAN: "Operational access for technical and support work.",
  MANAGER: "Management access for coordination and oversight.",
  ADMIN: "Full administrative access to protected features.",
};

const tableColumnCount = 6;

const normalizeRole = (role?: string | null): UserRoleValue => {
  const normalizedRole =
    typeof role === "string" ? role.trim().toUpperCase() : "";

  return availableRoles.includes(normalizedRole as UserRoleValue)
    ? (normalizedRole as UserRoleValue)
    : "USER";
};

const normalizeUser = (user: UserTableApiItem): UserTableItem => ({
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
  role: normalizeRole(user.role),
  createdAt: user.createdAt ?? null,
});

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

const getRoleBadgeColor = (role: UserRoleValue) => {
  switch (role) {
    case "ADMIN":
      return "dark" as const;
    case "MANAGER":
      return "warning" as const;
    case "TECHNICIAN":
      return "success" as const;
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

const isUserTableApiItem = (value: unknown): value is UserTableApiItem => {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      typeof value.id === "string" &&
      "email" in value &&
      typeof value.email === "string"
  );
};

export default function BasicTableOne() {
  const navigate = useNavigate();
  const { isOpen, openModal, closeModal } = useModal();
  const [users, setUsers] = useState<UserTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserTableItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRoleValue>("USER");
  const [roleError, setRoleError] = useState("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const resetRoleModal = () => {
    closeModal();
    setSelectedUser(null);
    setSelectedRole("USER");
    setRoleError("");
    setIsUpdatingRole(false);
  };

  const handleCloseRoleModal = () => {
    if (isUpdatingRole) {
      return;
    }

    resetRoleModal();
  };

  const handleOpenRoleModal = (user: UserTableItem) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setRoleError("");
    openModal();
  };

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
          UserTableApiItem[] | { message?: string }
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

        setUsers(payload.map(normalizeUser));
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

  const handleAssignRole = async () => {
    if (!selectedUser) {
      return;
    }

    const authSession = getStoredAuthSession();
    if (!authSession?.userId) {
      setRoleError("You must be signed in as an admin to update roles.");
      return;
    }

    setIsUpdatingRole(true);
    setRoleError("");

    try {
      const response = await fetch(
        `${authApiBaseUrl}/api/users/${selectedUser.id}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Auth-User-Id": authSession.userId,
          },
          body: JSON.stringify({
            role: selectedRole,
          }),
        }
      );

      const rawResponse = await response.text();
      const payload = parseResponsePayload<
        UserTableApiItem | { message?: string }
      >(rawResponse);

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof payload.message === "string"
            ? payload.message
            : "Unable to update the user role right now.";
        setRoleError(message);
        setIsUpdatingRole(false);
        return;
      }

      if (!isUserTableApiItem(payload)) {
        setRoleError("The server returned an invalid role update response.");
        setIsUpdatingRole(false);
        return;
      }

      const updatedUser = normalizeUser(payload);

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        )
      );

      if (authSession.userId === updatedUser.id) {
        replaceStoredAuthSession({
          ...authSession,
          role: updatedUser.role,
        });

        if (!isAdminRole(updatedUser.role)) {
          resetRoleModal();
          navigate("/", { replace: true });
          return;
        }
      }

      resetRoleModal();
    } catch {
      setRoleError("Cannot reach the server to update the role.");
      setIsUpdatingRole(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[980px]">
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
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Action
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
                          color={getRoleBadgeColor(user.role)}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                        {formatJoinedDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <Button
                          size="sm"
                          variant="primary"
                          startIcon={<PencilIcon className="h-4 w-4" />}
                          className="whitespace-nowrap"
                          onClick={() => handleOpenRoleModal(user)}
                        >
                          Assign Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseRoleModal}
        className="m-4 max-w-[560px]"
      >
        <div className="px-6 py-7 sm:px-8">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Assign Role
            </h3>
            {selectedUser ? (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Choose the role for{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {selectedUser.displayName}
                </span>{" "}
                ({selectedUser.email}).
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            {availableRoles.map((roleOption) => {
              const isSelected = selectedRole === roleOption;

              return (
                <button
                  key={roleOption}
                  type="button"
                  onClick={() => setSelectedRole(roleOption)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                      : "border-gray-200 hover:border-brand-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-brand-500/40 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="pr-4">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {roleOption}
                      </span>
                      <Badge
                        size="sm"
                        variant="solid"
                        color={getRoleBadgeColor(roleOption)}
                      >
                        {roleOption}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {roleDescriptions[roleOption]}
                    </p>
                  </div>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                      isSelected
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-gray-300 text-transparent dark:border-gray-700"
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.667 3.5L5.25033 9.91667L2.33366 7"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>

          {roleError ? (
            <div className="mt-5 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {roleError}
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCloseRoleModal}
              disabled={isUpdatingRole}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAssignRole}
              disabled={isUpdatingRole}
            >
              {isUpdatingRole ? "Saving..." : "Assign Role"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
