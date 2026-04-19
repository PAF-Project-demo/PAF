import React from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  required?: boolean;
  showWeekday?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select a date",
  disabled = false,
  error = false,
  errorMessage,
  label,
  required = false,
  showWeekday = false,
}) => {
  const handleDateChange = (selectedDates: Date[]) => {
    if (selectedDates.length > 0) {
      const date = selectedDates[0];
      // Format as YYYY-MM-DD for backend compatibility
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      onChange(formattedDate);
    }
  };

  const parsedDate = value ? new Date(value) : null;

  // Calculate constraints for flatpickr
  const minDateObj = minDate ? new Date(minDate) : new Date();
  const maxDateObj = maxDate ? new Date(maxDate) : undefined;

  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      <div className="relative">
        <Flatpickr
          value={parsedDate || ""}
          onChange={handleDateChange}
          options={{
            minDate: minDateObj,
            maxDate: maxDateObj,
            dateFormat: "Y-m-d",
            mode: "single",
            monthSelectorType: "dropdown",
            enableTime: false,
            disableMobile: false,
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-lg border-2 px-4 py-3 text-gray-900 transition-all focus:outline-none dark:bg-gray-800 dark:text-white ${
            error
              ? "border-red-300 dark:border-red-600"
              : "border-cyan-300 focus:border-cyan-400 dark:border-cyan-600"
          } ${disabled ? "cursor-not-allowed bg-gray-100 dark:bg-gray-900" : ""}`}
        />

        {/* Calendar Icon */}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      {/* Error Message */}
      {error && errorMessage && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          ⚠️ {errorMessage}
        </p>
      )}

      {/* Selected Date Info */}
      {value && !error && showWeekday && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          📅 {new Date(value).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      )}

      {/* Flatpickr Custom Styles */}
      <style>{`
        .flatpickr-calendar {
          background: white;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          border: 2px solid #7dd3fc;
          max-width: 340px;
          padding: 16px;
        }

        .dark .flatpickr-calendar {
          background: #1f2937;
          border-color: #06b6d4;
        }

        .flatpickr-month {
          background: transparent;
          color: #1f2937;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 0 16px 0;
          margin: 0;
        }

        .dark .flatpickr-month {
          color: #f3f4f6;
        }

        .flatpickr-prev-month,
        .flatpickr-next-month {
          color: #3b82f6;
          fill: #3b82f6;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .flatpickr-prev-month:hover,
        .flatpickr-next-month:hover {
          background: #e0f2fe;
          color: #0369a1;
        }

        .dark .flatpickr-prev-month,
        .dark .flatpickr-next-month {
          color: #60a5fa;
        }

        .dark .flatpickr-prev-month:hover,
        .dark .flatpickr-next-month:hover {
          background: #1e40af;
          color: #93c5fd;
        }

        .flatpickr-current-month {
          color: #1f2937;
          font-weight: 600;
          font-size: 16px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .dark .flatpickr-current-month {
          color: #f3f4f6;
        }

        .flatpickr-innerContainer {
          background: transparent;
          padding: 0;
        }

        .flatpickr-weekdaycontainer {
          background: transparent;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 8px;
        }

        .flatpickr-weekday {
          color: #6b7280;
          font-weight: 600;
          font-size: 12px;
          text-align: center;
          padding: 8px 0;
        }

        .dark .flatpickr-weekday {
          color: #9ca3af;
        }

        .flatpickr-days {
          background: transparent;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          padding: 0;
        }

        .flatpickr-day {
          color: #1f2937;
          font-size: 14px;
          transition: all 0.2s;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
        }

        .dark .flatpickr-day {
          color: #d1d5db;
        }

        .flatpickr-day:hover:not(.disabled):not(.prevMonthDay):not(.nextMonthDay) {
          background: #e0f2fe;
          color: #0369a1;
        }

        .dark .flatpickr-day:hover:not(.disabled):not(.prevMonthDay):not(.nextMonthDay) {
          background: #0e7490;
          color: #cffafe;
        }

        .flatpickr-day.selected {
          background: #0ea5e9;
          color: white;
          font-weight: 600;
          border-radius: 50%;
        }

        .dark .flatpickr-day.selected {
          background: #0ea5e9;
        }

        .flatpickr-day.today {
          background: #cffafe;
          color: #0369a1;
          font-weight: 600;
          border-radius: 6px;
        }

        .dark .flatpickr-day.today {
          background: #0e7490;
          color: #cffafe;
        }

        .flatpickr-day.disabled,
        .flatpickr-day.prevMonthDay,
        .flatpickr-day.nextMonthDay {
          color: #d1d5db;
          background: transparent;
          cursor: not-allowed;
        }

        .dark .flatpickr-day.disabled,
        .dark .flatpickr-day.prevMonthDay,
        .dark .flatpickr-day.nextMonthDay {
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default DatePicker;
