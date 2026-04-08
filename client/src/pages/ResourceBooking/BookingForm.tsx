import { useState } from "react";
import { useNotification } from "../../components/common/NotificationProvider";
import Button from "../../components/ui/button/Button";
import { Resource } from "../../lib/resourceService";
import { createBooking, CreateBookingRequest } from "../../lib/bookingService";

interface BookingFormProps {
  resources: Resource[];
}

export default function BookingForm({ resources }: BookingFormProps) {
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateBookingRequest>({
    resourceId: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    purpose: "",
    attendees: 1,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "attendees" ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.resourceId) {
      showNotification({
        title: "Validation Error",
        message: "Please select a resource",
        variant: "error",
      });
      return;
    }

    if (!formData.date) {
      showNotification({
        title: "Validation Error",
        message: "Please select a date",
        variant: "error",
      });
      return;
    }

    if (!formData.purpose) {
      showNotification({
        title: "Validation Error",
        message: "Please enter a purpose",
        variant: "error",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createBooking(formData);

      showNotification({
        title: "Success",
        message: "Booking created successfully. Status is PENDING.",
        variant: "success",
      });

      // Reset form
      setFormData({
        resourceId: "",
        date: "",
        startTime: "09:00",
        endTime: "10:00",
        purpose: "",
        attendees: 1,
      });
    } catch (err: any) {
      showNotification({
        title: "Error",
        message: err.message || "Failed to create booking",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Resource Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Resource *
        </label>
        <select
          name="resourceId"
          value={formData.resourceId}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-400"
        >
          <option value="">Select a resource</option>
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name} ({resource.type}) - Capacity: {resource.capacity} - Location: {resource.location}
            </option>
          ))}
        </select>
        {formData.resourceId && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {resources.find((r) => r.id === formData.resourceId)?.description}
          </p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Date *
        </label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          min={new Date().toISOString().split("T")[0]}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-400"
        />
      </div>

      {/* Time Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Start Time *
          </label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-400"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            End Time *
          </label>
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-400"
          />
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Purpose *
        </label>
        <textarea
          name="purpose"
          value={formData.purpose}
          onChange={handleChange}
          required
          placeholder="e.g., Team meeting, Project presentation, Lab experiment"
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-brand-400 dark:focus:ring-brand-400"
        />
      </div>

      {/* Attendees */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Number of Attendees *
        </label>
        <input
          type="number"
          name="attendees"
          value={formData.attendees}
          onChange={handleChange}
          required
          min="1"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-400"
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setFormData({
              resourceId: "",
              date: "",
              startTime: "09:00",
              endTime: "10:00",
              purpose: "",
              attendees: 1,
            });
          }}
        >
          Clear
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Booking"}
        </Button>
      </div>
    </form>
  );
}
