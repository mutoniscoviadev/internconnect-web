import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getMyListings } from "../../api/listings.api";
import { getListingApplications, updateApplicationStatus, analyzeApplicant } from "../../api/applications.api";
import { scheduleInterview as scheduleInterviewApi } from "../../api/interviews.api";

const STATUS_STYLES: Record<string, { label: string; classes: string; pill: string }> = {
  applied:      { label: "applied",     classes: "bg-blue-100 text-blue-600",     pill: "border-blue-300 text-blue-600 bg-blue-50" },
  under_review: { label: "reviewed",    classes: "bg-yellow-100 text-yellow-600", pill: "border-yellow-300 text-yellow-600 bg-yellow-50" },
  shortlisted:  { label: "shortlisted", classes: "bg-purple-100 text-purple-600", pill: "border-purple-300 text-purple-600 bg-purple-50" },
  accepted:     { label: "accepted",    classes: "bg-emerald-100 text-emerald-600", pill: "border-emerald-300 text-emerald-600 bg-emerald-50" },
  rejected:     { label: "rejected",    classes: "bg-red-100 text-red-600",       pill: "border-red-300 text-red-600 bg-red-50" },
};

const STATUS_KEYS = ["applied", "under_review", "shortlisted", "accepted", "rejected"];

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

interface StudentProfile {
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
}

interface RealApplication {
  id: string;
  status: string;
  appliedAt: string;
  coverLetterUrl?: string | null;
  listingId: string;
  listingTitle: string;
  student?: StudentProfile;
  applicantName?: string | null;
  applicantEmail?: string | null;
}

interface AIResult {
  score: number;
  verdict: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

interface InterviewData {
  date: string;
  time: string;
  mode: "virtual" | "in_person";
  location: string;
  notes: string;
}

export default function CompanyApplicantProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { applicationId } = useParams<{ applicationId: string }>();

  const passedApplication = (location.state as { application?: RealApplication } | null)?.application;

  const [application, setApplication] = useState<RealApplication | null>(passedApplication ?? null);
  const [loading, setLoading] = useState(!passedApplication);
  const [notFound, setNotFound] = useState(false);

