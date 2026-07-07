import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getListings } from "../api/listings.api";
import logoFull from "../assets/logo-full.png";

/* ── tiny hook: count up animation ── */
function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

function StatCounter({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const value = useCountUp(target, 1600, visible);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.4 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1">
      <span className="text-4xl font-extrabold text-[#1B4FD8] tracking-tight">
        {value}{suffix}
      </span>
      <span className="text-sm text-slate-400 font-medium text-center">{label}</span>
    </div>
  );
}

// Shape rendered by the featured cards. Backend field names mirror
// listing.controller.ts (skills/stipend/employer.companyName), not the
// old mock shape (requirements/isPaid/company.companyName).
interface FeaturedListing {
  id: string;
  title: string;
  location?: string | null;
  stipend?: string | null;
  skills?: string | null;
  employer?: {
    companyName?: string;
  };
}

// Backend response might be a bare array, or wrapped as { listings: [...] } / { data: [...] }.
function extractListings(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.listings)) return obj.listings;
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
}

export default function LandingPage() {
  const [featured, setFeatured] = useState<FeaturedListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFeatured() {
      try {
        const raw = await getListings();
        const list = extractListings(raw);
        if (!cancelled) setFeatured(list.slice(0, 3));
      } catch {
        // Non-fatal — the hero/stats sections still render fine without featured cards.
        if (!cancelled) setFeatured([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadFeatured();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ fontFamily: "'Sora', system-ui, sans-serif", background: "#F8F9FF", minHeight: "100vh" }}>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');`}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ background: "white", borderBottom: "1px solid #E8ECF2" }} className="sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center" style={{ width: "180px", height: "44px", overflow: "hidden", borderRadius: "8px" }}>
            <img src={logoFull} alt="InternConnect" style={{ width: "230px", height: "auto", objectFit: "cover", objectPosition: "left top", marginTop: "-2px", marginLeft: "-6px" }} />
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-[#1B4FD8] transition-colors no-underline">
              Log in
            </Link>
            <Link to="/register"
              className="px-5 py-2 text-sm font-bold text-white rounded-full no-underline shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors bg-[#1B4FD8]">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        style={{
          background: "linear-gradient(135deg, #1B4FD8 0%, #3B6FE8 100%)",
          position: "relative",
          overflow: "hidden",
        }}
        className="px-6 py-24 md:py-32"
      >
        <div style={{
          position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />

        <div className="mx-auto max-w-4xl flex flex-col items-center text-center gap-6 relative">
          <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}
            className="flex items-center gap-2 rounded-full px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-wide">Rwanda's #1 Internship Platform</span>
          </div>

          <h1 style={{ lineHeight: 1.1 }}
            className="text-5xl md:text-7xl font-extrabold text-white tracking-tight">
            Your career starts here.
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl font-light leading-relaxed">
            Connect with Rwanda's top companies, land real internships,
            and launch a career that matters — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link to="/register"
              className="px-8 py-4 text-base font-bold text-[#1B4FD8] rounded-full no-underline shadow-xl hover:bg-blue-50 transition-colors bg-white">
              Find my internship →
            </Link>
            <Link to="/internships"
              style={{ border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.08)" }}
              className="px-8 py-4 text-base font-semibold text-white rounded-full no-underline hover:bg-white/15 transition-colors">
              Browse all roles
            </Link>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="flex -space-x-2">
              {["#F59E0B","#10B981","#6366F1","#EF4444"].map((c, i) => (
                <div key={i} style={{ background: c, border: "2px solid #1B4FD8" }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {["A","B","C","D"][i]}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/80">
              <span className="font-bold text-white">2,000+</span> students already placed
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background: "white", borderBottom: "1px solid #E8ECF2" }} className="px-6 py-10">
        <div className="mx-auto max-w-4xl grid grid-cols-3 gap-8">
          <StatCounter target={500} suffix="+" label="Active internships" />
          <StatCounter target={120} suffix="+" label="Partner companies" />
          <StatCounter target={95} suffix="%" label="Placement rate" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-[#1B4FD8] uppercase mb-2">The process</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F1729]">
              Three steps to your internship
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "👤", step: "01", title: "Build your profile", body: "Tell us your skills, university, and goals. Our AI uses this to surface the best matches for you." },
              { icon: "🔍", step: "02", title: "Discover & apply", body: "Browse verified opportunities from Rwanda's leading companies and apply in minutes." },
              { icon: "🚀", step: "03", title: "Launch your career", body: "Get hired, gain real experience, and unlock your professional future." },
            ].map((item) => (
              <div key={item.step}
                style={{ background: "white", border: "1px solid #E8ECF2" }}
                className="rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-xs font-black text-blue-200 tracking-widest">{item.step}</span>
                </div>
                <h3 className="text-base font-bold text-[#0F1729] mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED INTERNSHIPS ── */}
      <section style={{ background: "#EEF2FF" }} className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold tracking-widest text-[#1B4FD8] uppercase mb-1">Live opportunities</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#0F1729]">Featured internships</h2>
            </div>
            <Link to="/internships" className="text-sm font-semibold text-[#1B4FD8] no-underline hover:underline">
              View all →
            </Link>
          </div>

          {loading && (
            <div className="grid md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-2xl border border-[#E8ECF2] bg-white" />
              ))}
            </div>
          )}

          {!loading && featured.length === 0 && (
            <div style={{ background: "white", border: "1px solid #E8ECF2" }}
              className="rounded-2xl p-10 text-center">
              <p className="text-sm text-slate-500">No open internships right now — check back soon.</p>
            </div>
          )}

          {!loading && featured.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4">
              {featured.map((internship) => {
                const skills = (internship.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean);
                return (
                  <Link
                    key={internship.id}
                    to={`/internships/${internship.id}`}
                    className="no-underline block"
                  >
                    <div style={{ background: "white", border: "1px solid #E8ECF2", color: "#0F1729" }}
                      className="rounded-2xl p-6 h-full shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5">
                      <div className="flex items-center justify-between mb-4">
                        <div style={{ background: "#EEF2FF", color: "#1B4FD8" }}
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl">
                          🏢
                        </div>
                        {internship.stipend && (
                          <span style={{ background: "#ECFDF5", color: "#059669" }}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-full">
                            Paid
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-base mb-1 leading-snug">{internship.title}</p>
                      <p style={{ color: "#94A3B8" }}
                        className="text-xs mb-4">{internship.employer?.companyName}</p>
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {skills.slice(0, 2).map((s) => (
                          <span key={s} style={{ background: "#F1F5F9", color: "#475569" }}
                            className="text-[11px] px-2.5 py-1 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: "#94A3B8" }}
                          className="text-[11px]">{internship.location}</span>
                        <span style={{ background: "#1B4FD8", color: "white" }}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg">
                          Apply →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── FOR COMPANIES STRIP ── */}
      <section style={{ background: "white" }} className="px-6 py-16 border-t border-[#E8ECF2]">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-lg">
            <p className="text-xs font-bold tracking-widest text-[#1B4FD8] uppercase mb-2">For employers</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0F1729] mb-3">
              Hire Rwanda's brightest talent
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Post internship roles, receive AI-matched applicants, and build your pipeline —
              all on a platform built for the Rwandan market.
            </p>
          </div>
          <Link to="/register"
            style={{ whiteSpace: "nowrap" }}
            className="px-8 py-4 text-sm font-bold text-white rounded-full no-underline hover:bg-blue-700 transition-colors flex-shrink-0 bg-[#1B4FD8]">
            Post an internship
          </Link>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        style={{ background: "linear-gradient(135deg, #1B4FD8 0%, #3B6FE8 100%)" }}
        className="px-6 py-24 text-center"
      >
        <div className="mx-auto max-w-2xl flex flex-col items-center gap-6">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Ready to start?
          </h2>
          <p className="text-white/70 text-lg font-light">
            Join thousands of students and companies on InternConnect — it's free.
          </p>
          <Link to="/register"
            className="px-10 py-4 text-base font-bold text-[#1B4FD8] rounded-full no-underline shadow-xl hover:bg-blue-50 transition-colors bg-white">
            Create your free account
          </Link>
          <p className="text-white/60 text-sm">No credit card required · Takes 2 minutes</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#1B4FD8" }} className="px-6 py-8">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center" style={{ width: "150px", height: "36px", overflow: "hidden", borderRadius: "8px" }}>
            <img src={logoFull} alt="InternConnect" style={{ width: "190px", height: "auto", objectFit: "cover", objectPosition: "left top", marginTop: "-2px", marginLeft: "-6px" }} />
          </div>
          <p className="text-xs text-white/70">© 2026 InternConnect · Rwanda's smartest internship platform</p>
          <div className="flex gap-5">
            <Link to="/internships" className="text-xs text-white/70 hover:text-white no-underline transition-colors">Browse</Link>
            <Link to="/login" className="text-xs text-white/70 hover:text-white no-underline transition-colors">Login</Link>
            <Link to="/register" className="text-xs text-white/70 hover:text-white no-underline transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}