import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import LoadingIndicator from "../../components/common/LoadingIndicator";
import { Resource, fetchResources } from "../../lib/resourceService";
import { getStoredAuthSession, isAdminRole } from "../../lib/auth";
import BookingForm from "./BookingForm";
import MyBookings from "./MyBookings";
import AdminBookingPanel from "./AdminBookingPanel";
import BookingCalendar from "./BookingCalendar";

type TabType = "book" | "my-bookings" | "admin-panel" | "calendar";

export default function ResourceBookingPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("book");
  
  const authSession = getStoredAuthSession();
  const isAdmin = isAdminRole(authSession?.role);

  useEffect(() => {
    const loadActiveResources = async () => {
      try {
        setIsLoading(true);
        // Fetch all resources and filter for ACTIVE ones
        const allResources = await fetchResources();
        const activeResources = allResources.filter((r) => r.status === "ACTIVE");
        setResources(activeResources);
      } catch (err) {
        setError("Failed to load resources");
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveResources();
  }, []);

  return (
    <>
      <PageMeta title="Resource Booking | Campus Hub" description="Book campus resources" />
      <PageBreadcrumb pageTitle="Resource Booking" />

      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="overflow-x-auto border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4 pb-0">
            <button
              onClick={() => setActiveTab("book")}
              className={`whitespace-nowrap px-4 py-2 font-medium transition ${
                activeTab === "book"
                  ? "border-b-2 border-brand-500 text-brand-500"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Book Resource
            </button>
            <button
              onClick={() => setActiveTab("my-bookings")}
              className={`whitespace-nowrap px-4 py-2 font-medium transition ${
                activeTab === "my-bookings"
                  ? "border-b-2 border-brand-500 text-brand-500"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              My Bookings
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`whitespace-nowrap px-4 py-2 font-medium transition ${
                activeTab === "calendar"
                  ? "border-b-2 border-brand-500 text-brand-500"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Calendar
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin-panel")}
                className={`whitespace-nowrap px-4 py-2 font-medium transition ${
                  activeTab === "admin-panel"
                    ? "border-b-2 border-brand-500 text-brand-500"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Admin Panel
              </button>
            )}
          </div>
        </div>

        {/* Book Resource Tab */}
        {activeTab === "book" && (
          <ComponentCard title="Book a Resource" desc="Select a resource and create your booking">
            {isLoading ? (
              <LoadingIndicator label="Loading resources..." />
            ) : error ? (
              <div className="rounded-lg bg-error-50 p-4 text-error-700 dark:bg-error-950 dark:text-error-300">
                {error}
              </div>
            ) : (
              <BookingForm resources={resources} />
            )}
          </ComponentCard>
        )}

        {/* My Bookings Tab */}
        {activeTab === "my-bookings" && <MyBookings />}

        {/* Calendar Tab */}
        {activeTab === "calendar" && <BookingCalendar />}

        {/* Admin Panel Tab */}
        {activeTab === "admin-panel" && isAdmin && <AdminBookingPanel />}
      </div>
    </>
  );
}
