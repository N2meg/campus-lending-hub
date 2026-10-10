"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Category } from "@/types/database";
import Modal from "@/components/Modal";

type SubmitState = "idle" | "loading" | "error";

// Lets the currently "logged in" user (see AuthContext/UserSwitcher) list a
// new item for lending. Opens as a modal from a trigger button rendered on
// the home page listings toolbar.
export default function AddItemModal({
  categories,
}: {
  categories: Category[];
}) {
  const { currentUser } = useAuth();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">(
    categories[0]?.category_id ?? ""
  );
  const [description, setDescription] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setCategoryId(categories[0]?.category_id ?? "");
    setDescription("");
    setState("idle");
    setError(null);
  }

  function handleClose() {
    setOpen(false);
    resetForm();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      setError("No active user selected. Pick a user from the switcher first.");
      return;
    }

    if (!title.trim() || categoryId === "") {
      setError("Title and category are required.");
      return;
    }

    setState("loading");
    setError(null);

    const { error: insertError } = await supabase.from("items").insert({
      owner_id: currentUser.user_id,
      title: title.trim(),
      category_id: categoryId,
      description: description.trim() || null,
      status: "Available",
    });

    if (insertError) {
      setState("error");
      setError(insertError.message);
      return;
    }

    handleClose();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
      >
        + Add item
      </button>

      <Modal open={open} onClose={handleClose} title="List a new item">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="item-title"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Title
            </label>
            <input
              id="item-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={150}
              placeholder="e.g. Scientific Calculator"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="item-category"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Category
            </label>
            <select
              id="item-category"
              value={categoryId}
              onChange={(event) => setCategoryId(Number(event.target.value))}
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              {categories.length === 0 && <option value="">No categories</option>}
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="item-description"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Description (optional)
            </label>
            <textarea
              id="item-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Condition, accessories included, pickup notes..."
              className="resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={state === "loading"}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state === "loading" ? "Listing…" : "List item"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
