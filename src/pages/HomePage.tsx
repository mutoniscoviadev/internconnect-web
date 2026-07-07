import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { getListings } from "../api/listings.api";
import { getProfile, getRecommendations } from "../api/student.api";
import { useAuth } from "../context/auth.context";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Matches your real Student model fields — no `phone` or `experience` column exists,
// so those were dropped from the strength calc (mock version had them).
function computeProfileStrength(profile: any): number {
  if (!profile) return 0;
  const weights: [any, number][] = [
    [profile.university, 15],
    [profile.faculty, 10],
    [profile.department, 10],
    [profile.year, 10],
    [profile.gpa, 10],
    [profile.skills, 15],
    [profile.bio, 10],
    [profile.cvUrl, 20],
  ];
  return weights.reduce((sum, [val, w]) => sum + (val ? w : 0), 0);
}

function extractProfile(raw: unknown): any {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, any>;
  return obj.student ?? obj.profile ?? obj;
}

interface Listing {
  id: string;
  title: string;
  description?: string;
  skills?: string | null;
  location?: string | null;
  duration?: string | null;
  stipend?: string | null;
  deadline?: string | null;
  openings?: number;
  status?: string;
  displayStatus?: string;
  employer?: { companyName?: string; verified?: boolean; logoUrl?: string | null };
}

function extractListings(raw: unknown): Listing[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.listings)) return obj.listings as Listing[];
    if (Array.isArray(obj.recommendations)) return obj.recommendations as Listing[];
    if (Array.isArray(obj.data)) return obj.data as Listing[];
  }
  return [];
}

function skillTags(skills?: string | null, max = 3) {
  return (skills ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, max);
}

