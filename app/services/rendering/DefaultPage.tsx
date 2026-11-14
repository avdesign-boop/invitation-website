export function DefaultPage({ brideName, groomName }: { brideName: string; groomName: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 text-center text-stone-900">
      <p className="text-sm uppercase tracking-[0.3em] text-amber-700">Together with their families</p>
      <h1 className="mt-6 text-4xl font-semibold">
        {groomName} &amp; {brideName}
      </h1>
    </main>
  );
}
