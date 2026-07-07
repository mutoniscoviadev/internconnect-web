import { Link } from "react-router-dom";
import { useAuth } from "../context/auth.context";
import logoFull from "../assets/logo-full.png";

export default function Footer() {
  const { user } = useAuth();

  const studentLinks = user?.role === "STUDENT"
    ? [
        { label: "Browse Internships", to: "/internships" },
        { label: "My Applications",    to: "/student/dashboard" },
        { label: "My Profile",         to: "/student/profile" },
      ]
    : [
        { label: "Browse Internships", to: "/internships" },
        { label: "Sign up as student", to: "/register" },
        { label: "Log in",             to: "/login" },
      ];

  const companyLinks = user?.role === "COMPANY"
    ? [
        { label: "Dashboard",     to: "/company/dashboard" },
        { label: "My Listings",   to: "/company/listings" },
        { label: "Applicants",    to: "/company/applicants" },
        { label: "Company Profile", to: "/company/profile" },
      ]
    : [
        { label: "Post an internship", to: "/register" },
        { label: "Company login",      to: "/login" },
        { label: "Browse talent",      to: "/internships" },
      ];

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

          {/* Brand */}
          <div>
            <div style={{ width: "160px", height: "40px", overflow: "hidden", borderRadius: "8px" }}>
              <img src={logoFull} alt="InternConnect"
                style={{ width: "210px", height: "auto", objectFit: "cover", objectPosition: "left top", marginTop: "-2px", marginLeft: "-6px" }}
              />
            </div>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Connecting ambitious students with Rwanda's top companies. Find your perfect internship today.
            </p>
          </div>

          {/* For Students */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">For Students</h4>
            <ul className="mt-3 space-y-2">
              {studentLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-gray-500 transition hover:text-blue-700">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Companies */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">For Companies</h4>
            <ul className="mt-3 space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-gray-500 transition hover:text-blue-700">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 sm:flex-row">
          <p className="text-xs text-gray-400">© 2026 InternConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}