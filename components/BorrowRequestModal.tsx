"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Modal from "@/components/Modal";

type SubmitState = "idle" | "loading" | "error" | "success";

// Replaces the old prompt()-based BorrowButton flow: opens a modal so the
// current "logged in" user (see AuthContext) can pick a requested return
// date and leave a note for the owner before sending a borrow_requests row.
export default function BorrowRequestModal({
  itemId,
  itemTitle,
  ownerId,
}: {
  itemId: number;
  itemTitle: string;
  ownerId: number;
}) {
  const { currentUser } = useAuth();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [returnDate, setReturnDate] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const isOwnItem = currentUser?.user_id === ownerId;

  function resetForm() {
    setReturnDate("");
    setNote("");
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

    setState("loading");
    setError(null);

    const { error: insertError } = await supabase.from("borrow_requests").insert({
      item_id: itemId,
      borrower_id: currentUser.user_id,
      status: "Pending",
      requested_return_date: returnDate || null,
      note: note.trim() || null,
    });

    if (insertError) {
      setState("error");
      setError(insertError.message);
      return;
    }

    // Mark the item as Pending while the owner reviews the request.
    await supabase.from("items").update({ status: "Pending" }).eq("item_id", itemId);

    setState("success");
    router.refresh();
  }

  if (isOwnItem) {
    return (
      <p className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        This is your item
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
      >
        Borrow this item
      </button>

      <Modal open={open} onClose={handleClose} title={`Request "${itemTitle}"`}>
        {state === "success" ? (
          <div className="flex flex-col gap-4">
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
              Request sent! The owner will review it shortly.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="return-date"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Requested return date (optional)
              </label>
              <input
                id="return-date"
                type="date"
                min={today}
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="borrow-note"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Note to owner (optional)
              </label>
              <textarea
                id="borrow-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Let the owner know why you need it or when you'll pick it up."
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
                {state === "loading" ? "Sending…" : "Send request"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
