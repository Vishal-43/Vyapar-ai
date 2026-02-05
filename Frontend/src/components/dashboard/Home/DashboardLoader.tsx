

export default function DashboardLoader() {
  return (
    <div className="dashboard relative min-h-screen overflow-hidden">
   

      {}
      <div className="dashboard-header">
        <div className="h-6 w-32 rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
      </div>

      {}
      <main className="dashboard-body relative z-10 max-w-2xl mx-auto mt-12 space-y-6">
        {}
        <div className="glass-card p-6 space-y-4 animate-pulse">
          <div className="h-5 w-48 rounded-md bg-gray-200" />
          <div className="h-4 w-full rounded-md bg-gray-200" />
          <div className="h-4 w-5/6 rounded-md bg-gray-200" />
        </div>

        {}
        <div className="grid gap-6">
          {}
          <div className="glass-card p-6 space-y-4 animate-pulse">
            <div className="h-4 w-32 rounded-md bg-gray-200" />
            <div className="h-11 w-full rounded-xl bg-gray-200" />
          </div>

          {}
          <div className="glass-card p-6 space-y-4 animate-pulse">
            <div className="h-4 w-32 rounded-md bg-gray-200" />
            <div className="h-11 w-full rounded-xl bg-gray-200" />
          </div>

          {}
          <div className="glass-card p-6 animate-pulse">
            <div className="h-12 w-full rounded-xl bg-gray-300" />
          </div>
        </div>
      </main>
    </div>
  );
}