  const [status, setStatus] = useState<string>(passedApplication?.status ?? "applied");
  const [statusSaving, setStatusSaving] = useState(false);

  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interviewDraft, setInterviewDraft] = useState<InterviewData>({
    date: "", time: "", mode: "virtual", location: "", notes: "",
  });
  const [interviewFormError, setInterviewFormError] = useState<string | null>(null);
  const [interviewSaving, setInterviewSaving] = useState(false);

  // Fallback: if someone lands here directly (refresh / bookmark) without state,
  // there's no single GET /applications/:id endpoint, so we reconstruct it by
  // scanning this company's listings + their applicants for a matching id.
  useEffect(() => {
    if (passedApplication || !applicationId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const listingsRes: any = await getMyListings();
        const myListings = listingsRes?.listings ?? [];

        for (const listing of myListings) {
          const res: any = await getListingApplications(listing.id);
          const apps = res?.applications ?? [];
          const match = apps.find((a: any) => a.id === applicationId);
          if (match) {
            const found: RealApplication = { ...match, listingId: listing.id, listingTitle: listing.title };
            if (!cancelled) {
              setApplication(found);
              setStatus(found.status);
            }
            return;
          }
        }
        if (!cancelled) setNotFound(true);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [applicationId, passedApplication]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading applicant…</p>
      </div>
    );
  }

  if (notFound || !application) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-base font-semibold text-[#0B1224]">Applicant not found</p>
        <p className="mt-1 text-sm text-slate-400">This application may have been removed.</p>
        <button
          onClick={() => navigate("/company/applicants")}
          className="mt-5 rounded-full bg-gradient-to-r from-[#0E7C9C] to-[#1B4FD8] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Back to Applicants
        </button>
      </div>
    );
  }

  const profile = application.student;
  const displayName = profile?.user?.name ?? application.applicantName ?? "Unknown applicant";
  const email = profile?.user?.email ?? application.applicantEmail ?? "—";
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.applied;
  const avatarGradient = getAvatarGradient(displayName);
  const initials = getInitials(displayName);
  const skills = profile?.skills ? profile.skills.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const updateStatus = async (newStatus: string) => {
    const prev = status;
    setStatus(newStatus); // optimistic
    setStatusSaving(true);
    try {
      await updateApplicationStatus(application.id, newStatus);
    } catch (err: any) {
      setStatus(prev); // revert on failure
      alert(err?.response?.data?.message ?? "Failed to update status. Please try again.");
    } finally {
      setStatusSaving(false);
    }
  };

  const runAiAnalysis = async () => {
    setAiLoading(true);
    setAiResult(null);
    setAiError(null);
    try {
      const result: any = await analyzeApplicant(application.id);
      // Adjust this mapping once you confirm your backend's exact response shape.
      const parsed: AIResult = result?.analysis ?? result;
      setAiResult(parsed);
    } catch (err: any) {
      setAiError(err?.response?.data?.message ?? "Failed to run AI analysis. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const scoreColor = (score: number) =>
    score >= 75 ? "#0EA563" : score >= 50 ? "#D97706" : "#DC2626";

  const verdictColor = (verdict: string) => {
    if (verdict === "Excellent") return "bg-emerald-100 text-emerald-700";
    if (verdict === "Good")      return "bg-blue-100 text-blue-700";
    if (verdict === "Maybe")     return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const scheduleInterview = async () => {
    if (!interviewDraft.date || !interviewDraft.time) {
      setInterviewFormError("Please pick a date and time.");
      return;
    }
    if (!interviewDraft.location.trim()) {
      setInterviewFormError(
        interviewDraft.mode === "virtual" ? "Add a meeting link for the virtual interview." : "Add a location for the in-person interview."
      );
      return;
    }
    setInterviewFormError(null);
    setInterviewSaving(true);
    try {
      const datetime = new Date(`${interviewDraft.date}T${interviewDraft.time}`).toISOString();
      const modeTag = interviewDraft.mode === "virtual" ? "[Virtual] " : "[In person] ";
      await scheduleInterviewApi(application.id, {
        datetime,
        location: interviewDraft.location,
        notes: modeTag + (interviewDraft.notes ?? ""),
      });
      setInterview(interviewDraft);
      setShowInterviewForm(false);
    } catch (err: any) {
      setInterviewFormError(err?.response?.data?.message ?? "Failed to schedule interview. Please try again.");
    } finally {
      setInterviewSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] pb-16">

      {/* Gradient header */}
      <div className="relative bg-gradient-to-r from-[#0C7A8F] via-[#1268B3] to-[#1B4FD8] px-6 pb-5 pt-5">
        <div className="mx-auto max-w-[640px] flex items-center justify-between">
          <button
            onClick={() => navigate("/company/applicants")}
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/25 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Applicants
          </button>
          <h1 className="text-base font-bold text-white">Applicant Profile</h1>
          <div className="w-[100px]" />
        </div>
      </div>

      <div className="mx-auto max-w-[640px] px-6 space-y-5">

        {/* Avatar + Name */}
        <div className="flex flex-col items-center text-center pt-6">
          <div className="rounded-2xl bg-white p-1 shadow-md mb-3">
            <div className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGradient} text-2xl font-bold text-white`}>
              {initials}
            </div>
          </div>
          <p className="text-base font-bold text-[#0B1224]">{displayName}</p>
          <p className="text-xs text-slate-400 mt-0.5">{email}</p>
          <span className={`mt-2 rounded-full px-3 py-0.5 text-xs font-semibold ${statusStyle.classes}`}>
            {statusStyle.label}
          </span>
        </div>

        {/* Applied for */}
        <div className="rounded-xl bg-white border border-[#E8ECF2] px-4 py-3 text-sm">
          <span className="text-slate-400">Applied for: </span>
          <span className="font-semibold text-[#0B1224]">{application.listingTitle}</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Left column */}
          <div className="space-y-5">
            {/* Bio */}
            {profile?.bio && (
              <div className="rounded-2xl border border-[#E8ECF2] bg-white p-4">
                <h3 className="mb-1.5 text-sm font-bold text-[#0B1224]">Bio</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="rounded-2xl border border-[#E8ECF2] bg-white p-4">
                <h3 className="mb-2 text-sm font-bold text-[#0B1224]">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-xs font-medium text-[#1B4FD8]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* University */}
            {profile?.university && (
              <div className="flex items-center gap-2 text-sm rounded-xl border border-[#E8ECF2] bg-white px-4 py-3">
                <span>🎓</span>
                <span className="text-slate-600">{profile.university}</span>
                {profile.department && <span className="text-slate-400">· {profile.department}</span>}
              </div>
            )}

            {/* Documents */}
            <div className="rounded-2xl border border-[#E8ECF2] bg-white p-4">
              <h3 className="mb-2 text-sm font-bold text-[#0B1224]">Documents</h3>
              {profile?.cvUrl ? (
                <a
                  href={profile.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-[#E8ECF2] bg-[#F8FAFC] px-4 py-3 transition hover:border-[#1B4FD8]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#1B4FD8] text-base">📄</div>
                    <div>
                      <p className="text-sm font-semibold text-[#0B1224]">Curriculum Vitae (CV)</p>
                      <p className="text-xs text-slate-400">Tap to open PDF</p>
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4 text-slate-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              ) : application.coverLetterUrl ? (
                <a
                  href={application.coverLetterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-[#E8ECF2] bg-[#F8FAFC] px-4 py-3 transition hover:border-[#1B4FD8]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#1B4FD8] text-base">📄</div>
                    <div>
                      <p className="text-sm font-semibold text-[#0B1224]">Cover Letter</p>
                      <p className="text-xs text-slate-400">Tap to open PDF</p>
                    </div>
                  </div>
                </a>
              ) : (
                <div className="rounded-xl border border-dashed border-[#E8ECF2] px-4 py-3 text-sm text-slate-400 text-center">
                  No documents uploaded
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* AI Hiring Analysis */}
            <div className="rounded-2xl border border-[#E8ECF2] bg-gradient-to-b from-[#F8FAFC] to-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0B1224]">✦ AI Hiring Analysis</h3>
                <span className="rounded-full bg-gradient-to-r from-[#0E7C9C] to-[#1B4FD8] px-2.5 py-0.5 text-[11px] font-bold text-white">
                  AI
                </span>
              </div>
              <p className="mb-3 text-xs text-slate-400">Analyze this applicant's profile against the job requirements</p>

              {!aiResult && !aiLoading && (
                <button
                  onClick={runAiAnalysis}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0E7C9C] to-[#1B4FD8] py-3 text-sm font-semibold text-white shadow-md shadow-[#1B4FD8]/20 transition hover:shadow-lg hover:shadow-[#1B4FD8]/30"
                >
                  ✦ Run AI Analysis
                </button>
              )}

              {aiLoading && (
                <div className="flex items-center justify-center gap-2 rounded-full bg-[#EEF2FF] py-3 text-sm font-medium text-[#1B4FD8]">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analyzing...
                </div>
              )}

              {aiError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {aiError}
                </div>
              )}

              {aiResult && (
                <div className="space-y-4 mt-1">
                  <div className="rounded-xl border border-[#E8ECF2] bg-white p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-[#0B1224]">{aiResult.score}%</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${verdictColor(aiResult.verdict)}`}>
                        {aiResult.verdict}
                      </span>
                    </div>
                    <p className="mb-2 text-xs text-slate-400">Match Score</p>
                    <div className="h-2 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${aiResult.score}%`, backgroundColor: scoreColor(aiResult.score) }}
                      />
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-600 italic">{aiResult.summary}</p>

                  <div>
                    <p className="mb-2 text-sm font-bold text-emerald-700">● Strengths</p>
                    <ul className="space-y-1">
                      {aiResult.strengths?.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-bold text-amber-600">● Gaps</p>
                    <ul className="space-y-1">
                      {aiResult.gaps?.map((g, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-[#1B4FD8]/15 bg-[#EEF2FF] px-4 py-3 text-sm text-[#1B4FD8]">
                    💡 {aiResult.recommendation}
                  </div>

                  <button
                    onClick={runAiAnalysis}
                    className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-[#1B4FD8] hover:underline"
                  >
                    🔄 Re-run Analysis
                  </button>
                </div>
              )}
            </div>

            {/* Interview Scheduling */}
            {(status === "shortlisted" || status === "accepted" || interview) && (
              <div className="rounded-2xl border border-[#E8ECF2] bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0B1224]">📅 Interview</h3>
                  {interview && !showInterviewForm && (
                    <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[11px] font-bold text-[#1B4FD8]">
                      Scheduled
                    </span>
                  )}
                </div>

                {interview && !showInterviewForm && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-[#1B4FD8]/15 bg-[#F8FAFC] px-4 py-3 text-sm">
                      <div className="flex items-center gap-2 text-[#0B1224] font-semibold">
                        <span>🗓️</span>
                        {new Date(`${interview.date}T00:00:00`).toLocaleDateString(undefined, {
                          weekday: "short", month: "short", day: "numeric", year: "numeric",
                        })}
                        <span className="text-slate-300">·</span>
                        {interview.time}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-slate-600">
                        <span>{interview.mode === "virtual" ? "💻" : "📍"}</span>
                        <span className="break-all">{interview.location}</span>
                      </div>
                      {interview.notes && (
                        <p className="mt-2 text-xs text-slate-400">{interview.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setInterviewDraft(interview);
                        setInterviewFormError(null);
                        setShowInterviewForm(true);
                      }}
                      className="w-full rounded-full border border-[#E8ECF2] py-2 text-xs font-semibold text-[#0B1224] hover:border-[#1B4FD8] hover:text-[#1B4FD8] transition"
                    >
                      Reschedule
                    </button>
                    <p className="text-[11px] text-slate-400 text-center">
                      Note: there's currently no cancel-interview endpoint — reschedule sends a new interview request.
                    </p>
                  </div>
                )}

                {!interview && !showInterviewForm && (
                  <button
                    onClick={() => {
                      setInterviewDraft({ date: "", time: "", mode: "virtual", location: "", notes: "" });
                      setInterviewFormError(null);
                      setShowInterviewForm(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0E7C9C] to-[#1B4FD8] py-3 text-sm font-semibold text-white shadow-md shadow-[#1B4FD8]/20 transition hover:shadow-lg hover:shadow-[#1B4FD8]/30"
                  >
                    📅 Schedule Interview
                  </button>
                )}

                {showInterviewForm && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Date</label>
                        <input
                          type="date"
                          value={interviewDraft.date}
                          onChange={(e) => setInterviewDraft((d) => ({ ...d, date: e.target.value }))}
                          className="w-full rounded-lg border border-[#E8ECF2] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0B1224] focus:border-[#1B4FD8] focus:outline-none focus:ring-2 focus:ring-[#1B4FD8]/10"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Time</label>
                        <input
                          type="time"
                          value={interviewDraft.time}
                          onChange={(e) => setInterviewDraft((d) => ({ ...d, time: e.target.value }))}
                          className="w-full rounded-lg border border-[#E8ECF2] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0B1224] focus:border-[#1B4FD8] focus:outline-none focus:ring-2 focus:ring-[#1B4FD8]/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Format</label>
                      <div className="flex gap-2">
                        {(["virtual", "in_person"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setInterviewDraft((d) => ({ ...d, mode: m }))}
                            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                              interviewDraft.mode === m
                                ? "border-[#1B4FD8] bg-[#EEF2FF] text-[#1B4FD8]"
                                : "border-[#E8ECF2] text-slate-500 hover:border-[#1B4FD8]/40"
                            }`}
                          >
                            {m === "virtual" ? "💻 Virtual" : "📍 In person"}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        The backend doesn't have a separate "mode" field yet — this gets tagged into the notes sent with the interview.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">
                        {interviewDraft.mode === "virtual" ? "Meeting link" : "Location"}
                      </label>
                      <input
                        type="text"
                        value={interviewDraft.location}
                        onChange={(e) => setInterviewDraft((d) => ({ ...d, location: e.target.value }))}
                        placeholder={interviewDraft.mode === "virtual" ? "e.g. Google Meet link" : "e.g. Office address"}
                        className="w-full rounded-lg border border-[#E8ECF2] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0B1224] placeholder:text-slate-400 focus:border-[#1B4FD8] focus:outline-none focus:ring-2 focus:ring-[#1B4FD8]/10"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Notes (optional)</label>
                      <textarea
                        rows={2}
                        value={interviewDraft.notes}
                        onChange={(e) => setInterviewDraft((d) => ({ ...d, notes: e.target.value }))}
                        placeholder="Anything the candidate should know"
                        className="w-full resize-none rounded-lg border border-[#E8ECF2] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0B1224] placeholder:text-slate-400 focus:border-[#1B4FD8] focus:outline-none focus:ring-2 focus:ring-[#1B4FD8]/10"
                      />
                    </div>

                    {interviewFormError && (
                      <p className="text-xs font-medium text-red-500">{interviewFormError}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          setShowInterviewForm(false);
                          setInterviewFormError(null);
                        }}
                        disabled={interviewSaving}
                        className="flex-1 rounded-full border border-[#E8ECF2] py-2.5 text-xs font-semibold text-[#0B1224] hover:bg-slate-50 transition disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={scheduleInterview}
                        disabled={interviewSaving}
                        className="flex-[2] rounded-full bg-gradient-to-r from-[#0E7C9C] to-[#1B4FD8] py-2.5 text-xs font-bold text-white transition hover:shadow-md disabled:opacity-50"
                      >
                        {interviewSaving ? "Scheduling…" : "Confirm Interview"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Update Status */}
            <div className="rounded-2xl border border-[#E8ECF2] bg-white p-4">
              <h3 className="mb-3 text-sm font-bold text-[#0B1224]">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_KEYS.map((key) => {
                  const s = STATUS_STYLES[key];
                  const isActive = status === key;
                  return (
                    <button
                      key={key}
                      onClick={() => updateStatus(key)}
                      disabled={statusSaving}
                      className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                        isActive
                          ? s.pill
                          : "border-[#E8ECF2] bg-white text-slate-500 hover:border-[#1B4FD8] hover:text-[#1B4FD8]"
                      }`}
                    >
                      {s.label.charAt(0).toUpperCase() + s.label.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}