import { useState } from "react";
import { mockInternships } from "../../data/mockInternships";
import { mockApplications } from "../../data/mockApplications";

type Tab = "overview" | "users" | "companies" | "internships";

const MOCK_USERS = [
  { id: 1, name: "Jane Doe",       email: "jane@example.com",   role: "STUDENT", status: "active",    joined: "2026-05-10" },
  { id: 2, name: "John Smith",     email: "john@nexora.dev",    role: "COMPANY", status: "active",    joined: "2026-05-12" },
  { id: 3, name: "Alice Mutoni",   email: "alice@example.com",  role: "STUDENT", status: "active",    joined: "2026-05-15" },
  { id: 4, name: "Bob Nkurunziza", email: "bob@finedge.africa", role: "COMPANY", status: "suspended", joined: "2026-05-18" },
  { id: 5, name: "Carol Uwase",    email: "carol@example.com",  role: "STUDENT", status: "active",    joined: "2026-06-01" },
];

const MOCK_COMPANIES = [
  { id: 101, name: "Nexora Labs",      industry: "Technology",        verified: true,  listings: 2 },
  { id: 102, name: "FinEdge Africa",   industry: "Fintech",           verified: true,  listings: 1 },
  { id: 103, name: "Bloom Collective", industry: "Media & Marketing", verified: false, listings: 1 },
  { id: 104, name: "Pathlight Studio", industry: "Design",            verified: true,  listings: 1 },
  { id: 106, name: "Verdant Holdings", industry: "Agribusiness",      verified: false, listings: 1 },
];

const ROLE_STYLES: Record<string, string> = {
  STUDENT: "bg-blue-500/15 text-blue-300",
  COMPANY: "bg-purple-500/15 text-purple-300",
  ADMIN:   "bg-red-500/15 text-red-300",
};

export default function AdminDashboard() {
  const [tab, setTab]             = useState<Tab>("overview");
  const [users, setUsers]         = useState(MOCK_USERS);
  const [companies, setCompanies] = useState(MOCK_COMPANIES);

  const stats = [
    { label: "Total Users",        value: users.length },
    { label: "Companies",          value: companies.length },
    { label: "Active Listings",    value: mockInternships.filter((i) => i.isActive).length },
    { label: "Total Applications", value: mockApplications.length },
  ];

  const toggleSuspend = (id: number) => {
    setUsers((prev) =>
      prev.map((u) => u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u)
    );
  };

  const toggleVerify = (id: number) => {
    setCompanies((prev) =>
      prev.map((c) => c.id === id ? { ...c, verified: !c.verified } : c)
    );
  };

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-full transition ${
      tab === t ? "bg-link-500 text-white" : "text-ink/60 hover:text-ink hover:bg-white/5"
    }`;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-12">

        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-ink/60">Manage users, companies, and platform activity.</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-surface/70 backdrop-blur-sm p-5">
              <p className="text-2xl font-bold text-ink">{s.value}</p>
              <p className="mt-1 text-sm text-ink/60">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          <button onClick={() => setTab("overview")}    className={tabClass("overview")}>Overview</button>
          <button onClick={() => setTab("users")}       className={tabClass("users")}>Users</button>
          <button onClick={() => setTab("companies")}   className={tabClass("companies")}>Companies</button>
          <button onClick={() => setTab("internships")} className={tabClass("internships")}>Internships</button>
        </div>

        {tab === "overview" && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-surface/70 backdrop-blur-sm p-6">
              <h3 className="font-display font-semibold text-ink">Recent Users</h3>
              <ul className="mt-4 space-y-3">
                {users.slice(0, 4).map((u) => (
                  <li key={u.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-ink">{u.name}</p>
                      <p className="text-ink/50">{u.email}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[u.role]}`}>{u.role}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-surface/70 backdrop-blur-sm p-6">
              <h3 className="font-display font-semibold text-ink">Pending Verifications</h3>
              <ul className="mt-4 space-y-3">
                {companies.filter((c) => !c.verified).map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-ink">{c.name}</p>
                      <p className="text-ink/50">{c.industry}</p>
                    </div>
                    <button onClick={() => toggleVerify(c.id)} className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-300 hover:bg-green-500/25">
                      Verify
                    </button>
                  </li>
                ))}
                {companies.filter((c) => !c.verified).length === 0 && (
                  <p className="text-sm text-ink/50">All companies verified ✓</p>
                )}
              </ul>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="mt-6 space-y-3">
            {users.map((u) => (
              <div key={u.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-surface/70 backdrop-blur-sm p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{u.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[u.role]}`}>{u.role}</span>
                    {u.status === "suspended" && (
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300">Suspended</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-ink/60">{u.email}</p>
                  <p className="mt-0.5 text-xs text-ink/40">Joined: {u.joined}</p>
                </div>
                <button
                  onClick={() => toggleSuspend(u.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    u.status === "active"
                      ? "border border-red-500/30 text-red-300 hover:bg-red-500/10"
                      : "border border-green-500/30 text-green-300 hover:bg-green-500/10"
                  }`}
                >
                  {u.status === "active" ? "Suspend" : "Reactivate"}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "companies" && (
          <div className="mt-6 space-y-3">
            {companies.map((c) => (
              <div key={c.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-surface/70 backdrop-blur-sm p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{c.name}</p>
                    {c.verified ? (
                      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-300">Verified</span>
                    ) : (
                      <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-300">Pending</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-ink/60">{c.industry} · {c.listings} listing{c.listings !== 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={() => toggleVerify(c.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    c.verified
                      ? "border border-red-500/30 text-red-300 hover:bg-red-500/10"
                      : "border border-green-500/30 text-green-300 hover:bg-green-500/10"
                  }`}
                >
                  {c.verified ? "Revoke" : "Verify"}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "internships" && (
          <div className="mt-6 space-y-3">
            {mockInternships.map((i) => (
              <div key={i.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-surface/70 backdrop-blur-sm p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{i.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${i.isActive ? "bg-green-500/15 text-green-300" : "bg-white/10 text-ink/50"}`}>
                      {i.isActive ? "Active" : "Closed"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink/60">{i.company?.companyName} · {i.location}</p>
                  <p className="mt-0.5 text-xs text-ink/40">
                    Deadline: {i.deadline} · {mockApplications.filter((a) => a.internshipId === i.id).length} applicant(s)
                  </p>
                </div>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-ink/60">
                  {i.category}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}