function LoggedInHome({ name }: { userId: string; name: string }) {
  const [strength, setStrength] = useState(0);
  const [strengthLoading, setStrengthLoading] = useState(true);

  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);

  const [recommended, setRecommended] = useState<Listing | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await getProfile();
        if (!cancelled) setStrength(computeProfileStrength(extractProfile(raw)));
      } catch {
        // Non-fatal — just shows 0% if the profile fetch fails.
      } finally {
        if (!cancelled) setStrengthLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setListingsLoading(true);
      setListingsError(null);
      try {
        const raw = await getListings();
        const list = extractListings(raw);
        if (!cancelled) setListings(list);
      } catch (err: any) {
        if (!cancelled) setListingsError(err?.response?.data?.message ?? err?.message ?? "Failed to load internships");
      } finally {
        if (!cancelled) setListingsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await getRecommendations();
        const list = extractListings(raw);
        if (!cancelled && list.length > 0) setRecommended(list[0]);
      } catch {
        // Non-fatal — falls back to the first real listing below once `listings` loads.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fall back to the first open listing if the recommendations endpoint returned nothing.
  const topPick = recommended ?? listings[0] ?? null;
  const newThisWeek = listings.slice(0, 3);
  const allInternships = listings.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F8F9FF]">
      <div className="mx-auto max-w-[1100px] px-6 py-8 flex flex-col gap-6">

        {/* GREETING */}
        <div>
          <p className="text-sm text-slate-400">{greeting()},</p>
          <h1 className="text-3xl font-bold text-[#0F1729]">{name}</h1>
        </div>

        {/* PROFILE STRENGTH */}
        <div className="flex items-center gap-4 rounded-[20px] border border-gray-100 bg-white px-5 py-4 shadow-md">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5 text-amber-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#0F1729]">Profile strength</p>
            <p className="text-[11px] text-slate-400">Complete your profile to get matches</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
              <div className="h-1.5 rounded-full bg-[#1B4FD8] transition-all" style={{ width: `${strengthLoading ? 0 : strength}%` }} />
            </div>
          </div>
          <span className="text-sm font-bold text-[#1B4FD8] flex-shrink-0">{strengthLoading ? "…" : `${strength}%`}</span>
        </div>

        {/* AI RECOMMENDED */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-base">✦</span>
            <h2 className="text-[15px] font-bold text-[#0F1729]">AI Recommended</h2>
          </div>
          {listingsLoading ? (
            <div className="h-56 animate-pulse rounded-[20px] bg-white border border-gray-100" />
          ) : topPick ? (
            <Link
              to={`/internships/${topPick.id}`}
              className="block rounded-[20px] p-6 no-underline overflow-hidden relative shadow-lg"
              style={{ background: "linear-gradient(135deg, #1B4FD8 0%, #3B6FE8 100%)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <span className="text-[11px] font-medium text-white/85">Top match for you</span>
                </div>
                <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-white">✦ Match</span>
              </div>
              <p className="text-xl font-bold text-white mb-1">{topPick.title}</p>
              <p className="text-sm text-white/70 mb-3">{topPick.employer?.companyName}</p>
              <p className="text-3xl font-extrabold text-white mb-1">
                {topPick.stipend && topPick.stipend.toLowerCase() !== "unpaid" ? "Paid Internship" : "Unpaid"}
              </p>
              <p className="text-xs text-white/60 mb-4">
                {topPick.location} · Deadline: {topPick.deadline ? new Date(topPick.deadline).toLocaleDateString() : "—"}
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {skillTags(topPick.skills).map((s) => (
                  <span key={s} className="rounded-full bg-white/15 px-3 py-1 text-[11px] text-white/90">{s}</span>
                ))}
              </div>
              <span className="inline-block rounded-[10px] bg-white px-5 py-2.5 text-sm font-bold text-[#1B4FD8]">
                View Internship
              </span>
            </Link>
          ) : (
            <div className="rounded-[20px] border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-slate-400">
              No recommendations yet — check back once more internships are posted.
            </div>
          )}
        </div>

        {listingsError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn't load internships: {listingsError}
          </div>
        )}

        {/* NEW THIS WEEK */}
        {!listingsLoading && newThisWeek.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <h2 className="text-[15px] font-bold text-[#0F1729]">New This Week</h2>
            </div>
            <div className="flex flex-col gap-3">
              {newThisWeek.map((internship) => (
                <Link
                  key={internship.id}
                  to={`/internships/${internship.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 no-underline shadow-md transition hover:border-[#1B4FD8] hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-5 w-5 text-[#1B4FD8]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F1729] truncate mb-1">{internship.title}</p>
                    <p className="text-xs text-slate-400 mb-2">{internship.employer?.companyName}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500">{internship.location}</span>
                      {internship.stipend && internship.stipend.toLowerCase() !== "unpaid" && (
                        <span className="rounded-full border border-green-200 px-2 py-0.5 text-[11px] text-green-600">Paid</span>
                      )}
                    </div>
                  </div>
                  <button className="flex-shrink-0 rounded-lg bg-[#EEF2FF] px-3 py-1.5 text-xs font-semibold text-[#1B4FD8]">View</button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ALL INTERNSHIPS */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#0F1729]">All Internships</h2>
            <Link to="/internships" className="text-sm font-medium text-[#1B4FD8]">View all</Link>
          </div>
          {listingsLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl border border-gray-100 bg-white" />
              ))}
            </div>
          ) : allInternships.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-slate-400">
              No internships posted yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {allInternships.map((internship) => (
                <Link
                  key={internship.id}
                  to={`/internships/${internship.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 no-underline shadow-md transition hover:border-[#1B4FD8] hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-5 w-5 text-[#1B4FD8]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#0F1729] truncate">{internship.title}</span>
                      {internship.employer?.verified && (
                        <span className="flex-shrink-0 rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-semibold text-[#1B4FD8]">Verified</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{internship.employer?.companyName}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500">{internship.location}</span>
                      <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500">
                        {internship.stipend && internship.stipend.toLowerCase() !== "unpaid" ? "Paid" : "Unpaid"}
                      </span>
                      <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500">
                        Deadline: {internship.deadline ? new Date(internship.deadline).toLocaleDateString() : "—"}
                      </span>
                    </div>
                  </div>
                  <button className="flex-shrink-0 rounded-lg bg-[#EEF2FF] px-3 py-1.5 text-xs font-semibold text-[#1B4FD8]">View</button>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  if (user?.role === "COMPANY") return <Navigate to="/company/dashboard" replace />;
  if (user?.role === "ADMIN")   return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === "STUDENT") return <LoggedInHome userId={String(user.id)} name={user.name} />;
  // Logged out → redirect to the standalone landing page (it has its own navbar/footer)
  return <Navigate to="/landing" replace />;
}