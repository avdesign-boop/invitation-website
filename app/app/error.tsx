"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-50 px-6 text-center text-stone-900">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-stone-600">
        Please try again. If it keeps happening, wait a minute and reload the page.
      </p>
      <button onClick={reset} className="rounded-lg bg-amber-700 px-4 py-2 text-white hover:bg-amber-800">
        Try again
      </button>
    </main>
  );
}
