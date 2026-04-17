import { useEffect, useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import LoadingIndicator from "../../components/common/LoadingIndicator";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { useNotification } from "../../components/common/NotificationProvider";
import { Booking, getAllBookings, updateBookingStatus } from "../../lib/bookingService";
import { CheckCircleIcon, CloseIcon } from "../../icons";

interface RejectModalState {
  isOpen: boolean;
  bookingId: string;
  reason: string;
}

export default function AdminBookingPanel() {
  const { showNotification } = useNotification();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectModal, setRejectModal] = useState<RejectModalState>({
    isOpen: false,
    bookingId: "",
    reason: "",
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const data = await getAllBookings();
      setBookings(data);
    } catch (err) {
      setError("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, "APPROVED");
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "APPROVED" } : b
        )
      );
      showNotification({
        title: "Success",
        message: "Booking approved successfully",
        variant: "success",
      });
    } catch (err: any) {
      showNotification({
        title: "Error",
        message: err.message || "Failed to approve booking",
        variant: "error",
      });
    }
  };

  const openRejectModal = (bookingId: string) => {
    setRejectModal({
      isOpen: true,
      bookingId,
      reason: "",
    });
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) {
      showNotification({
        title: "Validation Error",
        message: "Please provide a rejection reason",
        variant: "error",
      });
      return;
    }

    try {
      await updateBookingStatus(
        rejectModal.bookingId,
        "REJECTED",
        rejectModal.reason
      );
      setBookings((prev) =>
        prev.map((b) =>
          b.id === rejectModal.bookingId
            ? { ...b, status: "REJECTED", reason: rejectModal.reason }
            : b
        )
      );
      showNotification({
        title: "Success",
        message: "Booking rejected successfully",
        variant: "success",
      });
      setRejectModal({
        isOpen: false,
        bookingId: "",
        reason: "",
      });
    } catch (err: any) {
      showNotification({
        title: "Error",
        message: err.message || "Failed to reject booking",
        variant: "error",
      });
    }
  };

  const closeRejectModal = () => {
    setRejectModal({
      isOpen: false,
      bookingId: "",
      reason: "",
    });
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

  const canActionBooking = (status: Booking["status"]) => {
    return status === "PENDING";
  };

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const approvedCount = bookings.filter((b) => b.status === "APPROVED").length;
  const rejectedCount = bookings.filter((b) => b.status === "REJECTED").length;

  return (
    <>
      {isLoading ? (
        <ComponentCard title="Booking Management">
          <LoadingIndicator label="Loading bookings..." />
        </ComponentCard>
      ) : error ? (
        <ComponentCard title="Booking Management">
          <div className="rounded-lg bg-error-50 p-4 text-error-700 dark:bg-error-950 dark:text-error-300">
            {error}
          </div>
        </ComponentCard>
      ) : (
        <ComponentCard
          title="Booking Management"
          desc={`Total: ${bookings.length} | Pending: ${pendingCount} | Approved: ${approvedCount} | Rejected: ${rejectedCount}`}
        >
          <div className="overflow-x-auto">
            <Table className="border-collapse border border-gray-200 dark:border-gray-700">
              <TableHeader className="bg-gray-50 dark:bg-gray-900">
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableCell isHeader className="border-r border-gray-200 px-4 py-3 text-left dark:border-gray-700">
                    User
                  </TableCell>
                  <TableCell isHeader className="border-r border-gray-200 px-4 py-3 text-left dark:border-gray-700">
                    Resource ID
                  </TableCell>
                  <TableCell isHeader className="border-r border-gray-200 px-4 py-3 text-left dark:border-gray-700">
                    Date
                  </TableCell>
                  <TableCell isHeader className="border-r border-gray-200 px-4 py-3 text-left dark:border-gray-700">
                    Time
                  </TableCell>
                  <TableCell isHeader className="border-r border-gray-200 px-4 py-3 text-left dark:border-gray-700">
                    Purpose
                  </TableCell>
                  <TableCell isHeader className="border-r border-gray-200 px-4 py-3 text-center dark:border-gray-700">
                    Attendees
                  </TableCell>
                  <TableCell isHeader className="border-r border-gray-200 px-4 py-3 text-left dark:border-gray-700">
                    Status
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-center">
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <TableCell className="border-r border-gray-200 px-4 py-3 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.userId.substring(0, 10)}...
                      </span>
                    </TableCell>
                    <TableCell className="border-r border-gray-200 px-4 py-3 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.resourceId.substring(0, 8)}...
                      </span>
                    </TableCell>
                    <TableCell className="border-r border-gray-200 px-4 py-3 dark:border-gray-700">
                      <span className="text-sm font-medium">{formatDate(booking.date)}</span>
                    </TableCell>
                    <TableCell className="border-r border-gray-200 px-4 py-3 dark:border-gray-700">
                      <span className="text-sm">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </span>
                    </TableCell>
                    <TableCell className="border-r border-gray-200 px-4 py-3 dark:border-gray-700">
                      <span className="text-sm">{booking.purpose}</span>
                    </TableCell>
                    <TableCell className="border-r border-gray-200 px-4 py-3 text-center dark:border-gray-700">
                      <span className="text-sm font-medium">{booking.attendees}</span>
                    </TableCell>
                    <TableCell className="border-r border-gray-200 px-4 py-3 dark:border-gray-700">
                      <div>
                        <Badge color={getStatusBadgeColor(booking.status)} variant="solid" size="sm">
                          {booking.status}
                        </Badge>
                        {booking.reason && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {booking.reason}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {canActionBooking(booking.status) ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleApprove(booking.id)}
                            className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-success-100 dark:hover:bg-success-900/20"
                            title="Approve booking"
                          >
                            <CheckCircleIcon className="h-4 w-4 text-success-600 hover:text-success-700" />
                          </button>
                          <button
                            onClick={() => openRejectModal(booking.id)}
                            className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-error-100 dark:hover:bg-error-900/20"
                            title="Reject booking"
                          >
                            <CloseIcon className="h-4 w-4 text-error-600 hover:text-error-700" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ComponentCard>
      )}

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Reject Booking
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Please provide a reason for rejecting this booking.
            </p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              placeholder="Reason for rejection..."
              className="mb-6 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-brand-400 dark:focus:ring-brand-400"
              rows={4}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeRejectModal}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleReject}
                className="flex-1"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
