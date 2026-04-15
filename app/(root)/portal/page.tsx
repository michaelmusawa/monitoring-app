// monitoring-app/app/portal/page.tsx

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 pt-20 lg:pt-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Nairobi County Projects Portal
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-300 mb-4 max-w-3xl">
            Stay informed, track progress, and provide feedback on county
            infrastructure projects. Your voice helps shape better public
            services.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Active Projects</span>
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>Stalled Projects</span>
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Completed Projects</span>
            </span>
          </div>
        </header>

        {/* Render the client-side portal component */}
      </div>
    </div>
  );
}
