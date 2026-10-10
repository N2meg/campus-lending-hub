import { Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Category, ItemWithRelations } from "@/types/database";
import ItemsBrowser from "@/components/ItemsBrowser";
import UserSwitcher from "@/components/UserSwitcher";

async function getActiveItems(): Promise<ItemWithRelations[]> {
  const { data, error } = await supabase
    .from("items")
    .select(
      "item_id, owner_id, title, category_id, description, status, created_at, categories ( category_name ), users ( full_name, campus_email )"
    )
    .eq("status", "Available")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load items: ${error.message}`);
  }

  return (data ?? []) as unknown as ItemWithRelations[];
}

async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("category_id, category_name")
    .order("category_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return data ?? [];
}

function ItemsGridSkeleton() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-28 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    </div>
  );
}

// Fetches live data (items + categories) and hands it to the interactive
// ItemsBrowser client component. Reads uncached data (a live Supabase query),
// so it's rendered inside a <Suspense> boundary and streams in at request
// time instead of blocking the static shell.
async function ActiveItems() {
  let items: ItemWithRelations[] = [];
  let categories: Category[] = [];
  let loadError: string | null = null;

  try {
    [items, categories] = await Promise.all([
      getActiveItems(),
      getCategories(),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error";
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        <p className="font-semibold">Couldn&apos;t load items</p>
        <p className="mt-1">{loadError}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          No items available right now
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Check back later or ask a classmate to list something.
        </p>
      </div>
    );
  }

  return <ItemsBrowser items={items} categories={categories} />;
}

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 dark:border-zinc-800">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),_transparent_55%)]"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-5 px-6 py-20 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="w-fit rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur">
              Campus Lending Hub
            </span>
            <UserSwitcher />
          </div>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Borrow what you need, lend what you don&apos;t
          </h1>
          <p className="max-w-xl text-base text-indigo-100 sm:text-lg">
            Browse items currently available from your fellow students —
            books, lab equipment, electronics, and stationery — and send a
            borrow request in one click.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <a
              href="#listings"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50"
            >
              Browse items
            </a>
            <Link
              href="/requests"
              className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
            >
              My requests &amp; approvals
            </Link>
          </div>
        </div>
      </header>

      {/* How it works */}
      <section className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-10 sm:grid-cols-3 sm:px-8">
          {[
            {
              title: "1. Browse",
              desc: "Filter by category to find books, gear, or gadgets nearby.",
            },
            {
              title: "2. Request",
              desc: "Send a borrow request with one click using your campus email.",
            },
            {
              title: "3. Pick up",
              desc: "Coordinate with the owner and return it when you're done.",
            },
          ].map((step) => (
            <div key={step.title} className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {step.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <main
        id="listings"
        className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:px-8"
      >
        <Suspense fallback={<ItemsGridSkeleton />}>
          <ActiveItems />
        </Suspense>
      </main>
    </div>
  );
}

