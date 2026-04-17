import { useEffect, useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import LoadingIndicator from "../../components/common/LoadingIndicator";
import Badge from "../../components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { useNotification } from "../../components/common/NotificationProvider";
import { Booking, getUserBookings, cancelBooking } from "../../lib/bookingService";
import { TrashBinIcon } from "../../icons";

export default function MyBookings() {
  const { showNotification } = useNotification();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const data = await getUserBookings();
      setBookings(data);
    } catch (err) {
      setError("Failed to load your bookings");
    } finally {
      setIsLoading(false);
    }
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
      ) : (
        <ComponentCard title="My Bookings" desc={`You have ${bookings.length} booking${bookings.length !== 1 ? "s" : ""}`}>
          <div className="overflow-x-auto">
            <Table className="border-collapse border border-gray-200 dark:border-gray-700">
              <TableHeader className="bg-gray-50 dark:bg-gray-900">
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
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
                  <TableRow key={booking.id} className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
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
                      <Badge color={getStatusBadgeColor(booking.status)} variant="solid" size="sm">
                        {booking.status}
                      </Badge>
                      {booking.reason && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Reason: {booking.reason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      {canCancel(booking) ? (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Cancel booking"
                        >
                          <TrashBinIcon className="h-4 w-4 text-error-500 hover:text-error-700" />
                        </button>
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
    </>
  );
}
