"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProtectedError({ error, reset }: Props) {
  useEffect(() => {
    // In real apps you might send this to an error tracking service.
    console.error("Protected route error:", error);
  }, [error]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p>We couldn’t load this part of your workspace.</p>
      <button
        onClick={() => reset()}
        className="border px-3 py-1 rounded"
      >
        Try again
      </button>
    </div>
  );
}
