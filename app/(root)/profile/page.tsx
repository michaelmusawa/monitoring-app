// app/profile/page.tsx
import React from "react";
import Image from "next/image";
import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import EditProfileModal from "@/components/profile/page";

export const metadata = {
  title: "My Profile",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) {
    return (
      <p className="p-6 text-center">
        You need to{" "}
        <a href="/login" className="text-blue-500 hover:underline font-medium">
          sign in
        </a>
      </p>
    );
  }

  const user = await getUser(session.user.email);

  if (!user) {
    return <p className="p-6 text-center">User not found.</p>;
  }

  const role = user.role || "—";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-700 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              {user.image ? (
                <div className="border-4 border-yellow-500/60 rounded-full p-1">
                  <Image
                    src={user.image}
                    alt={`${user.name}'s avatar`}
                    width={112}
                    height={112}
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-28 h-28 bg-gray-200 dark:bg-gray-700 rounded-full border-4 border-white/30 flex items-center justify-center">
                  <span className="text-4xl text-gray-500">👤</span>
                </div>
              )}
            </div>

            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {user.name}
              </h1>
              <p className="text-blue-100 mt-1">{user.email}</p>

              <div className="mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 md:p-8">
          {/* Details Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Account Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Everyone */}
              <InfoCard
                title="Joined On"
                value={new Date(user.createdAt ?? "").toLocaleDateString()}
                icon="📅"
              />

              {/* Supervisor and above see station */}
              {(role === "supervisor" || role === "biller") && (
                <InfoCard
                  title="Station"
                  value={user.sector || "—"}
                  icon="📍"
                />
              )}
            </div>
          </div>

          {/* Actions Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Account Actions
            </h2>

            <div className="flex flex-wrap gap-3">
              <EditProfileModal user={user} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Modern Card Component
function InfoCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:border-blue-300 dark:hover:border-indigo-500">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-300">
          <span className="text-xl">{icon}</span>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </h3>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
