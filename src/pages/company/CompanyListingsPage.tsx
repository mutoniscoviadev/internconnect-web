import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getMyListings, createListing, updateListing, deleteListing } from "../../api/listings.api";

const FIELD = "w-full rounded-xl border border-[#E8ECF2] bg-[#F8F9FF] px-4 py-2.5 text-sm text-[#0F1729] placeholder:text-slate-400 focus:border-[#1B4FD8] focus:outline-none focus:ring-2 focus:ring-[#1B4FD8]/20";

// Matches your actual Prisma Listing model — no `category`, no `isPaid` boolean.
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
}

interface PostForm {
  title: string; location: string; duration: string;
  positions: string; deadline: string; isPaid: boolean; stipend: string;
  description: string; requirements: string;
}

const EMPTY_FORM: PostForm = {
  title: "", location: "", duration: "",
  positions: "1", deadline: "", isPaid: false, stipend: "",
  description: "", requirements: "",
};

// Backend response might be { listings: [...] } or a bare array — normalize either.
function extractListings(raw: unknown): Listing[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.listings)) return obj.listings as Listing[];
  }
  return [];
}

export default function CompanyListingsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showPostForm, setShowPostForm] = useState(false);
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof PostForm, string>>>({});
  const [posted, setPosted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null); // row-level spinner for close/reopen/delete

  useEffect(() => {
    loadListings();
  }, []);

  // Auto-open the post form when navigated here from the dashboard's
  // "Post a new internship" quick action (passed via navigate state).
  useEffect(() => {
    const state = location.state as { openForm?: boolean } | null;
    if (state?.openForm) {
      setForm(EMPTY_FORM);
      setErrors({});
      setEditingId(null);
      setSubmitError(null);
      setShowPostForm(true);
      // Clear the state so refreshing or navigating back doesn't reopen it.
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  async function loadListings() {
    setLoading(true);
    setLoadError(null);
    try {
      const raw = await getMyListings();
      setMyListings(extractListings(raw));
    } catch (err: any) {
      setLoadError(err?.response?.data?.message ?? err?.message ?? "Failed to load your listings");
    } finally {
      setLoading(false);
    }
  }

  const activeCount = myListings.filter((l) => (l.displayStatus ?? l.status) === "open").length;
  // Real per-listing applicant counts need the applications API — not available from getMyListings yet.
  const totalApplicants: number | null = null;

  const validate = () => {
    const e: Partial<Record<keyof PostForm, string>> = {};
    if (!form.title.trim())        e.title        = "Job title is required";
    if (!form.location.trim())     e.location     = "Location is required";
    if (!form.duration.trim())     e.duration     = "Duration is required";
    if (!form.deadline.trim())     e.deadline     = "Deadline is required";
    if (!form.description.trim())  e.description  = "Description is required";
    if (!form.requirements.trim()) e.requirements = "Requirements are required";
    if (form.isPaid && !form.stipend.trim()) e.stipend = "Enter stipend amount";
    return e;
  };

  const closeForm = () => {
    setShowPostForm(false); setEditingId(null); setForm(EMPTY_FORM); setErrors({}); setSubmitError(null);
  };

  const handlePost = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const payload = {
      title: form.title,
      description: form.description,
      skills: form.requirements,
      location: form.location,
      duration: form.duration,
      stipend: form.isPaid ? form.stipend : "Unpaid",
      deadline: form.deadline,
      openings: Number(form.positions),
    };

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editingId !== null) {
        await updateListing(editingId, payload);
      } else {
        await createListing(payload);
      }
      await loadListings();
      setPosted(true);
      setForm(EMPTY_FORM);
      setErrors({});
      setTimeout(() => { setPosted(false); closeForm(); }, 1200);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? err?.message ?? "Failed to save listing");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (listing: Listing) => {
    const stipendIsUnpaid = !listing.stipend || listing.stipend.toLowerCase().startsWith("unpaid");
    setForm({
      title: listing.title,
      location: listing.location ?? "",
      duration: listing.duration ?? "",
      positions: String(listing.openings ?? 1),
      deadline: listing.deadline ? listing.deadline.slice(0, 10) : "",
      isPaid: !stipendIsUnpaid,
      stipend: stipendIsUnpaid ? "" : (listing.stipend ?? ""),
      description: listing.description,
      requirements: listing.skills ?? "",
    });
    setEditingId(listing.id);
    setSubmitError(null);
    setShowPostForm(true);
  };

  const handleDelete = (id: string) => setDeletingId(id);

  const confirmDelete = async () => {
    if (deletingId === null) return;
    setBusyId(deletingId);
    try {
      await deleteListing(deletingId);
      setMyListings((prev) => prev.filter((l) => l.id !== deletingId));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Failed to delete listing");
    } finally {
      setBusyId(null);
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (listing: Listing) => {
    const current = listing.displayStatus ?? listing.status;
    const nextStatus = current === "open" ? "closed" : "open";
    setBusyId(listing.id);
    try {
      await updateListing(listing.id, { status: nextStatus });
      setMyListings((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, status: nextStatus, displayStatus: nextStatus } : l))
      );
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Failed to update listing");
    } finally {
      setBusyId(null);
    }
  };

  const skillTags = (skills?: string | null) =>
    (skills ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: "#F4F6FA" }}>
      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F1729]">My Listings</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {loading ? "Loading…" : `${myListings.length} internship${myListings.length !== 1 ? "s" : ""} posted`}
            </p>
          </div>
          <button
            onClick={() => { setForm(EMPTY_FORM); setErrors({}); setEditingId(null); setSubmitError(null); setShowPostForm(true); }}
            className="flex items-center gap-2 rounded-full bg-[#1B4FD8] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Post internship
          </button>
        </div>

        {loadError && !loading && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn't load your listings: {loadError}
          </div>
        )}

        {/* Stat cards */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total listings",  value: loading ? "—" : myListings.length, bg: "#EEF2FF", text: "#1B4FD8" },
            { label: "Active / open",   value: loading ? "—" : activeCount,        bg: "#ECFDF5", text: "#059669" },
            { label: "Total applicants",value: loading ? "—" : (totalApplicants ?? "—"), bg: "#FFFBEB", text: "#D97706" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-[#E8ECF2] bg-white p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: s.bg }}>
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.text }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1729]">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-[#E8ECF2] bg-white" />
            ))}
          </div>
        )}

        {/* Listings grid */}
        {!loading && myListings.length === 0 && !loadError ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8ECF2] bg-white py-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-12 w-12 text-slate-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            <p className="mt-4 text-base font-semibold text-[#0F1729]">No listings yet</p>
            <p className="mt-1 text-sm text-slate-400">Post your first internship to start receiving applicants</p>
            <button
              onClick={() => setShowPostForm(true)}
              className="mt-5 rounded-full bg-[#1B4FD8] px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Post Internship
            </button>
          </div>
        ) : !loading && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {myListings.map((listing) => {
              const skillList = skillTags(listing.skills);
              const status = listing.displayStatus ?? listing.status;
              const isOpen = status === "open";
              const rowBusy = busyId === listing.id;
              return (
                <div key={listing.id} className="rounded-2xl border border-[#E8ECF2] bg-white p-5 shadow-sm flex flex-col">

                  {/* Top row */}
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-[#0F1729] leading-snug">{listing.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {listing.location} · {listing.duration}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      status === "expired" ? "bg-amber-50 text-amber-600 border border-amber-200"
                      : isOpen ? "bg-green-50 text-green-600 border border-green-200"
                      : "bg-slate-100 text-slate-500"
                    }`}>
                      {status}
                    </span>
                  </div>

                  {/* Skill tags */}
                  {skillList.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {skillList.map((skill) => (
                        <span key={skill} className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[11px] font-medium text-[#1B4FD8]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                      </svg>
                      {listing.openings} opening{listing.openings !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                      </svg>
                      {listing.stipend || "Unpaid"}
                    </span>
                    <span className="flex items-center gap-1 text-[#1B4FD8] font-medium">
                      — applicants
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="mb-3 h-px bg-[#F1F4F9] mt-auto" />

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      disabled={rowBusy}
                      onClick={() => handleToggleActive(listing)}
                      className="flex items-center gap-1.5 rounded-full border border-[#E8ECF2] px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                      {isOpen ? "Close" : "Reopen"}
                    </button>

                    <button
                      onClick={() => handleEdit(listing)}
                      className="flex items-center gap-1.5 rounded-full border border-[#E8ECF2] px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-[#EEF2FF] hover:text-[#1B4FD8] hover:border-[#1B4FD8]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                      </svg>
                      Edit
                    </button>

                    <button
                      disabled={rowBusy}
                      onClick={() => handleDelete(listing.id)}
                      className="flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post / Edit Form — modal overlay */}
      {showPostForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8">
          <div className="w-full max-w-2xl rounded-2xl border border-[#E8ECF2] bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F1729]">
                {editingId !== null ? "Edit Internship" : "Post New Internship"}
              </h2>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {posted && (
              <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-medium text-green-700">
                ✓ {editingId !== null ? "Updated" : "Posted"} successfully!
              </div>
            )}
            {submitError && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-700">
                {submitError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F1729]">Job title</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Frontend Developer Intern" className={FIELD} />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F1729]">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Kigali, Rwanda" className={FIELD} />
                {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F1729]">Duration</label>
                  <input type="text" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="e.g. 3 months" className={FIELD} />
                  {errors.duration && <p className="mt-1 text-xs text-red-500">{errors.duration}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F1729]">Positions</label>
                  <input type="number" min="1" value={form.positions} onChange={(e) => setForm((f) => ({ ...f, positions: e.target.value }))} className={FIELD} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F1729]">Deadline</label>
                  <input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} className={FIELD} />
                  {errors.deadline && <p className="mt-1 text-xs text-red-500">{errors.deadline}</p>}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#0F1729]">Stipend</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm((f) => ({ ...f, isPaid: false }))} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${!form.isPaid ? "bg-[#1B4FD8] text-white" : "border border-[#E8ECF2] text-slate-500 hover:bg-[#F8F9FF]"}`}>Unpaid</button>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, isPaid: true }))}  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${form.isPaid  ? "bg-[#1B4FD8] text-white" : "border border-[#E8ECF2] text-slate-500 hover:bg-[#F8F9FF]"}`}>Paid</button>
                </div>
                {form.isPaid && (
                  <div className="mt-2">
                    <input type="text" value={form.stipend} onChange={(e) => setForm((f) => ({ ...f, stipend: e.target.value }))} placeholder="e.g. 60,000 RWF/month" className={FIELD} />
                    {errors.stipend && <p className="mt-1 text-xs text-red-500">{errors.stipend}</p>}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F1729]">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the role and responsibilities..." className={`${FIELD} resize-none`} />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F1729]">Skills required <span className="font-normal text-slate-400">(comma separated)</span></label>
                <textarea rows={2} value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} placeholder="e.g. React Native, TypeScript, JavaScript" className={`${FIELD} resize-none`} />
                {errors.requirements && <p className="mt-1 text-xs text-red-500">{errors.requirements}</p>}
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeForm} className="flex-1 rounded-full border border-[#E8ECF2] py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50">
                  Cancel
                </button>
                <button disabled={submitting} onClick={handlePost} className="flex-1 rounded-full bg-[#1B4FD8] py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                  {submitting ? "Saving…" : editingId !== null ? "Save Changes" : "Post Internship"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-6 w-6 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#0F1729]">Delete listing?</h3>
            <p className="mt-1 text-sm text-slate-500">This will permanently remove the internship and all its applicants.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 rounded-full border border-[#E8ECF2] py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}