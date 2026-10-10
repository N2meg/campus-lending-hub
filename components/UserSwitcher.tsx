"use client";

import { useAuth } from "@/context/AuthContext";

// Dropdown that lets the demo session "log in" as any seeded user, so
// ownership and borrow-request workflows can be tested end to end without a
// real authentication system.
//
// `variant="light"` (default) is tuned for the indigo hero banner on the
// home page; `variant="dark"` is tuned for use on a plain white/zinc header
// background, like the requests page.
export default function UserSwitcher({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { users, currentUser, loading, error, switchUser } = useAuth();

  const isDark = variant === "dark";

  if (error) {
    return (
      <p
        className={`text-xs font-medium ${
          isDark ? "text-red-600 dark:text-red-400" : "text-red-200"
        }`}
        role="alert"
      >
        {error}
      </p>
    );
  }

  if (loading) {
    return (
      <div
        className={`h-9 w-48 animate-pulse rounded-full ${
          isDark ? "bg-zinc-200 dark:bg-zinc-800" : "bg-white/10"
        }`}
      />
    );
  }

  if (users.length === 0) {
    return (
      <p
        className={`text-xs font-medium ${
          isDark ? "text-zinc-500 dark:text-zinc-400" : "text-white/80"
        }`}
      >
        No seeded users found.
      </p>
    );
  }

  return (
    <label
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm backdrop-blur ${
        isDark
          ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          : "border-white/30 bg-white/10 text-white"
      }`}
    >
      <span
        className={`text-xs font-semibold uppercase tracking-wide ${
          isDark ? "text-zinc-500 dark:text-zinc-400" : "text-white/70"
        }`}
      >
        Acting as
      </span>
      <select
        value={currentUser?.user_id ?? ""}
        onChange={(event) => switchUser(Number(event.target.value))}
        className={`cursor-pointer bg-transparent text-sm font-medium outline-none ${
          isDark
            ? "text-zinc-900 dark:text-zinc-50 [&>option]:text-zinc-900"
            : "text-white [&>option]:text-zinc-900"
        }`}
        aria-label="Switch active user"
      >
        {users.map((user) => (
          <option key={user.user_id} value={user.user_id}>
            {user.full_name}
          </option>
        ))}
      </select>
    </label>
  );
}

