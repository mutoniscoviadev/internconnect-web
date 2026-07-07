import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth.context";
import { getProfile } from "../../api/employer.api";
import { getMyListings } from "../../api/listings.api";
import { getListingApplications } from "../../api/applications.api";

function getInitials(name?: string) {
  if (!name) return "CO";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getAvatarColor(name?: string) {
  const colors = ["bg-blue-600", "bg-purple-600", "bg-green-600", "bg-orange-600", "bg-red-600", "bg-teal-600"];
  return colors[(name?.charCodeAt(0) ?? 0) % colors.length];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

interface Listing {
  id: string;
  title: string;
  location?: string;
  status?: string;
  displayStatus?: string;
}

interface ApplicantEntry {
  id: string;
  status: string;
  listingId: string;
  listingTitle: string;
  student?: { user?: { name?: string } };
  applicantName?: string | null;
}

export default function CompanyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [applicants, setApplicants] = useState<ApplicantEntry[]>([]);
  const [applicantCountByListing, setApplicantCountByListing] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [profileRes, listingsRes] = await Promise.all([
          getProfile() as Promise<any>,
          getMyListings() as Promise<any>,
        ]);

        if (cancelled) return;

        const employerProfile = profileRes?.employer ?? profileRes;
        setCompanyName(employerProfile?.companyName ?? null);

        const myListings: Listing[] = listingsRes?.listings ?? [];
        setListings(myListings);

        const results = await Promise.all(
          myListings.map(async (listing) => {
            try {
              const res: any = await getListingApplications(listing.id);
              const apps = res?.applications ?? [];
              return {
                listingId: listing.id,
                count: apps.length,
                apps: apps.map((a: any) => ({ ...a, listingId: listing.id, listingTitle: listing.title })),
              };
            } catch {
              return { listingId: listing.id, count: 0, apps: [] };
            }
          })
        );

        if (cancelled) return;

        const countMap: Record<string, number> = {};
        const allApps: ApplicantEntry[] = [];
        for (const r of results) {
          countMap[r.listingId] = r.count;
          allApps.push(...r.apps);
        }
        setApplicantCountByListing(countMap);
        setApplicants(allApps);
      } catch {
        // fall through — page renders with zeroed/empty state below
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const displayName = companyName ?? user?.name ?? "My Company";

  const stats = {
    listings: listings.filter((l) => l.status === "open" || l.displayStatus === "open").length,
    applicants: applicants.length,
    alerts: applicants.filter((a) => a.status === "shortlisted").length,
  };

  const recentListings = listings.slice(0, 4);
  const recentApplicants = applicants.slice(0, 4);

  const quickActions = [
    {
      label: "Post a new internship",
      sub: "Create a listing in minutes",
      onClick: () => navigate("/company/listings", { state: { openForm: true } }),
      icon: (
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      label: "Review applicants",
      sub: `${stats.applicants} total applications`,
      onClick: () => navigate("/company/applicants"),
      icon: (
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 110-8 4 4 0 010 8zm6 0a3 3 0 110-6 3 3 0 010 6zM3 14a3 3 0 110-6 3 3 0 010 6z" />
        </svg>
      ),
    },
    {
      label: "Manage listings",
      sub: `${listings.length} listings total`,
      onClick: () => navigate("/company/listings"),
      icon: (
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: "#F4F6FA" }}>
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col gap-6">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-md ${getAvatarColor(displayName)}`}>
              {getInitials(displayName)}
            </div>
            <div>
              <p className="text-sm text-slate-400">{greeting()},</p>
              <h1 className="text-2xl font-bold text-[#0F1729]">{displayName}</h1>
            </div>
          </div>
          <button
            onClick={() => navigate("/notifications")}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#E8ECF2] bg-white shadow-sm transition hover:border-[#1B4FD8]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5 text-[#0F1729]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {stats.alerts > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {stats.alerts}
              </span>
            )}
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Active listings", value: loading ? "—" : stats.listings, icon: "📋", bg: "#EEF2FF", text: "#1B4FD8" },
            { label: "Total applicants", value: loading ? "—" : stats.applicants, icon: "👥", bg: "#ECFDF5", text: "#059669" },
            { label: "Shortlisted", value: loading ? "—" : stats.alerts, icon: "⭐", bg: "#FFFBEB", text: "#D97706" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-[#E8ECF2] bg-white p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: s.bg }}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1729]">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Two-column: main content + quick actions sidebar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">

          {/* LEFT — recent listings & applicants */}
          <div className="flex flex-col gap-6">

            {/* Recent Listings */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-[#0F1729]">Recent Listings</h2>
                <button onClick={() => navigate("/company/listings")} className="text-sm font-medium text-[#1B4FD8] hover:underline">
                  View all
                </button>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-dashed border-[#E8ECF2] bg-white py-14 text-center px-6">
                  <p className="text-sm text-slate-400">Loading listings…</p>
                </div>
              ) : recentListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8ECF2] bg-white py-14 text-center px-6">
                  <p className="font-semibold text-[#0F1729]">No listings yet</p>
                  <p className="mt-1 text-sm text-slate-400">Post your first internship to start receiving applicants</p>
                  <button
                    onClick={() => navigate("/company/listings", { state: { openForm: true } })}
                    className="mt-5 rounded-full bg-[#1B4FD8] px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    + Post Internship
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentListings.map((listing) => {
                    const applicantCount = applicantCountByListing[listing.id] ?? 0;
                    const isOpen = listing.status === "open" || listing.displayStatus === "open";
                    const initials = getInitials(listing.title);
                    const avatarBg = getAvatarColor(listing.title);
                    return (
                      <button
                        key={listing.id}
                        onClick={() => navigate("/company/listings")}
                        className="flex items-center gap-4 rounded-2xl border border-[#E8ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[#1B4FD8] hover:shadow-md"
                      >
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${avatarBg} text-sm font-bold text-white`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-[#0F1729] truncate">{listing.title}</h3>
                            <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${isOpen ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"}`}>
                              {isOpen ? "Open" : "Closed"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {listing.location} · {applicantCount} applicant{applicantCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <svg className="h-4 w-4 flex-shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Applicants */}
            {!loading && recentApplicants.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[15px] font-bold text-[#0F1729]">Recent Applicants</h2>
                  <button onClick={() => navigate("/company/applicants")} className="text-sm font-medium text-[#1B4FD8] hover:underline">
                    View all
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {recentApplicants.map((app) => {
                    const applicantName = app.student?.user?.name ?? app.applicantName ?? "Unknown applicant";
                    return (
                      <button
                        key={app.id}
                        onClick={() => navigate("/company/applicants")}
                        className="flex items-center gap-4 rounded-2xl border border-[#E8ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[#1B4FD8] hover:shadow-md"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-sm font-bold text-[#1B4FD8]">
                          🧑
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0F1729] truncate">{applicantName}</p>
                          <p className="text-xs text-slate-400">{app.listingTitle} · Status: {app.status}</p>
                        </div>
                        <svg className="h-4 w-4 flex-shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — quick actions sidebar */}
          <div className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
            <h2 className="text-[15px] font-bold text-[#0F1729] mb-1">Quick actions</h2>
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex items-center gap-3 rounded-2xl border border-[#E8ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[#1B4FD8] hover:shadow-md"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1B4FD8] shadow-sm shadow-blue-200">
                  {action.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0F1729]">{action.label}</p>
                  <p className="text-xs text-slate-400 truncate">{action.sub}</p>
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}