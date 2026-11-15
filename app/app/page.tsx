import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-50 px-6 text-center text-stone-900">
      <h1 className="text-3xl font-semibold">Wedding invitations</h1>
      <p className="max-w-md text-stone-600">
        Beautiful invitation pages for every wedding event, made for wedding planners.
      </p>
      <Link href="/login" className="rounded-full bg-amber-700 px-6 py-3 text-white hover:bg-amber-800">
        Business login
      </Link>
    </main>
  );
}
