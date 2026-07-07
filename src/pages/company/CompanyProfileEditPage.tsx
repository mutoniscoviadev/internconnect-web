import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile } from "../../api/employer.api";

interface CompanyForm {
  companyName: string;
  industry: string;
  website: string;
  about: string;
}

const FIELD =
  "w-full rounded-xl border border-[#E8ECF2] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0B1224] placeholder:text-slate-400 transition focus:border-[#1B4FD8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1B4FD8]/10";

const LABEL = "mb-1.5 block text-sm font-semibold text-[#0B1224]";

export default function CompanyProfileEditPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<CompanyForm>({
    companyName: "",
    industry: "",
    website: "",
    about: "",
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyForm, string>>>({});

  // Load the real employer profile on mount so the form reflects what's actually saved.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const data: any = await getProfile();
        // Adjust these keys if your backend nests the profile differently,
        // e.g. { employer: {...} } instead of the fields being top-level.
        const profile = data?.employer ?? data;
        if (!cancelled) {
          setForm({
            companyName: profile?.companyName ?? "",
            industry: profile?.industry ?? "",
            website: profile?.website ?? "",
            about: profile?.description ?? "",
          });
        }
      } catch (err: any) {
        if (!cancelled) setLoadError(err?.response?.data?.message ?? err.message ?? "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const validate = () => {
    const e: Partial<Record<keyof CompanyForm, string>> = {};
    if (!form.companyName.trim()) e.companyName = "Company name is required";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setSaveError(null);
    setSaving(true);
    try {
      await updateProfile({
        companyName: form.companyName,
        industry: form.industry,
        website: form.website,
        description: form.about, // backend field is `description`, form field is `about`
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        navigate("/company/profile");
      }, 1200);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] pb-20">
      <div className="mx-auto max-w-[640px] px-6 py-10 flex flex-col gap-6">

        {/* Title + close */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#0B1224]">Edit Profile</h1>
            <p className="text-sm text-slate-400 mt-0.5">Update how your company appears to applicants</p>
          </div>
          <button
            onClick={() => navigate("/company/profile")}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#E8ECF2] bg-white text-slate-400 hover:text-[#0B1224] hover:bg-slate-50 transition text-lg"
          >
            ✕
          </button>
        </div>

        {saved && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Profile saved successfully — redirecting...
          </div>
        )}

        {saveError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-600">
            {saveError}
          </div>
        )}

        {loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-600">
            {loadError}
          </div>
        )}

        {/* Form card */}
        <div className="rounded-3xl border border-[#E8ECF2] bg-white p-7 shadow-sm flex flex-col gap-6">

          {loading ? (
            <p className="text-sm text-slate-400">Loading your profile…</p>
          ) : (
            <>
              <div>
                <label className={LABEL}>
                  Company Name <span className="text-[#1B4FD8]">*</span>
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  placeholder="e.g. Tech Rwanda Ltd"
                  className={FIELD}
                />
                {errors.companyName && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label className={LABEL}>Industry</label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                  placeholder="e.g. Technology"
                  className={FIELD}
                />
              </div>

              <div>
                <label className={LABEL}>Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="e.g. https://company.com"
                  className={FIELD}
                />
              </div>

              <div>
                <label className={LABEL}>About Company</label>
                <textarea
                  rows={5}
                  value={form.about}
                  onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
                  placeholder="Describe your company..."
                  className={`${FIELD} resize-none`}
                />
              </div>
            </>
          )}

        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/company/profile")}
            disabled={saving}
            className="flex-1 rounded-2xl border border-[#E8ECF2] bg-white py-4 text-sm font-semibold text-[#0B1224] hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-[2] rounded-2xl bg-gradient-to-r from-[#0E7C9C] to-[#1B4FD8] py-4 text-sm font-bold text-white shadow-md shadow-[#1B4FD8]/20 hover:shadow-lg hover:shadow-[#1B4FD8]/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}