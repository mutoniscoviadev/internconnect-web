import { Link } from "react-router-dom";
import { useAuth } from "../../context/auth.context";
import { mockApplications } from "../../data/mockApplications";
import { mockInternships } from "../../data/mockInternships";

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  APPLIED:      { label: "Applied",      classes: "bg-blue-100 text-blue-700" },
  UNDER_REVIEW: { label: "Under Review", classes: "bg-yellow-100 text-yellow-700" },
  SHORTLISTED:  { label: "Shortlisted",  classes: "bg-purple-100 text-purple-700" },
  INTERVIEW:    { label: "Interview",    classes: "bg-orange-100 text-orange-700" },
  ACCEPTED:     { label: "Accepted",     classes: "bg-green-100 text-green-700" },
  REJECTED:     { label: "Rejected",     classes: "bg-red-100 text-red-700" },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getAvatarColor(name?: string) {
  const colors = ["bg-blue-600", "bg-purple-600", "bg-teal-600", "bg-orange-500", "bg-red-500"];
  return colors[(name?.charCodeAt(0) ?? 0) % colors.length];
}

export default function StudentDashboard() {
  const { user } = useAuth();

  const myApplications = mockApplications
    .filter((a) => a.studentId === user?.id)
    .map((a) => ({
      ...a,
      internship: mockInternships.find((i) => i.id === a.internshipId),
    }));

  const interviews  = myApplications.filter((a) => a.status === "INTERVIEW").length;
  const shortlisted = myApplications.filter((a) => a.status === "SHORTLISTED").length;
  const recommended = mockInternships.slice(0, 4);

  const aiTools = [
    { icon: "🧠", title: "AI CV Analyzer",  desc: "Score & improve your CV",   href: "/ai-tools/cv-analyzer" },
    { icon: "📝", title: "Cover Letter Gen", desc: "AI-written in seconds",      href: "/ai-tools/cover-letter" },
    { icon: "⭐", title: "Career Advisor",   desc: "Personalized path guidance", href: "/ai-tools/career-assistant" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FA] pb-16">

      {/* HERO HEADER */}
      <div
        className="px-6 py-10"
        style={{ background: "linear-gradient(135deg, #0F1E5C 0%, #1B4FD8 100%)" }}
      >
        <div className="mx-auto max-w-[1100px]">
          <p className="text-sm text-white/65">{greeting()},</p>
          <h1 className="text-3xl font-bold text-white mt-1">{user?.name ?? "Student"}</h1>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-6">

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Total Applications",   value: myApplications.length, sub: "+2 this week",    subColor: "text-[#1B4FD8]" },
                { label: "Interviews Scheduled", value: interviews,            sub: interviews > 0 ? "Upcoming" : "None yet", subColor: "text-teal-600" },
                { label: "Shortlisted",          value: shortlisted,           sub: shortlisted > 0 ? "Pending" : "None yet", subColor: "text-orange-500" },
                { label: "Saved Positions",      value: 6,                     sub: "3 closing soon",  subColor: "text-purple-600" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[#E8ECF2] bg-white p-5">
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-[#0F1729]">{stat.value}</p>
                  <p className={`mt-1 text-xs font-medium ${stat.subColor}`}>{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* AI Career Intelligence banner */}
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#0F1E5C] px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1B4FD8] text-2xl">✨</div>
                <div>
                  <p className="font-bold text-white">AI Career Intelligence</p>
                  <p className="mt-0.5 text-sm text-white/60">3 perfect matches found · CV score 82/100</p>
                </div>
              </div>
              <Link to="/ai-tools" className="shrink-0 rounded-full bg-[#1B4FD8] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700">
                Explore →
              </Link>
            </div>

            {/* Recommended internships */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-[#0F1729]">Recommended for You</h2>
                <Link to="/internships" className="text-sm font-medium text-[#1B4FD8]">View all</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {recommended.map((job) => {
                  const initials = getInitials(job.company?.companyName);
                  const avatarBg = getAvatarColor(job.company?.companyName);
                  const tags = job.requirements?.split(",").slice(0, 2).map((t) => t.trim()) ?? [];
                  return (
                    <div key={job.id} className="rounded-2xl border border-[#E8ECF2] bg-white p-5 transition hover:border-[#1B4FD8]">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${avatarBg} text-sm font-bold text-white`}>
                            {initials}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#0F1729] text-sm">{job.title}</h3>
                            <p className="text-xs text-slate-400">{job.company?.companyName}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-[#E8ECF2] px-2.5 py-0.5 text-xs text-slate-500">{tag}</span>
                        ))}
                        <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs text-green-700">
                          {job.location?.toLowerCase().includes("remote") ? "Remote" : "On-site"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-400">📍 {job.location}</span>
                        {job.isPaid && <span className="text-xs font-bold text-green-600">{job.stipend}</span>}
                      </div>
                      <Link to={`/internships/${job.id}`}
                        className="block w-full rounded-full border border-[#1B4FD8]/30 py-2 text-center text-sm font-semibold text-[#1B4FD8] transition hover:bg-[#EEF2FF]"
                      >
                        View details
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Applications */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-[#0F1729]">Recent Applications</h2>
                <Link to="/student/dashboard" className="text-sm font-medium text-[#1B4FD8]">View all</Link>
              </div>
              {myApplications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E8ECF2] bg-white py-12 text-center">
                  <p className="font-semibold text-[#0F1729]">No applications yet</p>
                  <p className="mt-1 text-sm text-slate-400">Start by browsing available internships.</p>
                  <Link to="/internships" className="mt-4 inline-block rounded-full bg-[#1B4FD8] px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    Browse internships
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {myApplications.slice(0, 3).map((app) => {
                    const status = STATUS_STYLES[app.status] ?? STATUS_STYLES.APPLIED;
                    const initials = getInitials(app.internship?.company?.companyName);
                    const avatarBg = getAvatarColor(app.internship?.company?.companyName);
                    return (
                      <div key={app.id} className="flex items-center gap-4 rounded-2xl border border-[#E8ECF2] bg-white p-4 transition hover:border-[#1B4FD8]">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${avatarBg} text-sm font-bold text-white`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-[#0F1729] text-sm">{app.internship?.title ?? "Unknown role"}</h3>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.classes}`}>{status.label}</span>
                          </div>
                          <p className="text-xs text-slate-400">{app.internship?.company?.companyName} · {app.internship?.location}</p>
                        </div>
                        <Link to={`/internships/${app.internship?.id}`}
                          className="shrink-0 rounded-full border border-[#E8ECF2] px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-[#1B4FD8] hover:text-[#1B4FD8]"
                        >
                          View →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SIDEBAR */}
          <div className="flex flex-col gap-5">

            {/* Profile card */}
            <div className="rounded-2xl border border-[#E8ECF2] bg-white p-6 lg:sticky lg:top-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4FD8] text-sm font-bold text-white">
                  {getInitials(user?.name)}
                </div>
                <div>
                  <h3 className="font-bold text-[#0F1729] text-sm">{user?.name}</h3>
                  <p className="text-xs text-slate-400">Student</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Profile completion</span>
                  <span className="font-bold text-[#1B4FD8]">75%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#E8ECF2]">
                  <div className="h-1.5 rounded-full bg-[#1B4FD8]" style={{ width: "75%" }} />
                </div>
              </div>
              <Link to="/student/profile" className="block w-full rounded-full bg-[#EEF2FF] py-2 text-center text-sm font-semibold text-[#1B4FD8] hover:bg-[#1B4FD8] hover:text-white transition">
                Complete Profile
              </Link>
            </div>

            {/* AI Career Tools */}
            <div className="rounded-2xl border border-[#E8ECF2] bg-white p-5">
              <h3 className="mb-3 text-[15px] font-bold text-[#0F1729]">AI Career Tools</h3>
              <div className="flex flex-col gap-2">
                {aiTools.map((tool) => (
                  <Link key={tool.title} to={tool.href}
                    className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-[#F8FAFC]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-lg">{tool.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-[#0F1729]">{tool.title}</p>
                      <p className="text-xs text-slate-400">{tool.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Upcoming Interview */}
            {interviews > 0 && (
              <div className="rounded-2xl border border-[#E8ECF2] bg-white p-5">
                <h3 className="mb-3 text-[15px] font-bold text-[#0F1729]">📅 Upcoming Interview</h3>
                {myApplications.filter((a) => a.interviewDate).slice(0, 1).map((app) => (
                  <div key={app.id}>
                    <p className="font-semibold text-[#0F1729] text-sm">{app.internship?.title}</p>
                    <p className="text-xs text-slate-400 mb-1">{app.internship?.company?.companyName}</p>
                    <p className="text-sm font-semibold text-teal-600">
                      {new Date(app.interviewDate!).toLocaleDateString()} · 10:00 AM
                    </p>
                    <button className="mt-3 w-full rounded-full border border-teal-200 py-2 text-sm font-semibold text-teal-600 transition hover:bg-teal-50">
                      Prepare for Interview
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}