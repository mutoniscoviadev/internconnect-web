import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getListings } from "../api/listings.api";

const FILTER_CHIPS = ["All", "Paid", "Remote", "Kigali", "Tech"];

// Shape we render. Backend field names aren't fully confirmed yet —
// normalizeListing() below absorbs the likely variants (positions/openings etc).
interface Internship {
  id: string;
  title: string;
  category?: string;
  description?: string;
  location?: string;
  isPaid?: boolean;
  stipend?: string;
  duration?: string;
  positions?: number;
  deadline?: string;
  company?: {
    companyName?: string;
    isVerified?: boolean;
  };
}

// Backend response might be a bare array, or wrapped as { listings: [...] } / { data: [...] }.
// This normalizes either shape so the rest of the component doesn't care.
function extractListings(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.listings)) return obj.listings;
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
}

// Maps a raw backend listing into the shape this page renders.
// Falls back across field-name variants (positions vs openings) since
// the exact Prisma model fields haven't been confirmed against the UI yet.
function normalizeListing(raw: any): Internship {
  return {
    id: raw.id,
    title: raw.title,
    category: raw.category,
    description: raw.description,
    location: raw.location,
    isPaid: raw.isPaid,
    stipend: raw.stipend,
    duration: raw.duration,
    positions: raw.positions ?? raw.openings ?? 0,
    deadline: raw.deadline
      ? new Date(raw.deadline).toLocaleDateString()
      : undefined,
    company: raw.company
      ? {
          companyName: raw.company.companyName,
          isVerified: raw.company.isVerified,
        }
      : undefined,
  };
}

export default function InternshipsPage() {
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState("All");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Latest");

  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const raw = await getListings();
        const list = extractListings(raw).map(normalizeListing);
        if (!cancelled) setInternships(list);
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ??
              err?.message ??
              "Failed to load internships"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    return internships.filter((internship) => {
      const haystack = `${internship.title} ${internship.company?.companyName ?? ""} ${
        internship.location ?? ""
      } ${internship.category ?? ""}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      let matchesChip = true;
      if (activeChip === "Paid") matchesChip = internship.isPaid === true;
      else if (activeChip === "Remote")
        matchesChip = internship.location?.toLowerCase().includes("remote") ?? false;
      else if (activeChip === "Kigali")
        matchesChip = internship.location?.toLowerCase().includes("kigali") ?? false;
      else if (activeChip === "Tech")
        matchesChip = internship.category?.toLowerCase().includes("tech") ?? false;
      return matchesSearch && matchesChip;
    });
  }, [internships, search, activeChip]);

  return (
    <div className="min-h-screen bg-[#F8F9FF]">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
          <p className="mt-1 text-sm text-gray-500">Find your perfect internship</p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search internships..."
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          {search && <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">✕</button>}
        </div>

        {/* Filter Chips */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTER_CHIPS.map((chip) => (
            <button key={chip} onClick={() => setActiveChip(chip)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                activeChip === chip
                  ? "border-blue-700 bg-blue-700 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Results Count + Sort */}
        <div className="relative mt-5 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {loading ? "Loading…" : `${results.length} internship${results.length !== 1 ? "s" : ""} found`}
          </p>
          <button onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:border-blue-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M10 18h4" />
            </svg>
            Sort
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-8 z-10 w-40 rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
              {["Latest", "Deadline", "Paid first"].map((opt) => (
                <button key={opt} onClick={() => { setSortBy(opt); setSortOpen(false); }}
                  className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-[#F8F9FF] ${sortBy === opt ? "text-blue-700 font-semibold" : "text-gray-600"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn't load internships: {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-white" />
            ))}
          </div>
        )}

        {/* Cards Grid */}
        {!loading && !error && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((internship) => (
              <div key={internship.id}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{internship.category}</p>
                  {internship.company?.isVerified && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">✓ Verified</span>
                  )}
                </div>
                <h3 className="mt-2 text-base font-semibold text-gray-900">{internship.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{internship.company?.companyName} · {internship.location}</p>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">{internship.description}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-600">
                    {internship.isPaid ? internship.stipend : "Unpaid"}
                  </span>
                  <span className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-600">
                    {internship.duration}
                  </span>
                  <span className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-600">
                    {internship.positions} spot{(internship.positions ?? 0) > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400">
                  <span>Deadline: {internship.deadline}</span>
                </div>

                <Link to={`/internships/${internship.id}`}
                  className="mt-4 block w-full rounded-full bg-blue-700 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  View details
                </Link>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </div>
            <p className="mt-4 text-base font-semibold text-gray-700">No internships found</p>
            <p className="mt-1 text-sm text-gray-500">Try a different search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}