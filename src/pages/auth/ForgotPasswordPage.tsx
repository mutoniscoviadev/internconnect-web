import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import logoFull from "../../assets/logo-full.png";

const FIELD = "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-link-400 focus:outline-none focus:ring-2 focus:ring-link-400/20";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={logoFull} alt="InternConnect" className="mx-auto h-14 w-auto rounded-xl" />
          <p className="mt-4 text-sm text-ink/60">Reset your password</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface/80 backdrop-blur-md p-8 shadow-2xl">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-link-100 text-2xl">
                📧
              </div>
              <h2 className="font-display text-lg font-semibold text-ink">Check your email</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                If an account exists for <strong className="text-ink">{email}</strong>, we've
                sent a link to reset your password.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-block rounded-full bg-link-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-link-600"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm leading-relaxed text-ink/60">
                Enter the email address associated with your account, and
                we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink/80">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={FIELD}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-link-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-link-600 disabled:opacity-60"
                >
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-ink/60">
          Remembered your password?{" "}
          <Link to="/login" className="font-medium text-link-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}