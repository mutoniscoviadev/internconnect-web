import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getListingById } from "../api/listings.api";
import { applyForListing, getMyApplications } from "../api/applications.api";
import { getProfile } from "../api/student.api";
import { useAuth } from "../context/auth.context";

// Response wrapper shape isn't confirmed (could be { student: {...} } or a bare object) —
// this checks the likely spots so it works either way.
function extractCvUrl(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, any>;
  return obj.cvUrl ?? obj.student?.cvUrl ?? obj.profile?.cvUrl ?? null;
}

function getInitials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getAvatarColor(name?: string) {
  const colors = ["bg-orange-500", "bg-blue-600", "bg-purple-600", "bg-teal-600", "bg-red-500"];
  return colors[(name?.charCodeAt(0) ?? 0) % colors.length];
}

// Matches your actual backend shape (listing.controller.ts + application.controller.ts).
// No `category`, no `isPaid`, no `positions`/`isActive` — those are `openings`/`status`.
interface Listing {
  id: string;
  title: string;
  description: string;
  skills?: string | null;
  location?: string | null;
  duration?: string | null;
  stipend?: string | null;
  deadline?: string | null;
  openings: number;
  status: string;
  displayStatus?: string;
  employer?: {
    companyName?: string;
    industry?: string;
    website?: string | null;
    logoUrl?: string | null;
    verified?: boolean;
    description?: string;
  };
}

interface ApplyForm {
  fullName: string;
  email: string;
  phone: string;
  letterFile: File | null;
}

const FIELD = "w-full rounded-xl border border-[#E8ECF2] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F1729] placeholder:text-slate-400 focus:border-[#1B4FD8] focus:outline-none focus:ring-2 focus:ring-[#1B4FD8]/20";

function unwrapListing(raw: unknown): Listing | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.listing && typeof obj.listing === "object") return obj.listing as Listing;
  if (obj.id) return obj as unknown as Listing;
  return null;
}

function extractApplications(raw: unknown): any[] {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.applications)) return obj.applications;
  }
  if (Array.isArray(raw)) return raw;
  return [];
}

