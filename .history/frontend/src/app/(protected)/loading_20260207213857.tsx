export default function ProtectedLoading() {
  // Displayed while protected routes are server-rendering or suspended.
  return (
    <div className="p-6">
      <p>Loading your workspace...</p>
    </div>
  );
}
