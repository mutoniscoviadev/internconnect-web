import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyListings } from "../../api/listings.api";
import { getListingApplications } from "../../api/applications.api";

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  applied:      { label: "applied",     classes: "bg-blue-100 text-blue-600" },
  under_review: { label: "reviewed",    classes: "bg-yellow-100 text-yellow-600" },
  reviewed:     { label: "reviewed",    classes: "bg-yellow-100 text-yellow-600" },
  shortlisted:  { label: "shortlisted", classes: "bg-purple-100 text-purple-600" },
  accepted:     { label: "accepted",    classes: "bg-emerald-100 text-emerald-600" },
  rejected:     { label: "rejected",    classes: "bg-red-100 text-red-600" },
};

const AVATAR_GRADIENTS = [
  "from-[#0E7C9C] to-[#1B4FD8]",
  "from-[#1B4FD8] to-[#5B3DE0]",
  "from-[#0C7A8F] to-[#0EA5A0]",
  "from-[#1268B3] to-[#1B4FD8]",
  "from-[#0E7C9C] to-[#2563EB]",
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getAvatarGradient(name: string) {
  return AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
}

interface Listing {
  id: string;
  title: string;
  location?: string;
  status?: string;
}

interface ApplicantEntry {
  id: string;
  status: string;
  appliedAt: string;
  coverLetterUrl?: string | null;
  interviewDate?: string;
  listingId: string;
  listingTitle: string;
  student?: {
    university?: string;
    faculty?: string;
    department?: string;
    year?: number;
    gpa?: number | null;
    bio?: string;
    skills?: string; // comma-separated
    cvUrl?: string | null;
    photoUrl?: string | null;
    user?: { name?: string; email?: string };
  };
  applicantName?: string | null;
  applicantEmail?: string | null;
}

export default function CompanyApplicantsPage() {
  const navigate = useNavigate();

  const [listings, setListings] = useState<Listing[]>([]);
  const [allApplicants, setAllApplicants] = useState<ApplicantEntry[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const listingsRes: any = await getMyListings();
        const myListings: Listing[] = listingsRes?.listings ?? [];
        if (cancelled) return;
        setListings(myListings);

        // Fetch applicants for every listing in parallel, tag each with listing info
        const results = await Promise.all(
          myListings.map(async (listing) => {
            try {
              const res: any = await getListingApplications(listing.id);
              const apps = res?.applications ?? [];
              return apps.map((a: any) => ({
                ...a,
                listingId: listing.id,
                listingTitle: listing.title,
              }));
            } catch {
              return []; // if one listing's applicants fail to load, don't break the whole page
            }
          })
        );

        if (!cancelled) setAllApplicants(results.flat());
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message ?? err.message ?? "Failed to load applicants");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredApplicants = selectedListingId === "all"
    ? allApplicants
    : allApplicants.filter((a) => a.listingId === selectedListingId);

  const selectedListing = selectedListingId !== "all"
    ? listings.find((l) => l.id === selectedListingId)
    : null;

  return (
    <div className="min-h-screen bg-[#F4F6FA] pb-16">
      <div className="mx-auto max-w-[860px] px-6 py-10">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0B1224]">Applicants</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {filteredApplicants.length} applicant{filteredApplicants.length !== 1 ? "s" : ""}
            {selectedListing ? ` for ${selectedListing.title}` : ""}
          </p>
        </div>

        {/* Listing filter tabs */}
        {listings.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedListingId("all")}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                selectedListingId === "all"
                  ? "bg-gradient-to-r from-[#0E7C9C] to-[#1B4FD8] text-white shadow-sm"
                  : "border border-[#E8ECF2] bg-white text-slate-500 hover:border-[#1B4FD8] hover:text-[#1B4FD8]"
              }`}
            >
              All
            </button>
            {listings.map((listing) => (
              <button
                key={listing.id}
                onClick={() => setSelectedListingId(listing.id)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  selectedListingId === listing.id
                    ? "bg-gradient-to-r from-[#0E7C9C] to-[#1B4FD8] text-white shadow-sm"
                    : "border border-[#E8ECF2] bg-white text-slate-500 hover:border-[#1B4FD8] hover:text-[#1B4FD8]"
                }`}
              >
                {listing.title}
              </button>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          {[
            { label: "Total",       value: allApplicants.length,                                              color: "text-[#0B1224]" },
            { label: "Shortlisted", value: allApplicants.filter((a) => a.status === "shortlisted").length,     color: "text-purple-600" },
            { label: "Accepted",    value: allApplicants.filter((a) => a.status === "accepted").length,        color: "text-emerald-600" },
            { label: "Rejected",    value: allApplicants.filter((a) => a.status === "rejected").length,        color: "text-red-500" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-[#E8ECF2] bg-white p-4 text-center shadow-sm">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Applicants list */}
        {loading ? (
          <div className="rounded-3xl border border-dashed border-[#E8ECF2] bg-white py-16 text-center">
            <p className="text-sm text-slate-400">Loading applicants…</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-dashed border-red-200 bg-white py-16 text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#E8ECF2] bg-white py-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-12 w-12 text-slate-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            <p className="mt-4 text-base font-semibold text-[#0B1224]">No applicants yet</p>
            <p className="mt-1 text-sm text-slate-400">Applicants will appear here once students apply.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredApplicants.map((app) => {
              const displayName = app.student?.user?.name ?? app.applicantName ?? "Unknown applicant";
              const email = app.student?.user?.email ?? app.applicantEmail ?? "—";
              const statusStyle = STATUS_STYLES[app.status] ?? STATUS_STYLES.applied;
              const skillsList = app.student?.skills
                ? app.student.skills.split(",").map((s) => s.trim()).filter(Boolean)
                : [];
              const skills = skillsList.slice(0, 3);
              const extraSkills = skillsList.length - 3;
              const hasCV = !!app.student?.cvUrl;
              const avatarGradient = getAvatarGradient(displayName);
              const initials = getInitials(displayName);

              return (
                <div
                  key={app.id}
                  onClick={() => navigate(`/company/applicants/${app.id}`, { state: { application: app } })}
                  className="cursor-pointer rounded-2xl border border-[#E8ECF2] bg-white p-5 shadow-sm transition hover:border-[#1B4FD8]/40 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGradient} text-sm font-bold text-white`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-[#0B1224]">{displayName}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold flex-shrink-0 ${statusStyle.classes}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{email}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">Applied for: {app.listingTitle}</p>
                    </div>
                  </div>

                  {skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {skills.map((skill) => (
                        <span key={skill} className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[11px] font-medium text-[#1B4FD8]">
                          {skill}
                        </span>
                      ))}
                      {extraSkills > 0 && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-500">
                          +{extraSkills} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {app.interviewDate && (
                        <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
                          📅 Interview set
                        </span>
                      )}
                      {hasCV && (
                        <span className="flex items-center gap-1 rounded-full border border-[#1B4FD8]/20 bg-[#EEF2FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B4FD8]">
                          📄 CV
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}