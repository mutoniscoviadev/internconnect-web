import { useEffect, useState } from "react";
import { useAuth } from "../../context/auth.context";
import { useNavigate } from "react-router-dom";
import { Building2, Settings, Globe, User, Mail } from "lucide-react";
import { getProfile } from "../../api/employer.api";
import { getMyListings } from "../../api/listings.api";
import { getListingApplications } from "../../api/applications.api";

function getInitials(name?: string) {
  if (!name) return "CO";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatMemberSince(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("default", { month: "long", year: "numeric" });
}

interface EmployerProfile {
  companyName?: string;
  industry?: string;
  website?: string;
  description?: string;
  createdAt?: string;
}

export default function CompanyProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [listingsCount, setListingsCount] = useState(0);
  const [applicantsCount, setApplicantsCount] = useState(0);
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
        setProfile(employerProfile);

        const myListings = listingsRes?.listings ?? [];
        setListingsCount(myListings.length);

        // No single "total applicants across all listings" endpoint —
        // sum applicants per listing, same approach as the Applicants page.
        const counts = await Promise.all(
          myListings.map(async (listing: any) => {
            try {
              const res: any = await getListingApplications(listing.id);
              return res?.applications?.length ?? 0;
            } catch {
              return 0;
            }
          })
        );
        if (!cancelled) setApplicantsCount(counts.reduce((sum, c) => sum + c, 0));
      } catch {
        // If profile fetch fails, page still renders with fallback values below.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/landing", { replace: true });
  };

  const displayName = profile?.companyName ?? user?.name ?? "My Company";
  const memberSince = formatMemberSince(profile?.createdAt);

  const infoRows = [
    { Icon: Building2, label: "Company", value: profile?.companyName || "Not set" },
    { Icon: Settings, label: "Industry", value: profile?.industry || "Not set" },
    { Icon: Globe, label: "Website", value: profile?.website || "Not set" },
  ];

  const accountRows = [
    { Icon: User, label: "Name", value: user?.name ?? "—" },
    { Icon: Mail, label: "Email", value: user?.email ?? "—" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FA] pb-20">
      <div className="mx-auto max-w-[860px] px-6 py-10 flex flex-col gap-6">

        {/* Page title + Edit */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#0B1224]">Profile</h1>
            <p className="text-sm text-slate-400 mt-0.5">Your company's public presence</p>
          </div>
          <button
            onClick={() => navigate("/company/profile/edit")}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0E7C9C] to-[#1B4FD8] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1B4FD8]/20 hover:shadow-lg hover:shadow-[#1B4FD8]/30 hover:-translate-y-0.5 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2.414a2 2 0 01.586-1.414z" />
            </svg>
            Edit Profile
          </button>
        </div>

        {/* Hero card — gradient banner + avatar */}
        <div className="overflow-hidden rounded-3xl border border-[#E8ECF2] bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-[#0C7A8F] via-[#1268B3] to-[#1B4FD8]" />
          <div className="px-8 pb-8 -mt-12 flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-1 shadow-lg">
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#0E7C9C] to-[#1B4FD8] text-3xl font-bold text-white">
                  {getInitials(displayName)}
                </div>
              </div>
              <button
                onClick={() => navigate("/company/profile/edit")}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-[#E8ECF2] shadow hover:bg-[#EEF2FF] transition"
              >
                <svg className="h-3.5 w-3.5 text-[#1B4FD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2.414a2 2 0 01.586-1.414z" />
                </svg>
              </button>
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#0B1224]">{displayName}</h2>
            {memberSince && <p className="text-sm text-slate-400 mt-1">Member since {memberSince}</p>}

            {/* Stats inline */}
            <div className="mt-6 grid w-full max-w-xs grid-cols-2 divide-x divide-[#E8ECF2] rounded-2xl border border-[#E8ECF2] bg-[#F8FAFC] py-4">
              <div className="flex flex-col items-center gap-1">
                <p className="text-2xl font-extrabold text-[#0B1224]">{loading ? "—" : listingsCount}</p>
                <p className="text-xs font-medium text-slate-400">Listings</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-2xl font-extrabold text-[#0B1224]">{loading ? "—" : applicantsCount}</p>
                <p className="text-xs font-medium text-slate-400">Applicants</p>
              </div>
            </div>
          </div>
        </div>

        {/* Company Info + Account Info — side by side on larger screens */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-[#E8ECF2] bg-white p-6 shadow-sm">
            <h3 className="text-[15px] font-bold text-[#0B1224] mb-1">Company Info</h3>
            <p className="text-xs text-slate-400 mb-4">How applicants see your company</p>
            <div className="flex flex-col gap-1">
              {infoRows.map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-[#F8FAFC] transition">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#1B4FD8]">
                    <item.Icon size={18} strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className={`text-sm font-semibold truncate ${item.value === "Not set" ? "text-slate-300" : "text-[#0B1224]"}`}>
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#E8ECF2] bg-white p-6 shadow-sm">
            <h3 className="text-[15px] font-bold text-[#0B1224] mb-1">Account Info</h3>
            <p className="text-xs text-slate-400 mb-4">Used for login and notifications</p>
            <div className="flex flex-col gap-1">
              {accountRows.map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-[#F8FAFC] transition">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#1B4FD8]">
                    <item.Icon size={18} strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="text-sm font-semibold text-[#0B1224] truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full rounded-2xl border border-red-200 bg-red-50 py-4 flex items-center justify-center gap-2 text-sm font-semibold text-red-500 hover:bg-red-100 transition"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          Logout
        </button>

      </div>
    </div>
  );
}