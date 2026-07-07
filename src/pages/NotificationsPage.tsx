import { useEffect, useState } from "react";
import { getNotifications, markAsRead, markAllAsRead } from "../api/notifications.api";

// ── Types matching the real backend response ─────────────────

interface RealNotification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

// Derive a human title since the backend only sends `message`, not a separate title.
function getTitle(type: string): string {
  switch (type) {
    case "interview_scheduled": return "Interview Scheduled";
    case "application_status":  return "Application Update";
    case "job_alert":           return "New Match";
    case "deadline_reminder":   return "Deadline Reminder";
    default:                    return "Notification";
  }
}

function getIcon(type: string): string {
  switch (type) {
    case "interview_scheduled": return "📅";
    case "application_status":  return "🔔";
    case "job_alert":           return "✨";
    case "deadline_reminder":   return "⏰";
    default:                    return "🔔";
  }
}

function getAccent(type: string): { soft: string; strong: string } {
  switch (type) {
    case "interview_scheduled":
      return { soft: "#ECFDF5", strong: "#16A34A" };
    case "application_status":
      return { soft: "#EFF6FF", strong: "#2563EB" };
    case "job_alert":
      return { soft: "#EEF2FF", strong: "#4F46E5" };
    case "deadline_reminder":
      return { soft: "#FFFBEB", strong: "#D97706" };
    default:
      return { soft: "#F8F9FF", strong: "#64748B" };
  }
}

type Filter = "all" | "unread" | "applications" | "new";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",          label: "All" },
  { key: "unread",       label: "Unread" },
  { key: "applications", label: "Applications" },
  { key: "new",          label: "New Matches" },
];

function matchesFilter(n: RealNotification, filter: Filter): boolean {
  if (filter === "unread")       return !n.read;
  if (filter === "applications") return n.type === "application_status" || n.type === "interview_scheduled";
  if (filter === "new")          return n.type === "job_alert";
  return true;
}

// ── Component ─────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<RealNotification[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data: any = await getNotifications();
        if (!cancelled) setNotifications(data?.notifications ?? []);
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message ?? err.message ?? "Failed to load notifications");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = notifications.filter((n) => matchesFilter(n, filter));
  const todayItems = filtered.filter((n) => isToday(n.createdAt));
  const earlierItems = filtered.filter((n) => !isToday(n.createdAt));

  const handleMarkAllRead = async () => {
    const prev = notifications;
    setNotifications((p) => p.map((n) => ({ ...n, read: true }))); // optimistic
    try {
      await markAllAsRead();
    } catch {
      setNotifications(prev); // revert on failure
    }
  };

  const handleMarkRead = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.read) return; // already read, skip the call
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))); // optimistic
    try {
      await markAsRead(id);
    } catch {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n))); // revert
    }
  };

  const renderGroup = (label: string, items: RealNotification[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-7">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <div className="flex flex-col gap-3">
          {items.map((notif) => {
            const accent = getAccent(notif.type);
            const icon = getIcon(notif.type);
            const title = getTitle(notif.type);

            return (
              <div
                key={notif.id}
                onClick={() => handleMarkRead(notif.id)}
                className="group relative flex gap-4 rounded-2xl border border-[#E8ECF2] bg-white p-4 pl-5 transition cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                style={{ borderLeft: `3px solid ${notif.read ? "#E2E8F0" : accent.strong}` }}
              >
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ backgroundColor: accent.soft }}
                >
                  {icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${notif.read ? "font-medium text-[#0F1729]" : "font-bold text-[#0F1729]"}`}>
                      {title}
                    </p>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(notif.createdAt)}</span>
                      {!notif.read && (
                        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: accent.strong }} />
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{notif.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F4F6FA" }}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

        {/* Header */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F1729]">Notifications</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="rounded-full bg-[#1B4FD8] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="mb-7 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                filter === f.key
                  ? "bg-[#1B4FD8] text-white shadow-sm"
                  : "border border-[#E2E8F0] bg-white text-slate-500 hover:border-[#1B4FD8] hover:text-[#1B4FD8]"
              }`}
            >
              {f.label}
              {f.key === "unread" && unreadCount > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === "unread" ? "bg-white/25" : "bg-[#EEF2FF] text-[#1B4FD8]"}`}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white py-20 text-center">
            <p className="text-sm text-slate-400">Loading notifications…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-white py-20 text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white py-20 text-center">
            <span className="text-5xl">🔔</span>
            <p className="mt-4 text-base font-semibold text-[#0F1729]">No notifications here</p>
            <p className="mt-1 text-sm text-slate-400">
              {filter === "unread" ? "You're all caught up!" : "Nothing to show for this filter."}
            </p>
          </div>
        ) : (
          <>
            {renderGroup("Today", todayItems)}
            {renderGroup("Earlier", earlierItems)}
          </>
        )}

      </div>
    </div>
  );
}