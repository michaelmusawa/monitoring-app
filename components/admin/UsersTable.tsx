// components/ui/usersTable.tsx
import React from "react";

import { User } from "lucide-react";
import Image from "next/image";
import { fetchFilteredUsers } from "@/lib/actions/usersActions";
import AddUserModal from "./AddUserModal";
import ActivateUserForm from "./ActivateUserForm";
import ArchiveUserForm from "./ArchiveUserForm";

const PAGE_SIZE = 10;

const UsersTable = async ({
  query,
  startDate,
  endDate,
  currentPage,
  showArchived = false,
}: {
  query: string;
  startDate: string;
  endDate: string;
  currentPage: number;
  group?: string;
  showArchived?: boolean;
}) => {
  const users = await fetchFilteredUsers(
    query,
    startDate,
    endDate,
    currentPage,
    showArchived,
  );

  console.log("users: ", users);

  const offset = (currentPage - 1) * PAGE_SIZE;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Email
            </th>

            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {users.map((user, index) => (
            <tr
              key={user.id}
              className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {offset + index + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    {user.image ? (
                      <Image
                        className="h-10 w-10 rounded-full object-cover border-2 border-indigo-500/30"
                        src={user.image}
                        alt={user.name ?? "User Image"}
                        width={200}
                        height={200}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-yellow-900/50 flex items-center justify-center">
                        <User className="text-yellow-600 dark:text-yellow-300" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user.role === "coordinator" ? "Director" : user.role}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                {user.email}
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status === "archived"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  }`}
                >
                  {user.status === "archived" ? "Archived" : "Active"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  {user.status !== "archived" && <AddUserModal user={user} />}

                  {user.status === "archived" ? (
                    <ActivateUserForm userId={user.id} />
                  ) : (
                    <ArchiveUserForm userId={user.id} />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700/50 rounded-full mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No users found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Try adjusting your search or filter to find what you&apos;re looking
            for.
          </p>
        </div>
      )}
    </div>
  );
};

export default UsersTable;
