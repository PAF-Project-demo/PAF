import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import LoadingIndicator from "../common/LoadingIndicator";
import Badge from "../ui/badge/Badge";
import {
  fetchActivityNotifications,
  formatRelativeActivityTime,
  getActivityEventBadgeColor,
  getActivityEventLabel,
  markActivityNotificationsAsRead,
  type ActivityFeedItem,
} from "../../lib/activity";
import { AUTH_CHANGE_EVENT, getStoredAuthSession, isAdminRole } from "../../lib/auth";

const pollIntervalMs = 30000;

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [authSession, setAuthSession] = useState(() => getStoredAuthSession());
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);

  const isAdmin = isAdminRole(authSession?.role);
  const destinationPath = isAdmin ? "/audit-log" : "/role-requests";

  useEffect(() => {
    const syncAuthSession = () => {
      setAuthSession(getStoredAuthSession());
    };

    window.addEventListener(AUTH_CHANGE_EVENT, syncAuthSession);
    window.addEventListener("storage", syncAuthSession);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, syncAuthSession);
      window.removeEventListener("storage", syncAuthSession);
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const abortController = new AbortController();

    const loadNotifications = async (signal?: AbortSignal) => {
      if (!authSession?.userId) {
        if (!isActive) {
          return;
        }

        setItems([]);
        setUnreadCount(0);
        setError("");
        setIsLoading(false);
        return;
      }

      try {
        if (isActive) {
          setIsLoading(true);
          setError("");
        }

        const feed = await fetchActivityNotifications(8, signal);
        if (!isActive) {
          return;
        }

        setItems(feed.items);
        setUnreadCount(feed.unreadCount);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        if (!isActive) {
          return;
        }

        setError("Unable to load activity notifications right now.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadNotifications(abortController.signal);
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, pollIntervalMs);

    return () => {
      isActive = false;
      abortController.abort();
      window.clearInterval(intervalId);
    };
  }, [authSession?.userId, refreshVersion]);

  useEffect(() => {
    if (!isOpen || unreadCount === 0 || !authSession?.userId) {
      return;
    }

    let isActive = true;

    const markAsRead = async () => {
      try {
        await markActivityNotificationsAsRead();
        if (!isActive) {
          return;
        }

        setUnreadCount(0);
        setItems((currentItems) =>
          currentItems.map((item) => ({
            ...item,
            read: true,
          }))
        );
      } catch {
        // Keep the current unread state if the server update fails.
      }
    };

    void markAsRead();

    return () => {
      isActive = false;
    };
  }, [isOpen, unreadCount, authSession?.userId]);

  const toggleDropdown = () => {
    setIsOpen((currentValue) => {
      const nextValue = !currentValue;
      if (nextValue) {
        setRefreshVersion((currentVersion) => currentVersion + 1);
      }
      return nextValue;
    });
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
        aria-label="Open notifications"
      >
        {unreadCount > 0 ? (
          <span className="absolute right-0 top-0 z-10 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}

        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[230px] mt-[17px] flex h-[500px] w-[360px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[380px] lg:right-0"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <div>
            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Notifications
            </h5>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Stored activity history for requests and role changes.
            </p>
          </div>
          {unreadCount > 0 ? (
            <Badge size="sm" color="warning">
              {unreadCount} new
            </Badge>
          ) : null}
        </div>

        {!authSession ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              Sign in to view your activity history.
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Notifications are saved per user, so your request history appears after authentication.
            </p>
            <Link
              to="/signin"
              onClick={closeDropdown}
              className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white"
            >
              Go to sign in
            </Link>
          </div>
        ) : isLoading && items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingIndicator
              layout="stacked"
              label="Loading notifications"
              description="Fetching the latest activity updates."
            />
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                No activity yet
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                New role requests, approvals, rejections, and admin role changes will appear here.
              </p>
            </div>
          </div>
        ) : (
          <ul className="flex flex-1 flex-col overflow-y-auto custom-scrollbar">
            {items.map((item) => (
              <li key={item.id}>
                <div className="rounded-xl border-b border-gray-100 px-4 py-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-white/80">
                      {getActivityEventLabel(item.eventType)
                        .split(" ")
                        .map((segment) => segment.charAt(0))
                        .join("")
                        .slice(0, 2)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {item.message}
                          </p>
                        </div>
                        {!item.read ? (
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" />
                        ) : null}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <Badge
                          size="sm"
                          color={getActivityEventBadgeColor(item.eventType)}
                        >
                          {getActivityEventLabel(item.eventType)}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatRelativeActivityTime(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
          <DropdownItem
            tag="a"
            to={destinationPath}
            onItemClick={closeDropdown}
            className="flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-700 dark:text-brand-300 dark:hover:bg-brand-500/10"
          >
            {isAdmin ? "View Full Audit Log" : "View My Role Requests"}
          </DropdownItem>
        </div>
      </Dropdown>
    </div>
  );
}
