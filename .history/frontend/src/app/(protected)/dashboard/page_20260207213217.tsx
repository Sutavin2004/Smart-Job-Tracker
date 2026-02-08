export default function DashboardPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Total Applications</p>
          <p className="text-2xl font-bold">—</p>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Response Rate</p>
          <p className="text-2xl font-bold">—%</p>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Interviews</p>
          <p className="text-2xl font-bold">—</p>
        </div>
      </div>
    </div>
  );
}
