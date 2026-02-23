// components/records/RecordsTableSkeleton.tsx
import React from "react";

const ProjectsTableSkeleton = () => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            {[...Array(7)].map((_, index) => (
              <th
                key={index}
                className={`px-6 py-3 text-left text-xs uppercase tracking-wider ${
                  index === 6 ? "text-right" : ""
                }`}
              >
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {[...Array(5)].map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
            >
              {/* # Column */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4"></div>
              </td>

              {/* Ticket Column */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </td>

              {/* Customer Column */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </td>

              {/* Service Column */}
              <td className="px-6 py-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </td>

              {/* Value Column */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </td>

              {/* Date Column */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </td>

              {/* Actions Column */}
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex justify-end space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
                      style={{ width: "32px", height: "32px" }}
                    />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsTableSkeleton;
