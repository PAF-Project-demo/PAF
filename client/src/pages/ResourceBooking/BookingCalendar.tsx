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
      title="📅 Booking Calendar"
      desc={`${events.length} booking${events.length !== 1 ? "s" : ""} scheduled • View and manage all bookings`}
    >
      <div className="calendar-wrapper overflow-hidden rounded-2xl border-2 border-gray-200 p-4 shadow-md hover:shadow-lg transition-shadow dark:border-gray-700">
        <style>{`
          .calendar-wrapper {
            --fc-border-color: #e5e7eb;
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
            --fc-border-color: #374151;
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
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border-color: #1e40af;
            color: white;
            font-weight: 600;
            text-transform: capitalize;
            border-radius: 0.5rem;
            transition: all 0.3s ease;
          }

          .fc-button-group .fc-button-primary:hover:not(:disabled) {
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
            border-color: #1e3a8a;
            box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
            transform: translateY(-1px);
          }

          .fc-button-group .fc-button-primary.fc-button-active {
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
            border-color: #1e3a8a;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .fc .fc-button-primary:not(:disabled):active,
          .fc .fc-button-primary:not(:disabled).fc-button-active {
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
            border-color: #1e3a8a;
          }

          .fc-daygrid-day {
            transition: all 0.2s ease;
          }

          .fc-daygrid-day:hover {
            background-color: #f3f4f6;
            box-shadow: inset 0 0 8px rgba(59, 130, 246, 0.1);
          }

          .dark .fc-daygrid-day:hover {
            background-color: #2d3748;
            box-shadow: inset 0 0 8px rgba(59, 130, 246, 0.15);
          }

          .fc-col-header-cell {
            padding: 12px 4px !important;
            font-weight: 700;
            background: linear-gradient(180deg, #f0f4f8 0%, #e8ecf1 100%);
            border-color: #e5e7eb;
          }

          .dark .fc-col-header-cell {
            background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
            border-color: #374151;
          }

          .fc-event {
            cursor: pointer;
            border: 2px solid;
            border-radius: 0.5rem;
            transition: all 0.3s ease;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          }

          .fc-event:hover {
            opacity: 1;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
          }

          .fc-daygrid-event {
            margin: 2px 0;
          }

          .fc-event-title {
            font-weight: 600;
            font-size: 0.85rem;
            padding: 4px 6px;
          }

          .fc-button-prev,
          .fc-button-next,
          .fc-button-today {
            padding: 0.5rem 1rem !important;
          }

          .fc-toolbar {
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 20px;
          }

          .fc-toolbar-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #111827;
            margin: 0;
          }

          .dark .fc-toolbar-title {
            color: #f9fafb;
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
      <div className="mt-8">
        <h3 className="mb-4 text-sm font-bold text-gray-700 dark:text-gray-300">📊 Status Legend</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border-2 border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-all dark:border-gray-700 dark:bg-gray-800">
            <div className="h-4 w-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 shadow-md"></div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Pending</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border-2 border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-all dark:border-gray-700 dark:bg-gray-800">
            <div className="h-4 w-4 rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-md"></div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Approved</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border-2 border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-all dark:border-gray-700 dark:bg-gray-800">
            <div className="h-4 w-4 rounded-full bg-gradient-to-r from-red-400 to-red-500 shadow-md"></div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Rejected</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border-2 border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-all dark:border-gray-700 dark:bg-gray-800">
            <div className="h-4 w-4 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 shadow-md"></div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Cancelled</span>
          </div>
        </div>
      </div>
    </ComponentCard>
  );
}
