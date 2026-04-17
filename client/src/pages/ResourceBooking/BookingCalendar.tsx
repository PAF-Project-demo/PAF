import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import ComponentCard from "../../components/common/ComponentCard";
import LoadingIndicator from "../../components/common/LoadingIndicator";
import { Booking, getUserBookings, getAllBookings } from "../../lib/bookingService";
import { getStoredAuthSession, isAdminRole } from "../../lib/auth";

interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO format: YYYY-MM-DDTHH:mm:ss
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    purpose: string;
    attendees: number;
    status: string;
    userId: string;
    resourceId: string;
    reason?: string;
  };
}

export default function BookingCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const authSession = getStoredAuthSession();
  const isAdmin = isAdminRole(authSession?.role);

  useEffect(() => {
    loadBookingEvents();
  }, []);

  const loadBookingEvents = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Fetch bookings (admin sees all, users see only own)
      let bookings: Booking[];
      if (isAdmin) {
        bookings = await getAllBookings();
      } else {
        bookings = await getUserBookings();
      }

      // Convert bookings to calendar events
      const calendarEvents = bookings.map((booking) => {
        const startDateTime = new Date(`${booking.date}T${booking.startTime}`);
        const endDateTime = new Date(`${booking.date}T${booking.endTime}`);

        // Color based on status
        let colors = {
          backgroundColor: "bg-warning-500",
          borderColor: "border-warning-500",
        };

        switch (booking.status) {
          case "APPROVED":
            colors = { backgroundColor: "#10b981", borderColor: "#059669" };
            break;
          case "REJECTED":
            colors = { backgroundColor: "#ef4444", borderColor: "#dc2626" };
            break;
          case "CANCELLED":
            colors = { backgroundColor: "#d1d5db", borderColor: "#9ca3af" };
            break;
          case "PENDING":
          default:
            colors = { backgroundColor: "#f59e0b", borderColor: "#d97706" };
            break;
        }

        return {
          id: booking.id,
          title: `${booking.purpose} (${booking.attendees} attendees)`,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          ...colors,
          extendedProps: {
            purpose: booking.purpose,
            attendees: booking.attendees,
            status: booking.status,
            userId: booking.userId,
            resourceId: booking.resourceId,
            reason: booking.reason,
          },
        } as CalendarEvent;
      });

      setEvents(calendarEvents);
    } catch (err) {
      setError("Failed to load bookings for calendar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventClick = (info: any) => {
    const { extendedProps } = info.event;
    alert(
      `${info.event.title}\n\nStatus: ${extendedProps.status}\n\nResource: ${extendedProps.resourceId.substring(0, 10)}...\n\nPurpose: ${extendedProps.purpose}${
        extendedProps.reason ? `\n\nReason: ${extendedProps.reason}` : ""
      }`
    );
  };

  if (isLoading) {
    return (
      <ComponentCard title="Booking Calendar">
        <LoadingIndicator label="Loading calendar..." />
      </ComponentCard>
    );
  }

  if (error) {
    return (
      <ComponentCard title="Booking Calendar">
        <div className="rounded-lg bg-error-50 p-4 text-error-700 dark:bg-error-950 dark:text-error-300">
          {error}
        </div>
      </ComponentCard>
    );
  }

  return (
    <ComponentCard
      title="Booking Calendar"
      desc={`${events.length} booking${events.length !== 1 ? "s" : ""} scheduled`}
    >
      <div className="calendar-wrapper overflow-hidden rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <style>{`
          .calendar-wrapper {
            --fc-border-color: #d1d5db;
            --fc-page-bg-color: transparent;
            --fc-neutral-bg-color: #f9fafb;
            --fc-event-bg-color: #3b82f6;
            --fc-event-border-color: #1e40af;
            --fc-event-text-color: white;
            --fc-button-bg-color: #3b82f6;
            --fc-button-border-color: #1e40af;
            --fc-button-hover-bg-color: #1e40af;
            --fc-button-hover-border-color: #1e3a8a;
            --fc-button-active-bg-color: #1e40af;
            --fc-button-active-border-color: #1e3a8a;
          }

          .dark .calendar-wrapper {
            --fc-border-color: #464646;
            --fc-page-bg-color: transparent;
            --fc-neutral-bg-color: #1f2937;
            --fc-event-bg-color: #3b82f6;
            --fc-event-border-color: #1e40af;
            --fc-event-text-color: white;
            --fc-button-bg-color: #3b82f6;
            --fc-button-border-color: #1e40af;
            --fc-button-hover-bg-color: #1e40af;
            --fc-button-hover-border-color: #1e3a8a;
            --fc-button-active-bg-color: #1e40af;
            --fc-button-active-border-color: #1e3a8a;
          }

          .fc-button-group .fc-button-primary {
            background-color: #3b82f6;
            border-color: #1e40af;
            color: white;
          }

          .fc-button-group .fc-button-primary:hover {
            background-color: #1e40af;
            border-color: #1e3a8a;
          }

          .fc-button-group .fc-button-primary.fc-button-active {
            background-color: #1e40af;
            border-color: #1e3a8a;
          }

          .fc .fc-button-primary:not(:disabled):active,
          .fc .fc-button-primary:not(:disabled).fc-button-active {
            background-color: #1e40af;
            border-color: #1e3a8a;
          }

          .fc-daygrid-day:hover {
            background-color: #f3f4f6;
          }

          .dark .fc-daygrid-day:hover {
            background-color: #2d3748;
          }

          .fc-event {
            cursor: pointer;
            border: 1px solid;
          }

          .fc-event:hover {
            opacity: 0.8;
          }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
          }}
          initialView="dayGridMonth"
          editable={false}
          selectable={false}
          selectConstraint="businessHours"
          events={events}
          eventClick={handleEventClick}
          height="auto"
          contentHeight="auto"
          eventDisplay="block"
          nowIndicator={true}
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: "short",
            omitZeroMinute: false,
          }}
        />
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-warning-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-success-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-error-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Rejected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-gray-400"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Cancelled</span>
        </div>
      </div>
    </ComponentCard>
  );
}
