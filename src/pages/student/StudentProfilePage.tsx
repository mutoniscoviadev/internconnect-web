import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User, FileText, GraduationCap, Code2, Bell, Lock,
  School, MessageCircle, Zap, Check, Circle,
} from "lucide-react";
import { useAuth } from "../../context/auth.context";
import { getProfile, type StudentProfileDto } from "../../api/student.api";
import { getMyApplications } from "../../api/applications.api";

function getInitials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function profileStrength(p: StudentProfileDto | null): number {
  if (!p) return 10;
  let score = 10;
  if (p.university)  score += 15;
  if (p.department)  score += 15;
  if (p.gpa != null)  score += 10;
  if (p.skills)       score += 15;
  if (p.bio)          score += 10;
  if (p.experience)   score += 10;
  if (p.cvUrl)        score += 15;
  return Math.min(score, 100);
}

function getMenuItems(profile: StudentProfileDto | null) {
  const skillsCount = profile?.skills
    ? profile.skills.split(",").map((s) => s.trim()).filter(Boolean).length
    : 0;

  return [
    {
      Icon: User, iconBg: "bg-blue-100", iconColor: "text-blue-600",
      title: "Edit Profile", desc: "Update your personal info",
      to: "/student/profile/edit",
    },
    {
      Icon: FileText, iconBg: "bg-teal-100", iconColor: "text-teal-600",
      title: "My CV",
      desc: profile?.cvUrl ? "CV uploaded" : "No CV uploaded yet",
      to: "/student/profile/edit",
    },
    {
      Icon: GraduationCap, iconBg: "bg-orange-100", iconColor: "text-orange-600",
      title: "Education",
      desc: profile?.university
        ? `${profile.university}${profile.faculty ? ` · ${profile.faculty}` : ""}`
        : "Add your faculty",
      to: "/student/profile/edit",
    },
    {
      Icon: Code2, iconBg: "bg-purple-100", iconColor: "text-purple-600",
      title: "Skills",
      desc: skillsCount > 0 ? `${skillsCount} skills added` : "Add your skills",
      to: "/student/profile/edit",
    },
    {
      Icon: Bell, iconBg: "bg-green-100", iconColor: "text-green-600",
      title: "Job Alerts",
      desc: profile?.jobAlertsEnabled ? "Enabled" : "Disabled",
      to: "/student/dashboard",
    },
    {
      Icon: Lock, iconBg: "bg-red-100", iconColor: "text-red-600",
      title: "Privacy & Security", desc: "Manage your account security",
      to: "/",
    },
  ];
}

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [applicationCount, setApplicationCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { student } = await getProfile();
        setProfile(student);
      } catch (err: any) {
        // 404 just means no profile created yet — leave profile as null, page handles that state
        if (err.status !== 404) {
          console.error("Failed to load profile:", err);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const raw: any = await getMyApplications();
        const apps = Array.isArray(raw) ? raw : (raw?.applications ?? []);
        setApplicationCount(apps.length);
      } catch (err) {
        console.error("Failed to load application count:", err);
      }
    })();
  }, [user]);

  const strength = profileStrength(profile);
  const skillsList = profile?.skills
    ? profile.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const menuItems = getMenuItems(profile);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] pb-16">

      {/* HERO HEADER */}
      <div
        className="px-6 py-10"
        style={{ background: "linear-gradient(90deg, #3c68ea 0%, #3b5fe8 100%)" }}
      >
        <div className="mx-auto max-w-[1100px] flex items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white shadow-lg backdrop-blur-sm">
            {getInitials(user?.name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <p className="mt-0.5 text-sm text-white/65">{user?.email}</p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              <GraduationCap size={14} strokeWidth={2} />
              Student
            </span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: applicationCount, label: "Applications" },
                { value: profile?.university ?? "—", label: "University" },
                { value: `${strength}%`, label: "Profile Strength" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-[#E8ECF2] bg-white p-5 text-center">
                  <p className="text-xl font-bold text-[#0F1729] truncate">{s.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Profile info card */}
            {profile ? (
              <div className="rounded-2xl border border-[#E8ECF2] bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[15px] font-bold text-[#0F1729]">Profile Info</h2>
                  <Link to="/student/profile/edit" className="text-sm font-medium text-[#1B4FD8] hover:underline">Edit →</Link>
                </div>
                <div className="flex flex-col gap-3">
                  {profile.university && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                        <School size={16} strokeWidth={2} />
                      </span>
                      <span className="text-[#0F1729]">{profile.university}{profile.department && ` · ${profile.department}`}</span>
                    </div>
                  )}
                  {profile.bio && (
                    <div className="flex items-start gap-3 text-sm">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <MessageCircle size={16} strokeWidth={2} />
                      </span>
                      <span className="text-slate-600 leading-relaxed">{profile.bio}</span>
                    </div>
                  )}
                  {profile.cvUrl && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                        <FileText size={16} strokeWidth={2} />
                      </span>
                      <a href={profile.cvUrl} target="_blank" rel="noreferrer" className="font-medium text-[#1B4FD8] hover:underline">View CV</a>
                    </div>
                  )}
                  {skillsList.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {skillsList.map((skill) => (
                        <span key={skill} className="rounded-full border border-[#1B4FD8]/20 bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#1B4FD8]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E8ECF2] bg-white px-6 py-8 text-center">
                <p className="text-sm text-slate-500">No profile info yet.</p>
                <Link to="/student/profile/edit" className="mt-3 inline-block rounded-full bg-[#1B4FD8] px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Complete Profile
                </Link>
              </div>
            )}

            {/* Menu items */}
            <div className="rounded-2xl border border-[#E8ECF2] bg-white overflow-hidden">
              {menuItems.map((item, idx) => (
                <Link
                  key={item.title}
                  to={item.to}
                  className={`flex items-center gap-4 px-5 py-4 transition hover:bg-[#F8FAFC] ${
                    idx !== menuItems.length - 1 ? "border-b border-[#E8ECF2]" : ""
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}>
                    <item.Icon size={18} strokeWidth={2} className={item.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F1729]">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>

          </div>

          {/* RIGHT COLUMN — sticky sidebar */}
          <div className="flex flex-col gap-5">

            {/* Profile strength card */}
            <div className="rounded-2xl border border-[#E8ECF2] bg-white p-6 lg:sticky lg:top-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Zap size={18} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0F1729]">Profile Strength</p>
                  <p className="text-[11px] text-slate-400">Complete to get better matches</p>
                </div>
              </div>

              <div className="my-4 flex flex-col items-center">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#1B4FD8]"
                  style={{ background: `conic-gradient(#1B4FD8 ${strength * 3.6}deg, #E8ECF2 0deg)` }}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
                    <span className="text-lg font-bold text-[#1B4FD8]">{strength}%</span>
                  </div>
                </div>
              </div>

              <div className="h-1.5 w-full rounded-full bg-[#E8ECF2] mb-4">
                <div className="h-1.5 rounded-full bg-[#1B4FD8] transition-all" style={{ width: `${strength}%` }} />
              </div>

              <div className="flex flex-col gap-2">
                {[
                  { label: "Basic info",   done: true },
                  { label: "University",   done: !!profile?.university },
                  { label: "GPA",          done: profile?.gpa != null },
                  { label: "Skills",       done: !!profile?.skills },
                  { label: "Bio",          done: !!profile?.bio },
                  { label: "CV uploaded",  done: !!profile?.cvUrl },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.done ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                      {item.done ? <Check size={12} strokeWidth={3} /> : <Circle size={8} strokeWidth={3} fill="currentColor" />}
                    </span>
                    <span className={item.done ? "text-[#0F1729]" : "text-slate-400"}>{item.label}</span>
                  </div>
                ))}
              </div>

              <Link to="/student/profile/edit"
                className="mt-5 block w-full rounded-full bg-[#1B4FD8] py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
              >
                Complete Profile
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}