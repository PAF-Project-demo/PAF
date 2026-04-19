import React, { useEffect, useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import LoadingIndicator from "../../components/common/LoadingIndicator";
import Badge from "../../components/ui/badge/Badge";
import { useNotification } from "../../components/common/NotificationProvider";
import { Booking, getUserBookings, cancelBooking, updateBooking } from "../../lib/bookingService";
import { Resource, fetchResources } from "../../lib/resourceService";
import { TrashBinIcon, PencilIcon } from "../../icons";

// Asset type mapping for display
const assetTypeConfig: Record<
  string,
  { label: string; badge: string }
> = {
  LECTURE_HALL: {
    label: "Lecture Hall",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  LAB: {
    label: "Lab",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  MEETING_ROOM: {
    label: "Meeting Room",
    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  EQUIPMENT: {
    label: "Equipment",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  },
};

interface RecurringGroup {
  groupId: string;
  bookings: Booking[];
  isRecurring: boolean;
}

export default function MyBookings() {
  const { showNotification } = useNotification();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Edit modal state
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editFormData, setEditFormData] = useState({
    resourceId: "",
    date: "",
    startTime: "",
    endTime: "",
    purpose: "",
    attendees: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBookingsAndResources();
  }, []);

  const loadBookingsAndResources = async () => {
    try {
      setIsLoading(true);
      const [bookingsData, resourcesData] = await Promise.all([
        getUserBookings(),
        fetchResources(),
      ]);
      setBookings(bookingsData);
      setResources(resourcesData);
    } catch (err) {
      setError("Failed to load your bookings");
    } finally {
      setIsLoading(false);
    }
  };

  // Group recurring bookings
  const getGroupedBookings = (): RecurringGroup[] => {
    const sorted = [...bookings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const groups: RecurringGroup[] = [];
    const processed = new Set<string>();

    for (const booking of sorted) {
      if (processed.has(booking.id)) continue;

      const relatedBookings = sorted.filter(
        (b) =>
          b.resourceId === booking.resourceId &&
          b.startTime === booking.startTime &&
          b.endTime === booking.endTime &&
          b.purpose === booking.purpose &&
          b.attendees === booking.attendees &&
          !processed.has(b.id)
      );

      const isRecurring = relatedBookings.length > 1;
      const groupId = isRecurring
        ? `${booking.resourceId}_${booking.startTime}_${booking.endTime}_${booking.purpose}`
        : booking.id;

      groups.push({
        groupId,
        bookings: relatedBookings,
        isRecurring,
      });

      relatedBookings.forEach((b) => processed.add(b.id));
    }

    return groups;
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      await cancelBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      showNotification({
        title: "Success",
        message: "Booking cancelled successfully",
        variant: "success",
      });
    } catch (err: any) {
      showNotification({
        title: "Error",
        message: err.message || "Failed to cancel booking",
        variant: "error",
      });
    }
  };

  const handleEditClick = (booking: Booking) => {
    setEditingBooking(booking);
    setEditFormData({
      resourceId: booking.resourceId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      purpose: booking.purpose,
      attendees: booking.attendees,
    });
  };

  const handleCloseEditModal = () => {
    setEditingBooking(null);
    setEditFormData({
      resourceId: "",
      date: "",
      startTime: "",
      endTime: "",
      purpose: "",
      attendees: 1,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;

    // Validation
    if (!editFormData.resourceId || !editFormData.date || !editFormData.startTime || !editFormData.endTime || !editFormData.purpose) {
      showNotification({
        title: "Error",
        message: "All fields are required",
        variant: "error",
      });
      return;
    }

    // Get selected resource to check type
    const selectedResource = resources.find((r) => r.id === editFormData.resourceId);

    if (selectedResource?.type !== "EQUIPMENT" && editFormData.attendees < 1) {
      showNotification({
        title: "Error",
        message: "Attendees must be at least 1",
        variant: "error",
      });
      return;
    }

    // Time validation
    if (editFormData.endTime <= editFormData.startTime) {
      showNotification({
        title: "Error",
        message: "End time must be after start time",
        variant: "error",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedBooking = await updateBooking(
        editingBooking.id,
        editFormData.resourceId,
        editFormData.date,
        editFormData.startTime,
        editFormData.endTime,
        editFormData.purpose,
        editFormData.attendees
      );

      setBookings((prev) =>
        prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
      );

      showNotification({
        title: "Success",
        message: "Booking updated successfully",
        variant: "success",
      });

      handleCloseEditModal();
    } catch (err: any) {
      showNotification({
        title: "Error",
        message: err.message || "Failed to update booking",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status: Booking["status"]) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "error";
      case "CANCELLED":
        return "light";
      default:
        return "info";
    }
  };

  const canCancel = (booking: Booking) => {
    return booking.status === "PENDING" || booking.status === "APPROVED";
  };

  const canEdit = (booking: Booking) => {
    return booking.status === "PENDING" || booking.status === "APPROVED";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  const groupedData = getGroupedBookings();

  return (
    <>
      {isLoading ? (
        <ComponentCard title="My Bookings">
          <LoadingIndicator label="Loading your bookings..." />
        </ComponentCard>
      ) : error ? (
        <ComponentCard title="My Bookings">
          <div className="rounded-lg bg-error-50 p-4 text-error-700 dark:bg-error-950 dark:text-error-300">
            {error}
          </div>
        </ComponentCard>
      ) : bookings.length === 0 ? (
        <ComponentCard title="My Bookings">
          <div className="rounded-lg bg-blue-50 p-6 text-center dark:bg-blue-950">
            <p className="text-gray-600 dark:text-gray-400">No bookings yet. Create one to get started!</p>
          </div>
        </ComponentCard>
      ) : (
        <ComponentCard title="My Bookings" desc={`You have ${bookings.length} booking${bookings.length !== 1 ? "s" : ""}`}>
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="border-r border-gray-200 px-2 py-3 text-center dark:border-gray-700 font-semibold" style={{ width: '48px' }}>{" "}</th>
                  <th className="border-r border-gray-200 px-3 py-3 text-left dark:border-gray-700 font-semibold" style={{ width: '120px' }}>Date</th>
                  <th className="border-r border-gray-200 px-3 py-3 text-left dark:border-gray-700 font-semibold" style={{ width: '130px' }}>Time</th>
                  <th className="border-r border-gray-200 px-3 py-3 text-left dark:border-gray-700 font-semibold" style={{ width: '150px' }}>Purpose</th>
                  <th className="border-r border-gray-200 px-3 py-3 text-left dark:border-gray-700 font-semibold" style={{ width: '140px' }}>Resource</th>
                  <th className="border-r border-gray-200 px-3 py-3 text-center dark:border-gray-700 font-semibold" style={{ width: '110px' }}>Type</th>
                  <th className="border-r border-gray-200 px-3 py-3 text-center dark:border-gray-700 font-semibold" style={{ width: '90px' }}>Attendees</th>
                  <th className="border-r border-gray-200 px-3 py-3 text-left dark:border-gray-700 font-semibold" style={{ width: '110px' }}>Status</th>
                  <th className="px-3 py-3 text-center dark:border-gray-700 font-semibold" style={{ width: '70px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {groupedData.map((group) => (
                  <React.Fragment key={group.groupId}>
                    {/* Group Header Row (for recurring bookings) */}
                    {group.isRecurring && (
                      <tr style={{ borderBottom: '2px solid #3b82f6' }} className="bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60">
                        <td style={{ width: '48px', padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #bfdbfe' }} className="dark:border-blue-800">
                          <button
                            onClick={() => toggleGroup(group.groupId)}
                            className="inline-flex items-center justify-center rounded p-1 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                            title={expandedGroups.has(group.groupId) ? "Collapse" : "Expand"}
                          >
                            <span className="text-base font-bold text-blue-700 dark:text-blue-300">
                              {expandedGroups.has(group.groupId) ? "▼" : "▶"}
                            </span>
                          </button>
                        </td>
                        <td colSpan={7} style={{ padding: '12px' }}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-semibold text-blue-900 dark:text-blue-100 text-base">
                                📋 Recurring: <span className="font-bold">{group.bookings[0].purpose}</span>
                              </p>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                📍 <span className="font-semibold">{resources.find(r => r.id === group.bookings[0].resourceId)?.name || 'Unknown Resource'}</span> &nbsp;•&nbsp; ⏰ {group.bookings[0].startTime} - {group.bookings[0].endTime} &nbsp;•&nbsp; 📅 {group.bookings.length} sessions
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Individual Booking Rows */}
                    {(group.isRecurring ? expandedGroups.has(group.groupId) : true) &&
                      group.bookings.map((booking) => (
                        <tr
                          key={booking.id}
                          style={{
                            borderBottom: '1px solid' + (group.isRecurring ? '#dbeafe' : '#e5e7eb')
                          }}
                          className={group.isRecurring ? "bg-white dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:border-blue-900" : "hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"}
                        >
                        <td style={{ width: '48px', padding: '12px 8px', textAlign: 'center', borderRight: '1px solid' + (group.isRecurring ? '#dbeafe' : '#e5e7eb') }} className={group.isRecurring ? "dark:border-blue-900" : "dark:border-gray-700"}>
                            {group.isRecurring && (
                              <span className="text-lg text-blue-600 dark:text-blue-400">├</span>
                            )}
                          </td>
                          <td style={{ width: '120px', padding: '12px', borderRight: '1px solid' + (group.isRecurring ? '#dbeafe' : '#e5e7eb') }} className={group.isRecurring ? "dark:border-blue-900" : "dark:border-gray-700"}>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(booking.date)}</span>
                          </td>
                          <td style={{ width: '130px', padding: '12px', borderRight: '1px solid' + (group.isRecurring ? '#dbeafe' : '#e5e7eb') }} className={group.isRecurring ? "dark:border-blue-900" : "dark:border-gray-700"}>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                          </td>
                          <td style={{ width: '150px', padding: '12px', borderRight: '1px solid' + (group.isRecurring ? '#dbeafe' : '#e5e7eb') }} className={group.isRecurring ? "dark:border-blue-900" : "dark:border-gray-700"}>
                            <span className="text-sm text-gray-900 dark:text-white font-medium">{booking.purpose}</span>
                          </td>
                          <td style={{ width: '140px', padding: '12px', borderRight: '1px solid' + (group.isRecurring ? '#dbeafe' : '#e5e7eb') }} className={group.isRecurring ? "dark:border-blue-900" : "dark:border-gray-700"}>
                            {(() => {
                              const resource = resources.find(r => r.id === booking.resourceId);
                              return resource ? (
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{resource.name}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{resource.location}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">Unknown Resource</span>
                              );
                            })()}
                          </td>
                          <td style={{ width: '110px', padding: '12px', textAlign: 'center', borderRight: '1px solid' + (group.isRecurring ? '#dbeafe' : '#e5e7eb') }} className={group.isRecurring ? "dark:border-blue-900" : "dark:border-gray-700"}>
                            {(() => {
                              const resource = resources.find(r => r.id === booking.resourceId);
                              const typeConfig = resource ? assetTypeConfig[resource.type] : null;
                              return typeConfig ? (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${typeConfig.badge}`}>
                                  {typeConfig.label}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">Unknown</span>
                              );
                            })()}
                          </td>
                          <td style={{ width: '90px', padding: '12px', textAlign: 'center', borderRight: '1px solid' + (group.isRecurring ? '#dbeafe' : '#e5e7eb') }} className={group.isRecurring ? "dark:border-blue-900" : "dark:border-gray-700"}>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{booking.attendees}</span>
                          </td>
                          <td style={{ width: '110px', padding: '12px', borderRight: '1px solid' + (group.isRecurring ? '#dbeafe' : '#e5e7eb') }} className={group.isRecurring ? "dark:border-blue-900" : "dark:border-gray-700"}>
                            <Badge color={getStatusBadgeColor(booking.status)} variant="solid" size="sm">
                              {booking.status}
                            </Badge>
                            {booking.reason && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {booking.reason}
                              </p>
                            )}
                          </td>
                          <td style={{ width: '70px', padding: '12px', textAlign: 'center' }}>
                            <div className="flex items-center justify-center gap-1">
                              {canEdit(booking) && (
                                <button
                                  onClick={() => handleEditClick(booking)}
                                  className="inline-flex items-center justify-center rounded p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                                  title="Edit booking"
                                >
                                  <PencilIcon className="h-4 w-4 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" />
                                </button>
                              )}
                              {canCancel(booking) ? (
                                <button
                                  onClick={() => handleCancel(booking.id)}
                                  className="inline-flex items-center justify-center rounded p-2 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                  title="Cancel booking"
                                >
                                  <TrashBinIcon className="h-4 w-4 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" />
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      )}

      {/* Edit Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Edit Booking</h2>

            <div className="space-y-4">
              {/* Resource Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Resource
                </label>
                <select
                  value={editFormData.resourceId}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, resourceId: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a resource</option>
                  {resources.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, date: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={editFormData.startTime}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, startTime: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={editFormData.endTime}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, endTime: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Purpose
                </label>
                <input
                  type="text"
                  value={editFormData.purpose}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, purpose: e.target.value })
                  }
                  placeholder="Booking purpose"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Attendees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Attendees
                </label>
                <input
                  type="number"
                  min="1"
                  value={editFormData.attendees}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, attendees: parseInt(e.target.value) || 1 })
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCloseEditModal}
                disabled={isSubmitting}
                className="flex-1 rounded bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="flex-1 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
