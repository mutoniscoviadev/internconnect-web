import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyApplications } from "../../api/applications.api";

const ALL_STATUSES = ["All", "Applied", "Reviewed", "Shortlisted", "Accepted", "Rejected"];

const STATUS_STYLES: Record<string, { label: string; classes: string; filter: string }> = {
  applied:      { label: "Applied",      classes: "bg-blue-100 text-blue-700",   filter: "Applied" },
  under_review: { label: "Under Review", classes: "bg-yellow-100 text-yellow-700", filter: "Reviewed" },
  reviewed:     { label: "Reviewed",     classes: "bg-yellow-100 text-yellow-700", filter: "Reviewed" },
  shortlisted:  { label: "Shortlisted",  classes: "bg-purple-100 text-purple-700", filter: "Shortlisted" },
  interview:    { label: "Interview",    classes: "bg-orange-100 text-orange-700", filter: "Shortlisted" },
  accepted:     { label: "Accepted",     classes: "bg-emerald-100 text-emerald-700",  filter: "Accepted" },
  rejected:     { label: "Rejected",     classes: "bg-red-100 text-red-700",     filter: "Rejected" },
};

const AVATAR_GRADIENTS = [
  "from-[#0E7C9C] to-[#1B4FD8]",
  "from-[#1B4FD8] to-[#5B3DE0]",
  "from-[#0C7A8F] to-[#0EA5A0]",
  "from-[#1268B3] to-[#1B4FD8]",
  "from-[#0E7C9C] to-[#2563EB]",
];

function getInitials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getAvatarGradient(name?: string) {
  return AVATAR_GRADIENTS[(name?.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length];
}

// Shape returned by the real backend for GET /applications/my
// Adjust field names below (application.internship, application.internship.company, etc.)
// to match whatever your backend's Swagger docs actually return.
interface RealApplication {
  id: string;
  studentId: string;
  listingId: string;
  status: string;
  appliedAt: string;
  coverLetterUrl?: string | null;
  interviewDate?: string;
  interviewTime?: string;
  interviewMode?: string;
  interviewLocation?: string;
  interviewNotes?: string;
  listing?: {
    title: string;
    location?: string;
    duration?: string;
    stipend?: string;
    deadline?: string;
    status?: string;
    employer?: { companyName?: string; logoUrl?: string | null };
  };
}

export default function ApplicationsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [applications, setApplications] = useState<RealApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyApplications();
        const list = (data as any)?.applications ?? [];
        if (!cancelled) setApplications(list);
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message ?? err.message ?? "Failed to load applications");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = activeFilter === "All"
    ? applications
    : applications.filter((a) => STATUS_STYLES[a.status]?.filter === activeFilter);

  const stats = [
    { label: "Total",       value: applications.length },
    { label: "Shortlisted", value: applications.filter((a) => a.status === "SHORTLISTED").length },
    { label: "Accepted",    value: applications.filter((a) => a.status === "ACCEPTED").length },
    { label: "Rejected",    value: applications.filter((a) => a.status === "REJECTED").length },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FA] pb-16">

      {/* HERO HEADER */}
      <div className="bg-gradient-to-r from-[#0C7A8F] via-[#1268B3] to-[#1B4FD8] px-6 py-10">
        <div className="mx-auto max-w-[1100px]">
          <h1 className="text-3xl font-bold text-white">Applications</h1>
          <p className="mt-1 text-sm text-white/70">Track your internship journey</p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="mt-0.5 text-xs text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-[1100px] px-6 py-8">

        <div className="mb-6 flex flex-wrap gap-2">
          {ALL_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeFilter === status
                  ? "bg-gradient-to-r from-[#0E7C9C] to-[#1B4FD8] text-white shadow-sm"
                  : "border border-[#E8ECF2] bg-white text-slate-500 hover:border-[#1B4FD8] hover:text-[#1B4FD8]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-[#E8ECF2] bg-white py-16 text-center">
            <p className="text-sm text-slate-400">Loading your applications…</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-dashed border-red-200 bg-white py-16 text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#E8ECF2] bg-white py-16 text-center">
            <p className="text-base font-semibold text-[#0B1224]">No applications yet</p>
            <p className="mt-1 text-sm text-slate-400">Start by browsing available internships.</p>
            <Link
              to="/internships"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#0E7C9C] to-[#1B4FD8] px-6 py-2.5 text-sm font-semibold text-white hover:shadow-md transition"
            >
              Browse internships
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((app) => {
              const status = STATUS_STYLES[app.status] ?? STATUS_STYLES.APPLIED;
              const companyName = app.listing?.employer?.companyName;
              const initials = getInitials(companyName);
              const avatarGradient = getAvatarGradient(companyName);
              const hasInterview = !!app.interviewDate;

              return (
                <div
                  key={app.id}
                  className="rounded-2xl border border-[#E8ECF2] bg-white p-5 transition hover:border-[#1B4FD8]/40 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGradient} text-sm font-bold text-white`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-[#0B1224]">{app.listing?.title ?? "Unknown role"}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.classes}`}>
                          {status.label}
                        </span>
                        {hasInterview && (
                          <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                            📅 Interview
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{companyName} · {app.listing?.location}</p>
                      <p className="mt-0.5 text-xs text-slate-400">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                    </div>
                    <Link
                      to={`/internships/${app.listingId}`}
                      className="shrink-0 rounded-full border border-[#E8ECF2] px-4 py-2 text-sm font-medium text-slate-500 transition hover:border-[#1B4FD8] hover:text-[#1B4FD8]"
                    >
                      View →
                    </Link>
                  </div>

                  {hasInterview && (
                    <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#0B1224]">
                        <span>🗓️</span>
                        {new Date(`${app.interviewDate}T00:00:00`).toLocaleDateString(undefined, {
                          weekday: "long", month: "long", day: "numeric", year: "numeric",
                        })}
                        <span className="text-slate-300">·</span>
                        {app.interviewTime}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-600">
                        <span>{app.interviewMode === "virtual" ? "💻" : "📍"}</span>
                        <span className="break-all">{app.interviewLocation}</span>
                      </div>
                      {app.interviewNotes && (
                        <p className="mt-1.5 text-xs text-slate-500">{app.interviewNotes}</p>
                      )}
                      <p className="mt-2 text-[11px] text-slate-400">
                        📧 A confirmation was sent to your email when this was scheduled.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}