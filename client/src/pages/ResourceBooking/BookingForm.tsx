import { useState } from "react";
import { useNotification } from "../../components/common/NotificationProvider";
import Button from "../../components/ui/button/Button";
import { Resource } from "../../lib/resourceService";
import { createBooking, CreateBookingRequest } from "../../lib/bookingService";
import { BoxCubeIcon, GridIcon, TableIcon, BoxIconLine, CalenderIcon, TimeIcon, UserIcon, InfoIcon, CheckCircleIcon, AlertIcon } from "../../icons";

interface BookingFormProps {
  resources: Resource[];
}

// Asset type mapping for display with descriptions
const assetTypeConfig: Record<
  string,
  { label: string; description: string; icon: React.ReactNode }
> = {
  LECTURE_HALL: {
    label: "Lecture Hall",
    description: "Large rooms for lectures and presentations",
    icon: <GridIcon className="h-5 w-5" />,
  },
  LAB: {
    label: "Lab",
    description: "Laboratory spaces for experiments and practicals",
    icon: <BoxIconLine className="h-5 w-5" />,
  },
  MEETING_ROOM: {
    label: "Assignment Room",
    description: "Meeting rooms for group work and discussions",
    icon: <TableIcon className="h-5 w-5" />,
  },
  EQUIPMENT: {
    label: "Equipment",
    description: "Specialized equipment and resources",
    icon: <BoxCubeIcon className="h-5 w-5" />,
  },
};

// Legacy helper for backward compatibility
const assetTypeLabels: Record<string, string> = Object.entries(
  assetTypeConfig
).reduce((acc, [key, value]) => ({ ...acc, [key]: value.label }), {});

