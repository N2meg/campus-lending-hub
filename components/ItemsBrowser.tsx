"use client";

import { useMemo, useState } from "react";
import type { Category, ItemWithRelations } from "@/types/database";
import BorrowRequestModal from "@/components/BorrowRequestModal";
import AddItemModal from "@/components/AddItemModal";

const statusStyles: Record<string, string> = {
  Available:
    "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950 dark:text-green-400",
  Pending:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-400",
  Borrowed:
    "bg-zinc-100 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-300",
};

export default function ItemsBrowser({
  items,
  categories,
}: {
  items: ItemWithRelations[];
  categories: Category[];
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | "all"
  >("all");

  const filteredItems = useMemo(() => {
    if (selectedCategoryId === "all") return items;
    return items.filter((item) => item.category_id === selectedCategoryId);
  }, [items, selectedCategoryId]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Available items
        </h2>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
            {filteredItems.length} of {items.length} listing
            {items.length === 1 ? "" : "s"}
          </span>
          <AddItemModal categories={categories} />
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategoryId("all")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            selectedCategoryId === "all"
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-zinc-300 bg-white text-zinc-700 hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
          }`}
        >
          All categories
        </button>
        {categories.map((category) => (
          <button
            type="button"
            key={category.category_id}
            onClick={() => setSelectedCategoryId(category.category_id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategoryId === category.category_id
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
            }`}
          >
            {category.category_name}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            No items match this filter
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Try a different category or check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <article
              key={item.item_id}
              className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {item.title}
                  </h3>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      statusStyles[item.status] ?? statusStyles.Available
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {item.categories?.category_name && (
                  <span className="inline-flex w-fit items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {item.categories.category_name}
                  </span>
                )}

                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {item.description || "No description provided."}
                </p>

                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  Listed by{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {item.users?.full_name ?? "Unknown owner"}
                  </span>
                </p>
              </div>

              <div className="mt-6">
                <BorrowRequestModal
                  itemId={item.item_id}
                  itemTitle={item.title}
                  ownerId={item.owner_id}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
