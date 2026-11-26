import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-50 px-6 text-center text-stone-900">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="max-w-md text-stone-600">The page you are looking for does not exist.</p>
      <Link href="/" className="rounded-lg bg-amber-700 px-4 py-2 text-white hover:bg-amber-800">
        Go to the home page
      </Link>
    </main>
  );
}