export default function InternshipDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [internship, setInternship] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [view, setView] = useState<"detail" | "apply" | "success">("detail");
  const [applied, setApplied] = useState(false);
  const [checkingApplied, setCheckingApplied] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ApplyForm, string>>>({});

  const [form, setForm] = useState<ApplyForm>({
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    letterFile: null,
  });

  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvLoading, setCvLoading] = useState(true);

  useEffect(() => {
    if (!user) { setCvLoading(false); return; }
    let cancelled = false;

    async function loadProfile() {
      try {
        const raw = await getProfile();
        if (!cancelled) setCvUrl(extractCvUrl(raw));
      } catch {
        // Non-fatal — CV check is advisory, not required by the backend.
      } finally {
        if (!cancelled) setCvLoading(false);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const raw = await getListingById(id!);
        const l = unwrapListing(raw);
        if (!cancelled) setInternship(l);
      } catch (err: any) {
        if (!cancelled) setLoadError(err?.response?.data?.message ?? err?.message ?? "Failed to load internship");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id || !user) { setCheckingApplied(false); return; }
    let cancelled = false;

    async function checkApplied() {
      try {
        const raw = await getMyApplications();
        const apps = extractApplications(raw);
        const already = apps.some((a) => a.listingId === id);
        if (!cancelled) setApplied(already);
      } catch {
        // Non-fatal — if this check fails, we just don't pre-mark as applied.
      } finally {
        if (!cancelled) setCheckingApplied(false);
      }
    }
    checkApplied();
    return () => { cancelled = true; };
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-400">Loading internship…</p>
      </div>
    );
  }

  if (loadError || !internship) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-2xl font-bold text-[#0F1729]">Internship not found</p>
        {loadError && <p className="mt-2 text-sm text-red-500">{loadError}</p>}
        <Link to="/internships" className="mt-4 text-sm text-[#1B4FD8] hover:underline">
          Back to listings
        </Link>
      </div>
    );
  }

  const companyName     = internship.employer?.companyName ?? "";
  const companyIndustry = internship.employer?.industry ?? "";
  const companyWebsite  = internship.employer?.website ?? null;
  const isVerified      = internship.employer?.verified ?? false;
  const stipendText     = internship.stipend || "Unpaid";
  const isStudent       = !user || user.role === "STUDENT";
  const avatarBg        = getAvatarColor(companyName);
  const initials        = getInitials(companyName);
  const skills           = (internship.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const status           = internship.displayStatus ?? internship.status;
  const isOpen            = status === "open";
  const deadlineDisplay  = internship.deadline ? new Date(internship.deadline).toLocaleDateString() : "No deadline";

  const handleApplyClick = () => {
    if (!user) { navigate("/login"); return; }
    setView("apply");
  };

  const validate = () => {
    const e: Partial<Record<keyof ApplyForm, string>> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim())    e.email    = "Email is required";
    if (!form.phone.trim())    e.phone    = "Phone number is required";
    // Cover letter file is optional — your backend accepts applications without one.
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    if (!id) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await applyForListing(id, form.letterFile ?? undefined);
      setApplied(true);
      setView("success");
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? err?.message ?? "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success ───────────────────────────────────────────
  if (view === "success") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F4F6FA] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[#E8ECF2] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-8 w-8 text-green-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#0F1729]">Application sent!</h3>
          <p className="mt-2 text-sm text-slate-500">
            You applied to <strong className="text-[#0F1729]">{internship.title}</strong> at{" "}
            <strong className="text-[#0F1729]">{companyName}</strong>. Good luck!
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link to="/applications" className="rounded-full bg-[#1B4FD8] py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              View my applications
            </Link>
            <button onClick={() => setView("detail")} className="text-sm text-slate-500 hover:text-[#0F1729]">
              Back to listing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Apply page ────────────────────────────────────────
  if (view === "apply") {
    const filledCount = [form.fullName, form.email, form.phone, form.letterFile, cvUrl].filter(Boolean).length;
    const totalFields = 5;
    const progressPct = Math.round((filledCount / totalFields) * 100);

    return (
      <div className="min-h-screen bg-[#F4F6FA]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <button onClick={() => setView("detail")} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0F1729]">
            ← Back to listing
          </button>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">

            {/* LEFT — form */}
            <div className="rounded-2xl border border-[#E8ECF2] bg-white p-8 shadow-sm">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[11px] font-bold text-[#1B4FD8]">Application</span>
              </div>
              <h2 className="text-2xl font-bold text-[#0F1729]">Apply for this role</h2>
              <p className="mt-1 text-sm text-slate-500">{internship.title} · {companyName}</p>

              {submitError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              {/* progress bar */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-400">{filledCount} of {totalFields} fields complete</span>
                  <span className="text-xs font-bold text-[#1B4FD8]">{progressPct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100">
                  <div className="h-1.5 rounded-full bg-[#1B4FD8] transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              {/* Section 1 — contact info */}
              <div className="mt-8">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B4FD8] text-[11px] font-bold text-white">1</span>
                  <h3 className="text-sm font-bold text-[#0F1729]">Your contact details</h3>
                </div>
                <p className="pl-8 mb-3 text-xs text-slate-400">
                  Shown here for your reference — not currently saved with the application on the backend.
                </p>
                <div className="space-y-5 pl-8">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#0F1729]">Full name</label>
                    <input type="text" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} className={FIELD} />
                    {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[#0F1729]">Email address</label>
                      <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={FIELD} />
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[#0F1729]">Phone number</label>
                      <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+250 7XX XXX XXX" className={FIELD} />
                      {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2 — documents */}
              <div className="mt-8 border-t border-[#E8ECF2] pt-8">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B4FD8] text-[11px] font-bold text-white">2</span>
                  <h3 className="text-sm font-bold text-[#0F1729]">Documents</h3>
                </div>
                <div className="space-y-5 pl-8">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#0F1729]">CV / Resume</label>
                    {cvLoading ? (
                      <div className="rounded-xl border border-[#E8ECF2] bg-[#F8FAFC] px-4 py-3 text-sm text-slate-400">
                        Checking your profile…
                      </div>
                    ) : cvUrl ? (
                      <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                        <span className="text-sm font-medium text-green-700">Attached from your profile</span>
                        <a href={cvUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-green-700 underline">View</a>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        No CV on file yet. Employers may prioritize applicants with a CV —{" "}
                        <Link to="/profile" className="font-semibold underline">upload one</Link> (optional, but recommended).
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-5 pl-8">
                  <label className="mb-1 block text-sm font-medium text-[#0F1729]">
                    Cover letter <span className="font-normal text-slate-400">(optional, PDF)</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-[#E8ECF2] bg-[#F8FAFC] px-4 py-4 transition hover:border-[#1B4FD8] hover:bg-[#EEF2FF]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF2FF]">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-5 w-5 text-[#1B4FD8]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      {form.letterFile ? (
                        <p className="truncate text-sm font-medium text-[#0F1729]">{form.letterFile.name}</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-[#0F1729]">Click to upload a cover letter</p>
                          <p className="text-xs text-slate-400">PDF, max 5MB</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept=".pdf" className="hidden" onChange={(e) => setForm((f) => ({ ...f, letterFile: e.target.files?.[0] ?? null }))} />
                  </label>
                </div>
              </div>

              <div className="mt-8 flex gap-3 border-t border-[#E8ECF2] pt-6">
                <button onClick={() => setView("detail")} className="flex-1 rounded-full border border-[#E8ECF2] py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-full bg-[#1B4FD8] py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                  {submitting ? "Submitting..." : "Submit application"}
                </button>
              </div>
            </div>

            {/* RIGHT — role summary sidebar */}
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-[#E8ECF2] bg-white p-6 lg:sticky lg:top-24">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${avatarBg} text-sm font-bold text-white`}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#0F1729]">{internship.title}</p>
                    <p className="truncate text-xs text-slate-400">{companyName}</p>
                  </div>
                </div>
                <div className="space-y-3 border-t border-[#E8ECF2] pt-4">
                  {[
                    { label: "Location",  value: internship.location || "—" },
                    { label: "Duration",  value: internship.duration || "—" },
                    { label: "Stipend",   value: stipendText },
                    { label: "Deadline",  value: deadlineDisplay },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-semibold text-[#0F1729] text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── Detail page ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F4F6FA]">

      {/* HERO HEADER */}
      <div
        className="px-6 py-10"
        style={{ background: "linear-gradient(135deg, #5578f8 0%, #1B4FD8 100%)" }}
      >
        <div className="mx-auto max-w-[1100px]">
          <Link to="/internships" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white">
            ← Back to listings
          </Link>
          <div className="flex items-center gap-5">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${avatarBg} text-2xl font-bold text-white shadow-lg`}>
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{internship.title}</h1>
              <p className="mt-1 text-sm text-white/65">{companyName}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">{internship.location}</span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">{internship.duration}</span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">Deadline: {deadlineDisplay}</span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">{stipendText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN CONTENT */}
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">

          {/* LEFT COLUMN — main content */}
          <div className="flex flex-col gap-5">

            {/* About */}
            <div className="rounded-2xl border border-[#E8ECF2] bg-white p-6">
              <h2 className="text-base font-bold text-[#0F1729] mb-3">About this Internship</h2>
              <p className="text-sm leading-relaxed text-slate-600">{internship.description}</p>
            </div>

            {/* Required Skills */}
            {skills.length > 0 && (
              <div className="rounded-2xl border border-[#E8ECF2] bg-white p-6">
                <h2 className="text-base font-bold text-[#0F1729] mb-3">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-[#1B4FD8]/20 bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#1B4FD8]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About Company */}
            <div className="rounded-2xl border border-[#E8ECF2] bg-white p-6">
              <h2 className="text-base font-bold text-[#0F1729] mb-3">About the Company</h2>
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${avatarBg} text-sm font-bold text-white`}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F1729]">{companyName}</p>
                  <p className="text-xs text-slate-400">{companyIndustry}</p>
                </div>
              </div>
              {companyWebsite && (
                <a href={companyWebsite} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#1B4FD8] hover:underline">
                  Visit website →
                </a>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — sticky sidebar */}
          <div className="flex flex-col gap-5">

            {/* Apply card */}
            <div className="rounded-2xl border border-[#E8ECF2] bg-white p-6 lg:sticky lg:top-24">
              <div className="mb-4 flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isOpen ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"}`}>
                  {status}
                </span>
                {isVerified && (
                  <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#1B4FD8]">✓ Verified</span>
                )}
              </div>

              {isStudent && (
                checkingApplied ? (
                  <div className="rounded-full bg-slate-50 py-3 text-center text-sm font-medium text-slate-400 border border-slate-200">
                    Checking…
                  </div>
                ) : applied ? (
                  <div className="rounded-full bg-green-50 py-3 text-center text-sm font-bold text-green-700 border border-green-200">
                    ✓ Applied Successfully
                  </div>
                ) : !isOpen ? (
                  <div className="rounded-full bg-slate-50 py-3 text-center text-sm font-medium text-slate-400 border border-slate-200">
                    Applications closed
                  </div>
                ) : (
                  <button onClick={handleApplyClick} className="w-full rounded-full bg-[#1B4FD8] py-3 text-sm font-bold text-white transition hover:bg-blue-700">
                    Apply Now
                  </button>
                )
              )}

              {/* Details list */}
              <div className="mt-5 space-y-3 border-t border-[#E8ECF2] pt-5">
                {[
                  { label: "Location",  value: internship.location || "—" },
                  { label: "Duration",  value: internship.duration || "—" },
                  { label: "Stipend",   value: stipendText },
                  { label: "Positions", value: `${internship.openings} open` },
                  { label: "Deadline",  value: deadlineDisplay },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-semibold text-[#0F1729] text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}