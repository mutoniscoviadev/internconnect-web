import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth.context";
import logoFull from "../../assets/logo-full.png";
import type { Role } from "../../types/auth.types";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("STUDENT");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !email || !password) { setError("All fields are required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setIsSubmitting(true);
    try {
      await register({ name, email, password, role });
      setRegistered(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Check your email screen ──────────────────────────
  if (registered) {
    return (
      <div className="flex min-h-screen">
        <div
          className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
          style={{ background: "linear-gradient(160deg, #0f2a5e 0%, #1a4a8a 50%, #0d3b7a 100%)" }}
        >
          <img src={logoFull} alt="InternConnect" className="h-14 w-auto" />
          <div>
            <h1 className="text-4xl font-bold leading-tight text-white">Almost there!<br />Check your inbox.</h1>
            <p className="mt-4 text-white/50 text-sm leading-relaxed">
              We've sent a verification link to your email. Click it to activate your account and start your journey.
            </p>
          </div>
          <p className="text-xs text-white/30">© 2026 InternConnect. All rights reserved.</p>
        </div>

        <div className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-4xl">
              ✉️
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              We sent a verification link to{" "}
              <span className="font-semibold text-gray-800">{email}</span>.
              <br />Click the link to activate your account.
            </p>

            <div className="mt-6 space-y-3 rounded-2xl border border-gray-100 bg-[#F8F9FF] p-5 text-left">
              {[
                { icon: "📬", text: "Can't find it? Check your spam or junk folder." },
                { icon: "⏱️", text: "The link expires in 24 hours." },
                { icon: "🔒", text: "You won't be able to log in until verified." },
              ].map((tip) => (
                <div key={tip.icon} className="flex items-start gap-3">
                  <span className="text-base">{tip.icon}</span>
                  <p className="text-sm text-gray-600">{tip.text}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/login")}
              className="mt-6 w-full rounded-xl bg-blue-700 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Go to login
            </button>

            <p className="mt-4 text-sm text-gray-500">
              Wrong email?{" "}
              <button onClick={() => setRegistered(false)} className="font-semibold text-blue-600 hover:underline">
                Go back and fix it
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Register form ─────────────────────────────────────
  return (
    <div className="flex min-h-screen">

      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "linear-gradient(160deg, #2c6fec 0%, #1a4a8a 50%, #0d3b7a 100%)" }}
      >
        <div>
          <img src={logoFull} alt="InternConnect" className="h-14 w-auto" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-white/40">
            Connect. Learn. Launch.
          </p>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight text-white">
            Start your<br />career journey<br />today
          </h1>
          <div className="mt-10 space-y-5">
            {[
              { icon: "🎯", title: "Smart Matching",    desc: "AI-powered internship recommendations" },
              { icon: "📊", title: "Track Progress",    desc: "Real-time application status updates" },
              { icon: "🤖", title: "AI Career Tools",   desc: "CV analysis, cover letters, guidance" },
              { icon: "🏢", title: "Top Companies",     desc: "Connect with Rwanda's leading employers" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-white/50">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/30">© 2026 InternConnect. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="mb-8 lg:hidden text-center">
            <img src={logoFull} alt="InternConnect" className="mx-auto h-12 w-auto" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900">Create account</h2>
          <p className="mt-1 text-sm text-gray-500">Join InternConnect and launch your career</p>

          {/* Log In / Register toggle */}
          <div className="mt-6 flex rounded-2xl border border-gray-200 bg-gray-100 p-1">
            <Link
              to="/login"
              className="flex-1 rounded-xl py-2.5 text-center text-sm font-medium text-gray-500 transition hover:text-gray-700"
            >
              Log In
            </Link>
            <button className="flex-1 rounded-xl bg-white py-2.5 text-sm font-semibold text-blue-700 shadow-sm">
              Register
            </button>
          </div>

          {/* Role selector */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { value: "STUDENT" as Role, label: "Student", icon: "🎓", desc: "Looking for internships" },
              { value: "COMPANY" as Role, label: "Company", icon: "🏢", desc: "Hiring interns" },
            ].map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex flex-col items-start rounded-xl border-2 px-4 py-3 text-left transition ${
                  role === r.value
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 bg-[#F8F9FF] hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{r.icon}</span>
                  <span className={`text-sm font-semibold ${role === r.value ? "text-blue-700" : "text-gray-700"}`}>
                    {r.label}
                  </span>
                  {role === r.value && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <p className={`mt-1 text-xs ${role === r.value ? "text-blue-500" : "text-gray-400"}`}>
                  {r.desc}
                </p>
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-500">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
                className="w-full rounded-xl border border-gray-200 bg-[#F8F9FF] px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-500">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 bg-[#F8F9FF] px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-200 bg-[#F8F9FF] px-4 py-3 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-700 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Create Account →"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Sign in here
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}