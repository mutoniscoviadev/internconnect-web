import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/auth.context";
import { getProfile, updateProfile, uploadCV, type StudentProfileDto } from "../../api/student.api";

const FIELD = "w-full rounded-xl border border-[#E8ECF2] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F1729] placeholder:text-slate-400 focus:border-[#1B4FD8] focus:outline-none focus:ring-2 focus:ring-[#1B4FD8]/20";

interface FormState {
  university: string;
  faculty: string;
  department: string;
  year: string;
  gpa: string;
  bio: string;
  experience: string;
  languages: string;
  certifications: string;
  cvUrl: string | null;
}

function emptyForm(): FormState {
  return { university: "", faculty: "", department: "", year: "", gpa: "", bio: "", experience: "", languages: "", certifications: "", cvUrl: null };
}

function dtoToForm(student: StudentProfileDto): FormState {
  return {
    university: student.university ?? "",
    faculty: student.faculty ?? "",
    department: student.department ?? "",
    year: student.year != null ? String(student.year) : "",
    gpa: student.gpa != null ? String(student.gpa) : "",
    bio: student.bio ?? "",
    experience: student.experience ?? "",
    languages: student.languages ?? "",
    certifications: student.certifications ?? "",
    cvUrl: student.cvUrl,
  };
}

function fieldsFilled(f: FormState, skillsInput: string) {
  return [f.university.trim(), f.department.trim(), f.year.trim(), skillsInput.trim(), f.bio.trim(), f.experience.trim(), f.cvUrl].filter(Boolean).length;
}

