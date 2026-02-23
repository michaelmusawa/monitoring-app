"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Calendar, X, AlertCircle } from "lucide-react";

const DateRangeFilter = ({
  placeholderStart = "Start date",
  placeholderEnd = "End date",
}: {
  placeholderStart?: string;
  placeholderEnd?: string;
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Get initial date range from URL
  const initialStartDate = searchParams.get("startDate") || "";
  const initialEndDate = searchParams.get("endDate") || "";

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [error, setError] = useState<string | null>(null);

  // Clear date filters
  const clearDates = () => {
    setStartDate("");
    setEndDate("");
    setError(null);
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (startDate) params.set("startDate", startDate);
    else params.delete("startDate");

    if (endDate) params.set("endDate", endDate);
    else params.delete("endDate");

    replace(`${pathname}?${params.toString()}`);
  }, [startDate, endDate, pathname, replace, searchParams]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    if (endDate && newStartDate > endDate) {
      setError("Start date cannot be later than end date");
    } else {
      setError(null);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);

    if (startDate && newEndDate < startDate) {
      setError("End date cannot be earlier than start date");
    } else {
      setError(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <label htmlFor="startDate" className="sr-only">
            Start Date
          </label>
          <div className="relative">
            <input
              type="date"
              id="startDate"
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-500 dark:focus:border-primary-400 dark:focus:ring-primary-700"
              placeholder={placeholderStart}
              value={startDate}
              onChange={handleStartDateChange}
              max={endDate || undefined}
            />
            <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-300">
          →
        </div>

        <div className="relative flex-1">
          <label htmlFor="endDate" className="sr-only">
            End Date
          </label>
          <div className="relative">
            <input
              type="date"
              id="endDate"
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-500 dark:focus:border-primary-400 dark:focus:ring-primary-700"
              placeholder={placeholderEnd}
              value={endDate}
              onChange={handleEndDateChange}
              min={startDate || undefined}
            />
            <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {(startDate || endDate) && (
          <button
            onClick={clearDates}
            className="ml-1 flex items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-300 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 dark:focus:ring-primary-700"
            aria-label="Clear dates"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-sm text-red-500 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default DateRangeFilter;