export default function BookingForm({ resources }: BookingFormProps) {
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CreateBookingRequest>({
    resourceId: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    purpose: "",
    attendees: 1,
  });

  // Filter resources based on selected asset type
  const filteredResources = selectedAssetType
    ? resources.filter((r) => r.type === selectedAssetType)
    : resources;

  // Calculate form completion
  const requiredFields = ["resourceId", "date", "startTime", "endTime", "purpose"];
  const completedFields = requiredFields.filter((field) => {
    const value = formData[field as keyof CreateBookingRequest];
    if (field === "startTime" && formData.endTime && formData.startTime >= formData.endTime) return false;
    return value && value !== "";
  }).length;
  const completionPercentage = Math.round((completedFields / requiredFields.length) * 100);

  // Get selected resource
  const selectedResource = formData.resourceId ? resources.find((r) => r.id === formData.resourceId) : null;

  const validateField = (name: string, value: string | number): string | null => {
    if (name === "resourceId" && !value) return "Please select a resource";
    if (name === "date" && !value) return "Please select a date";
    if (name === "startTime" && !value) return "Start time is required";
    if (name === "endTime" && !value) return "End time is required";
    if (name === "startTime" || name === "endTime") {
      if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
        return "End time must be after start time";
      }
    }
    if (name === "purpose" && !value) return "Purpose is required";
    if (name === "attendees" && selectedResource && (selectedResource?.capacity ?? 0) > 0 && parseInt(value?.toString() || "0", 10) > (selectedResource?.capacity ?? 0)) {
      return `Exceeds capacity (max ${selectedResource?.capacity})`;
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numValue = name === "attendees" ? parseInt(value, 10) : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: numValue,
    }));

    // Real-time validation
    const error = validateField(name, numValue);
    setFormErrors((prev) => ({
      ...prev,
      [name]: error || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    const newErrors: Record<string, string> = {};
    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field as keyof CreateBookingRequest]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      showNotification({
        title: "Validation Error",
        message: "Please fix the errors before submitting",
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
      setSelectedAssetType("");
      setFormData({
        resourceId: "",
        date: "",
        startTime: "09:00",
        endTime: "10:00",
        purpose: "",
        attendees: 1,
      });
      setFormErrors({});
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
    <div className="space-y-6">
      {/* Form Completion Progress */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-brand-50 p-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Booking Details
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {completedFields} of {requiredFields.length} required
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: SELECT RESOURCE */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-brand-100 p-2 dark:bg-brand-900">
              <GridIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Resource Type
            </h3>
          </div>

          {/* Asset Type Selection */}
          <div>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Choose the type of resource you need
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-5">
              {/* All Types Button */}
              <button
                type="button"
                onClick={() => setSelectedAssetType("")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 px-3 py-3 transition duration-150 ${
                  selectedAssetType === ""
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950"
                    : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
                }`}
              >
                <GridIcon className={`h-6 w-6 ${selectedAssetType === "" ? "text-brand-600 dark:text-brand-400" : "text-gray-600 dark:text-gray-400"}`} />
                <span className={`text-center text-sm font-medium leading-tight ${selectedAssetType === "" ? "text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-gray-300"}`}>
                  All Types
                </span>
              </button>

              {/* Individual Asset Type Buttons */}
              {Object.entries(assetTypeConfig).map(([type, config]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedAssetType(type)}
                  className={`group flex flex-col items-center gap-2 rounded-lg border-2 px-3 py-3 transition duration-150 ${
                    selectedAssetType === type
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-950"
                      : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
                  }`}
                  title={config.description}
                >
                  <div className={`transition duration-150 ${selectedAssetType === type ? "text-brand-600 dark:text-brand-400" : "text-gray-600 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"}`}>
                    {config.icon}
                  </div>
                  <span className={`text-center text-sm font-medium leading-tight ${selectedAssetType === type ? "text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-gray-300"}`}>
                    {config.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Resource Selection */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resource *</label>
              {formData.resourceId && !formErrors.resourceId && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
              {formErrors.resourceId && <AlertIcon className="h-4 w-4 text-red-500" />}
            </div>
            {selectedAssetType && (
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Showing {filteredResources.length} {assetTypeConfig[selectedAssetType]?.label.toLowerCase() || "resource"}{filteredResources.length !== 1 ? "s" : ""}
              </p>
            )}
            <select
              name="resourceId"
              value={formData.resourceId}
              onChange={handleChange}
              required
              className={`w-full rounded-lg border px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-1 dark:bg-gray-800 dark:text-white ${
                formErrors.resourceId
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:focus:border-red-500"
                  : "border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:focus:border-brand-400 dark:focus:ring-brand-400"
              }`}
            >
              <option value="">{filteredResources.length === 0 ? "No resources available" : "Select a resource"}</option>
              {filteredResources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} • {assetTypeLabels[resource.type]} • Capacity: {resource.capacity} • {resource.location}
                </option>
              ))}
            </select>
            {formErrors.resourceId && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.resourceId}</p>}

            {/* Resource Details Card */}
            {selectedResource && (
              <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-brand-600 dark:text-brand-400">Selected Resource</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedResource.name}</p>
                    </div>
                    <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                      {assetTypeLabels[selectedResource.type]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded bg-white p-2 dark:bg-gray-700">
                      <p className="text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedResource.location}</p>
                    </div>
                    <div className="rounded bg-white p-2 dark:bg-gray-700">
                      <p className="text-gray-500 dark:text-gray-400">Capacity</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedResource.capacity} people</p>
                    </div>
                  </div>
                  {selectedResource.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">{selectedResource.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: SCHEDULE BOOKING */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-brand-100 p-2 dark:bg-brand-900">
              <CalenderIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Schedule Booking
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Date */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date *</label>
                {formData.date && !formErrors.date && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                {formErrors.date && <AlertIcon className="h-4 w-4 text-red-500" />}
              </div>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split("T")[0]}
                className={`w-full rounded-lg border px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-1 dark:bg-gray-800 dark:text-white ${
                  formErrors.date
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:focus:border-red-500"
                    : "border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:focus:border-brand-400 dark:focus:ring-brand-400"
                }`}
              />
              {formErrors.date && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.date}</p>}
            </div>

            {/* Time Range */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time Range *</label>
                {formData.startTime && formData.endTime && formData.startTime < formData.endTime && !formErrors.startTime && !formErrors.endTime && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 dark:bg-gray-800 dark:text-white ${
                      formErrors.startTime
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:focus:border-red-500"
                        : "border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:focus:border-brand-400 dark:focus:ring-brand-400"
                    }`}
                  />
                </div>
                <div className="flex items-center text-gray-500 dark:text-gray-400">→</div>
                <div className="flex-1">
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 dark:bg-gray-800 dark:text-white ${
                      formErrors.endTime
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:focus:border-red-500"
                        : "border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:focus:border-brand-400 dark:focus:ring-brand-400"
                    }`}
                  />
                </div>
              </div>
              {(formErrors.startTime || formErrors.endTime) && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.startTime || formErrors.endTime}</p>
              )}
              {formData.startTime && formData.endTime && formData.startTime < formData.endTime && (
                <p className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
                  Duration: {(() => {
                    const [startH, startM] = formData.startTime.split(":").map(Number);
                    const [endH, endM] = formData.endTime.split(":").map(Number);
                    const startMinutes = startH * 60 + startM;
                    const endMinutes = endH * 60 + endM;
                    const durationMinutes = endMinutes - startMinutes;
                    const hours = Math.floor(durationMinutes / 60);
                    const minutes = durationMinutes % 60;
                    return hours > 0 ? (minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`) : `${minutes}m`;
                  })()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: EVENT DETAILS */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-brand-100 p-2 dark:bg-brand-900">
              <InfoIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Event Details
            </h3>
          </div>

          <div className="space-y-5">
            {/* Purpose */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purpose *</label>
                {formData.purpose && !formErrors.purpose && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                {formErrors.purpose && <AlertIcon className="h-4 w-4 text-red-500" />}
              </div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Describe what you'll be using this resource for</p>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
                placeholder="e.g., Team meeting, Project presentation, Lab experiment"
                rows={3}
                className={`w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 ${
                  formErrors.purpose
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:focus:border-red-500"
                    : "border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:focus:border-brand-400 dark:focus:ring-brand-400"
                }`}
              />
              {formErrors.purpose && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.purpose}</p>}
            </div>

            {/* Attendees */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Attendees *</label>
                {selectedResource && formData.attendees <= (selectedResource?.capacity ?? 0) && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                {selectedResource && formData.attendees > (selectedResource?.capacity ?? 0) && <AlertIcon className="h-4 w-4 text-red-500" />}
              </div>

              {selectedResource ? (
                <div className="space-y-3">
                  <div className="flex items-end gap-2">
                    <input
                      type="number"
                      name="attendees"
                      value={formData.attendees}
                      onChange={handleChange}
                      required
                      min="1"
                      className={`flex-1 rounded-lg border px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-1 dark:bg-gray-800 dark:text-white ${
                        formData.attendees > (selectedResource?.capacity ?? 0)
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:focus:border-red-500"
                          : "border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:focus:border-brand-400 dark:focus:ring-brand-400"
                      }`}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">of {selectedResource?.capacity}</span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-700">
                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-600">
                      <div
                        className={`h-full transition-all duration-300 ${
                          formData.attendees > (selectedResource?.capacity ?? 0)
                            ? "bg-red-500"
                            : ((selectedResource?.capacity ?? 0) > 0 && (formData.attendees / (selectedResource?.capacity ?? 0)) * 100 > 75)
                              ? "bg-orange-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min((selectedResource?.capacity ?? 0) > 0 ? (formData.attendees / (selectedResource?.capacity ?? 0)) * 100 : 0, 100)}%` }}
                      />
                    </div>
                    <p className={`text-xs font-medium ${
                      formData.attendees > (selectedResource?.capacity ?? 0)
                        ? "text-red-600 dark:text-red-400"
                        : ((selectedResource?.capacity ?? 0) > 0 && (formData.attendees / (selectedResource?.capacity ?? 0)) * 100 > 75)
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-green-600 dark:text-green-400"
                    }`}>
                      {formData.attendees > (selectedResource?.capacity ?? 0)
                        ? `⚠️ Exceeds by ${formData.attendees - (selectedResource?.capacity ?? 0)}`
                        : `${Math.round(((selectedResource?.capacity ?? 0) > 0 ? formData.attendees / (selectedResource?.capacity ?? 0) : 0) * 100)}% capacity`}
                    </p>
                  </div>
                </div>
              ) : (
                <input
                  type="number"
                  name="attendees"
                  value={formData.attendees}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-400"
                />
              )}
            </div>
          </div>
        </div>

        {/* BOOKING PREVIEW CARD */}
        {formData.resourceId && formData.date && (
          <div className="rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-6 dark:border-brand-800 dark:from-brand-950 dark:to-gray-900">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Booking Preview</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between border-b border-brand-200 pb-3 dark:border-brand-800">
                <div className="flex gap-3">
                  <div className="rounded bg-white p-2 dark:bg-gray-800">
                    {assetTypeConfig[selectedResource?.type || ""]?.icon}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Resource</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedResource?.name}</p>
                  </div>
                </div>
                <span className="rounded bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                  {selectedResource?.capacity}p
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-gray-600 dark:text-gray-400">
                <div className="flex gap-2">
                  <CalenderIcon className="h-4 w-4 flex-shrink-0 text-brand-600 dark:text-brand-400" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(formData.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <TimeIcon className="h-4 w-4 flex-shrink-0 text-brand-600 dark:text-brand-400" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Time</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.startTime} - {formData.endTime}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <UserIcon className="h-4 w-4 flex-shrink-0 text-brand-600 dark:text-brand-400" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Attendees</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.attendees} people</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <InfoIcon className="h-4 w-4 flex-shrink-0 text-brand-600 dark:text-brand-400" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-medium text-yellow-600 dark:text-yellow-400">PENDING</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-brand-200 pt-3 dark:border-brand-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Purpose</p>
                <p className="text-gray-900 dark:text-gray-200">{formData.purpose || "Not specified"}</p>
              </div>
            </div>
          </div>
        )}

        {/* SUBMIT BUTTONS */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedAssetType("");
              setFormData({
                resourceId: "",
                date: "",
                startTime: "09:00",
                endTime: "10:00",
                purpose: "",
                attendees: 1,
              });
              setFormErrors({});
            }}
            className="flex-1"
          >
            Clear Form
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || completionPercentage < 100}
            className={`flex-1 ${completionPercentage < 100 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? "Creating Booking..." : "Create Booking"}
          </Button>
        </div>
      </form>
    </div>
  );
}