export default function StudentProfileEditPage() {
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>(emptyForm());
  const [skillsInput, setSkillsInput] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { student } = await getProfile();
        setForm(dtoToForm(student));
        setSkillsInput(student.skills ?? "");
        setCvFileName(student.cvUrl ? "CV on file" : null);
      } catch (err: any) {
        // 404 just means this student hasn't created a profile yet — that's fine, start blank
        if (err.status !== 404) {
          console.error("Failed to load profile:", err);
          setSaveError("Couldn't load your profile. Please refresh the page.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const totalFields = 7;
  const filledCount = fieldsFilled(form, skillsInput);
  const progressPct = Math.round((filledCount / totalFields) * 100);

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrors((er) => ({ ...er, cvUrl: "Only PDF files are accepted" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((er) => ({ ...er, cvUrl: "File must be under 5MB" }));
      return;
    }
    setErrors((er) => ({ ...er, cvUrl: undefined }));
    setCvFile(file);
    setCvFileName(file.name);
    setForm((f) => ({ ...f, cvUrl: "pending" }));
  };

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.university.trim()) e.university = "University is required";
    if (!form.department.trim()) e.department = "Department is required";
    if (!form.year.trim() || Number(form.year) < 1) e.year = "Enter a valid year";
    if (!form.cvUrl) e.cvUrl = "Please upload your CV";
    return e;
  };

  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      document.querySelector(".text-red-500")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      scrollToFirstError();
      return;
    }
    if (!user) return;

    setSaveError(null);
    setSaving(true);

    try {
      let finalSkills = skillsInput;

      // Step 1: if a new CV was picked, upload it first — backend auto-extracts skills via AI
      if (cvFile) {
        setUploadingCv(true);
        const cvResult = await uploadCV(cvFile);
        setUploadingCv(false);
        setCvFile(null);
        setCvFileName("CV on file");
        setForm((f) => ({ ...f, cvUrl: cvResult.cvUrl }));
        // Only auto-fill skills from the CV if the user hadn't typed any themselves
        if (!skillsInput.trim() && cvResult.skills) {
          finalSkills = cvResult.skills;
          setSkillsInput(cvResult.skills);
        }
      }

      // Step 2: save the rest of the profile fields (including whichever skills value we ended up with)
      const { student } = await updateProfile({
        university: form.university,
        faculty: form.faculty,
        department: form.department,
        year: form.year ? Number(form.year) : undefined,
        gpa: form.gpa ? Number(form.gpa) : undefined,
        bio: form.bio,
        skills: finalSkills,
        experience: form.experience,
        languages: form.languages,
        certifications: form.certifications,
      });

      setForm(dtoToForm(student));
      setSkillsInput(student.skills ?? "");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setSaveError("Something went wrong saving your profile. Please try again.");
    } finally {
      setSaving(false);
      setUploadingCv(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA]">
      <div className="mx-auto max-w-5xl px-6 py-10">

        <div className="flex items-center gap-3 mb-2">
          <Link to="/student/profile" className="text-sm font-medium text-slate-500 hover:text-[#0F1729]">← Back</Link>
        </div>
        <h1 className="text-2xl font-bold text-[#0F1729] mb-1">Edit Profile</h1>
        <p className="text-sm text-slate-500 mb-6">A complete profile helps you get matched with the right internships.</p>

        {saved && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            ✓ Profile saved successfully
          </div>
        )}
        {saveError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {saveError}
          </div>
        )}

        <div className="rounded-2xl border border-[#E8ECF2] bg-white p-8 sm:p-10 shadow-sm">

          <div className="mb-8">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400">{filledCount} of {totalFields} fields complete</span>
              <span className="text-xs font-bold text-[#1B4FD8]">{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100">
              <div className="h-1.5 rounded-full bg-[#1B4FD8] transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B4FD8] text-[11px] font-bold text-white">1</span>
              <h3 className="text-sm font-bold text-[#0F1729]">Education</h3>
            </div>
            <div className="space-y-5 pl-8">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F1729]">University</label>
                <input type="text" value={form.university} onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))} placeholder="e.g. University of Rwanda" className={FIELD} />
                {errors.university && <p className="mt-1 text-xs text-red-500">{errors.university}</p>}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F1729]">Faculty</label>
                  <input type="text" value={form.faculty} onChange={(e) => setForm((f) => ({ ...f, faculty: e.target.value }))} placeholder="e.g. Faculty of Science" className={FIELD} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F1729]">Department</label>
                  <input type="text" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} placeholder="e.g. Computer Science" className={FIELD} />
                  {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F1729]">Year of study</label>
                  <input type="number" min={1} max={7} value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} className={FIELD} />
                  {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F1729]">GPA <span className="font-normal text-slate-400">(optional)</span></label>
                  <input type="number" step="0.01" min={0} max={4} value={form.gpa} onChange={(e) => setForm((f) => ({ ...f, gpa: e.target.value }))} className={FIELD} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#E8ECF2] pt-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B4FD8] text-[11px] font-bold text-white">2</span>
              <h3 className="text-sm font-bold text-[#0F1729]">Skills & languages</h3>
            </div>
            <div className="space-y-5 pl-8">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F1729]">Skills <span className="font-normal text-slate-400">(comma separated — auto-filled from your CV if left blank)</span></label>
                <input type="text" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="e.g. React, SQL, Figma" className={FIELD} />
                {skillsInput.trim() && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {skillsInput.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                      <span key={s} className="rounded-full border border-[#1B4FD8]/20 bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-semibold text-[#1B4FD8]">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F1729]">Languages <span className="font-normal text-slate-400">(comma separated, optional)</span></label>
                <input type="text" value={form.languages} onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))} placeholder="e.g. English, French, Kinyarwanda" className={FIELD} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F1729]">Certifications <span className="font-normal text-slate-400">(comma separated, optional)</span></label>
                <input type="text" value={form.certifications} onChange={(e) => setForm((f) => ({ ...f, certifications: e.target.value }))} placeholder="e.g. AWS Cloud Practitioner" className={FIELD} />
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#E8ECF2] pt-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B4FD8] text-[11px] font-bold text-white">3</span>
              <h3 className="text-sm font-bold text-[#0F1729]">About you</h3>
            </div>
            <div className="space-y-5 pl-8">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F1729]">Short bio</label>
                <textarea rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Tell companies a bit about yourself..." className={`${FIELD} resize-none`} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F1729]">Experience</label>
                <textarea rows={3} value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} placeholder="Previous internships, projects, or relevant work..." className={`${FIELD} resize-none`} />
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#E8ECF2] pt-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B4FD8] text-[11px] font-bold text-white">4</span>
              <h3 className="text-sm font-bold text-[#0F1729]">CV / Resume</h3>
            </div>
            <div className="pl-8">
              <label className="mb-1 block text-sm font-medium text-[#0F1729]">
                Upload your CV <span className="font-normal text-slate-400">(PDF, max 5MB)</span>
              </label>

              {form.cvUrl && (
                <div className="mb-3 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                    <span>📄</span>
                    <span>{cvFileName ?? "CV uploaded"}</span>
                  </div>
                  {form.cvUrl !== "pending" && (
                    <a href={form.cvUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-green-700 underline">View</a>
                  )}
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-[#E8ECF2] bg-[#F8FAFC] px-4 py-4 transition hover:border-[#1B4FD8] hover:bg-[#EEF2FF]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF2FF] text-lg">📎</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#0F1729]">
                    {uploadingCv ? "Uploading CV & extracting skills..." : form.cvUrl ? "Click to replace your CV" : "Click to upload your CV"}
                  </p>
                  <p className="text-xs text-slate-400">PDF only, max 5MB</p>
                </div>
                <input type="file" accept=".pdf" className="hidden" onChange={handleCvChange} disabled={saving} />
              </label>
              {errors.cvUrl && <p className="mt-1 text-xs text-red-500">{errors.cvUrl}</p>}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-[#E8ECF2] pt-6">
            <Link to="/student/profile" className="rounded-full border border-[#E8ECF2] px-6 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
              Cancel
            </Link>
            <button onClick={handleSave} disabled={saving} className="rounded-full bg-[#1B4FD8] px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}