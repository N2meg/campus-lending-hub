"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { BorrowRequestWithRelations } from "@/types/database";

type ActionState = Record<number, "approving" | "rejecting" | "returning" | undefined>;

const REQUEST_SELECT =
  "request_id, item_id, borrower_id, status, requested_at, returned_at, requested_return_date, note, items ( item_id, title, status, owner_id, users ( full_name, campus_email ) ), users ( full_name, campus_email )";

const statusStyles: Record<string, string> = {
  Pending:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-400",
  Approved:
    "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950 dark:text-green-400",
  Rejected:
    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-400",
  Returned:
    "bg-zinc-100 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-300",
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Powers the "My Requests / Approvals" page. Fetches two views of
// borrow_requests for the currently "logged in" demo user (see
// AuthContext): items they own that others want to borrow (which they can
// approve/reject), and items they've requested to borrow (read-only status).
export default function RequestsBoard() {
  const { currentUser, loading: authLoading } = useAuth();

  const [incoming, setIncoming] = useState<BorrowRequestWithRelations[]>([]);
  const [outgoing, setOutgoing] = useState<BorrowRequestWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>({});
  const [actionError, setActionError] = useState<string | null>(null);
  // Bumped after a mutation (approve/reject/mark returned) to trigger a
  // refetch inside the effect below, without calling setState directly in
  // the effect body (see react-hooks/set-state-in-effect).
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    // No setState here for the "no user" case — handled purely at render
    // time below — so this effect never calls setState synchronously in
    // its body (see react-hooks/set-state-in-effect).
    if (authLoading || !currentUser) return;

    let isMounted = true;

    async function loadRequests(userId: number) {
      setLoading(true);
      setError(null);

      const [incomingRes, outgoingRes] = await Promise.all([
        supabase
          .from("borrow_requests")
          .select(REQUEST_SELECT)
          .eq("items.owner_id", userId)
          .order("requested_at", { ascending: false }),
        supabase
          .from("borrow_requests")
          .select(REQUEST_SELECT)
          .eq("borrower_id", userId)
          .order("requested_at", { ascending: false }),
      ]);

      if (!isMounted) return;

      if (incomingRes.error) {
        setError(`Failed to load incoming requests: ${incomingRes.error.message}`);
        setLoading(false);
        return;
      }

      if (outgoingRes.error) {
        setError(`Failed to load your requests: ${outgoingRes.error.message}`);
        setLoading(false);
        return;
      }

      // The `.eq("items.owner_id", ...)` filter applies to the joined
      // table, but PostgREST still requires the row's item to exist, so
      // filter out any rows where the join didn't match the owner
      // (defensive — see
      // https://postgrest.org/en/stable/references/api/resource_embedding.html).
      const incomingData = (
        (incomingRes.data ?? []) as unknown as BorrowRequestWithRelations[]
      ).filter((request) => request.items?.owner_id === userId);

      setIncoming(incomingData);
      setOutgoing((outgoingRes.data ?? []) as unknown as BorrowRequestWithRelations[]);
      setLoading(false);
    }

    loadRequests(currentUser.user_id);

    return () => {
      isMounted = false;
    };
  }, [authLoading, currentUser, reloadToken]);

  async function handleDecision(
    request: BorrowRequestWithRelations,
    decision: "Approved" | "Rejected"
  ) {
    setActionError(null);
    setActionState((prev) => ({
      ...prev,
      [request.request_id]: decision === "Approved" ? "approving" : "rejecting",
    }));

    const { error: updateError } = await supabase
      .from("borrow_requests")
      .update({ status: decision })
      .eq("request_id", request.request_id);

    if (updateError) {
      setActionError(updateError.message);
      setActionState((prev) => ({ ...prev, [request.request_id]: undefined }));
      return;
    }

    // Keep the item's status in sync with the decision.
    await supabase
      .from("items")
      .update({ status: decision === "Approved" ? "Borrowed" : "Available" })
      .eq("item_id", request.item_id);

    setActionState((prev) => ({ ...prev, [request.request_id]: undefined }));
    setReloadToken((token) => token + 1);
  }

  async function handleMarkReturned(request: BorrowRequestWithRelations) {
    setActionError(null);
    setActionState((prev) => ({ ...prev, [request.request_id]: "returning" }));

    const { error: updateError } = await supabase
      .from("borrow_requests")
      .update({ status: "Returned", returned_at: new Date().toISOString() })
      .eq("request_id", request.request_id);

    if (updateError) {
      setActionError(updateError.message);
      setActionState((prev) => ({ ...prev, [request.request_id]: undefined }));
      return;
    }

    await supabase
      .from("items")
      .update({ status: "Available" })
      .eq("item_id", request.item_id);

    setActionState((prev) => ({ ...prev, [request.request_id]: undefined }));
    setReloadToken((token) => token + 1);
  }

  if (authLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          No active user
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Pick a user from the switcher on the home page first.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        <p className="font-semibold">Couldn&apos;t load requests</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {actionError && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
          {actionError}
        </p>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Incoming requests for your items
        </h2>
        {incoming.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No one has requested to borrow your items yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {incoming.map((request) => {
              const busy = actionState[request.request_id];
              return (
                <article
                  key={request.request_id}
                  className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {request.items?.title ?? "Unknown item"}
                    </h3>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        statusStyles[request.status] ?? statusStyles.Pending
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Requested by{" "}
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {request.users?.full_name ?? "Unknown borrower"}
                    </span>
                  </p>

                  {request.requested_return_date && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      Wants it back by{" "}
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {formatDate(request.requested_return_date)}
                      </span>
                    </p>
                  )}

                  {request.note && (
                    <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                      &ldquo;{request.note}&rdquo;
                    </p>
                  )}

                  <p className="text-xs text-zinc-400 dark:text-zinc-600">
                    Requested {formatDate(request.requested_at)}
                  </p>

                  {request.status === "Pending" && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => handleDecision(request, "Approved")}
                        className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busy === "approving" ? "Approving…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => handleDecision(request, "Rejected")}
                        className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busy === "rejecting" ? "Rejecting…" : "Reject"}
                      </button>
                    </div>
                  )}

                  {request.status === "Approved" && (
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => handleMarkReturned(request)}
                      className="mt-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {busy === "returning" ? "Marking…" : "Mark as returned"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Your borrow requests
        </h2>
        {outgoing.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You haven&apos;t requested to borrow anything yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {outgoing.map((request) => (
              <article
                key={request.request_id}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {request.items?.title ?? "Unknown item"}
                  </h3>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      statusStyles[request.status] ?? statusStyles.Pending
                    }`}
                  >
                    {request.status}
                  </span>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Owned by{" "}
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {request.items?.users?.full_name ?? "Unknown owner"}
                  </span>
                </p>

                {request.requested_return_date && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    Your requested return date:{" "}
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {formatDate(request.requested_return_date)}
                    </span>
                  </p>
                )}

                {request.note && (
                  <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                    &ldquo;{request.note}&rdquo;
                  </p>
                )}

                <p className="text-xs text-zinc-400 dark:text-zinc-600">
                  Requested {formatDate(request.requested_at)}
                  {request.returned_at &&
                    ` · Returned ${formatDate(request.returned_at)}`}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

