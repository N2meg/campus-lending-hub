import Link from "next/link";
import UserSwitcher from "@/components/UserSwitcher";
import RequestsBoard from "@/components/RequestsBoard";

export default function RequestsPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-1">
            <Link
              href="/"
              className="w-fit text-xs font-semibold uppercase tracking-wide text-indigo-600 hover:underline dark:text-indigo-400"
            >
              ← Back to listings
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              My Requests &amp; Approvals
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Review requests for items you own, and track the status of
              items you&apos;ve requested to borrow.
            </p>
          </div>
          <UserSwitcher variant="dark" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:px-8">
        <RequestsBoard />
      </main>
    </div>
  );
}
