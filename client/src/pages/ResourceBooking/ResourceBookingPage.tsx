import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import LoadingIndicator from "../../components/common/LoadingIndicator";
import Button from "../../components/ui/button/Button";
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

  const loadActiveResources = async () => {
    try {
      setIsLoading(true);
      setError("");
      // Fetch all resources and filter for ACTIVE ones
      const allResources = await fetchResources();
      const activeResources = allResources.filter((r) => r.status === "ACTIVE");
      setResources(activeResources);
      
      if (activeResources.length === 0) {
        setError("No resources available. Create sample resources to get started.");
      }
    } catch (err: any) {
      console.error("Error loading resources:", err);
      setError(err.message || "Failed to load resources. Please ensure you are logged in.");
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSampleResources = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch("http://localhost:8081/api/resources/init-samples", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const responseData = await response.json();
      console.log("Init resources response:", responseData);
      
      if (response.ok && responseData.success) {
        // Wait a moment then reload
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadActiveResources();
      } else {
        console.log("Sample resources already exist or error occurred");
        // Still try to load resources
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadActiveResources();
      }
    } catch (err: any) {
      console.error("Failed to initialize resources:", err);
      setError("Failed to create sample resources: " + (err.message || "Unknown error"));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveResources();
  }, []);

  return (
    <>
      <PageMeta title="EduNexus" description="EduNexus - Student Management System" />
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
            ) : (
              <>
                {error && (
                  <div className="mb-6 space-y-4">
                    <div className="rounded-lg bg-warning-50 p-4 text-warning-700 dark:bg-warning-950 dark:text-warning-300">
                      <p className="font-medium">{error}</p>
                      <p className="mt-2 text-sm">
                        Click the button below to create sample resources, or go to <span className="font-semibold">Facilities & Assets</span> to add your own.
                      </p>
                    </div>
                    <Button 
                      onClick={initializeSampleResources}
                      className="w-full sm:w-auto"
                    >
                      Create Sample Resources
                    </Button>
                  </div>
                )}
                <BookingForm resources={resources} />
              </>
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
