import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.context";
import logoFull from "../assets/logo-full.png";
import { mockNotifications } from "../data/mockNotifications";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const unreadCount = user?.role === "STUDENT"
    ? mockNotifications.filter((n) => !n.read).length
    : 0;

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/landing", { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition ${
      isActive ? "text-[#1B4FD8] font-semibold" : "text-gray-700 hover:text-[#1B4FD8]"
    }`;

  const closeMenu = () => setMenuOpen(false);

  const logoCropStyle = {
    width: "180px", height: "44px", overflow: "hidden", borderRadius: "8px",
  } as const;

  const logoImgStyle = {
    width: "230px", height: "auto", objectFit: "cover" as const,
    objectPosition: "left top", marginTop: "-2px", marginLeft: "-6px",
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">

          <Link to="/" className="flex items-center" style={logoCropStyle}>
            <img src={logoFull} alt="InternConnect" style={logoImgStyle} />
          </Link>

          <nav className="hidden items-center gap-6 sm:flex">
            {/* COMPANY */}
            {user?.role === "COMPANY" && (<>
              <NavLink to="/company/dashboard" end className={navLinkClass}>Home</NavLink>
              <NavLink to="/company/listings" className={navLinkClass}>Listings</NavLink>
              <NavLink to="/company/applicants" className={navLinkClass}>Applicants</NavLink>
              <NavLink to="/company/profile" className={navLinkClass}>Profile</NavLink>
            </>)}

            {/* STUDENT */}
            {user?.role === "STUDENT" && (<>
              <NavLink to="/" end className={navLinkClass}>Home</NavLink>
              <NavLink to="/internships" className={navLinkClass}>Discover</NavLink>
              <NavLink to="/student/dashboard" className={navLinkClass}>Applications</NavLink>
              <NavLink to="/student/profile" className={navLinkClass}>Profile</NavLink>
            </>)}

            {/* ADMIN */}
            {user?.role === "ADMIN" && (<>
              <NavLink to="/admin/dashboard" end className={navLinkClass}>Home</NavLink>
              <NavLink to="/internships" className={navLinkClass}>Discover</NavLink>
              <NavLink to="/admin/dashboard" className={navLinkClass}>Admin</NavLink>
            </>)}

            {/* GUEST */}
            {!user && (<>
              <NavLink to="/" end className={navLinkClass}>Home</NavLink>
              <NavLink to="/internships" className={navLinkClass}>Discover</NavLink>
            </>)}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            {/* Notification bell — students only */}
            {user?.role === "STUDENT" && (
              <NavLink to="/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-blue-50 hover:text-[#1B4FD8]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </NavLink>
            )}

            {user ? (
              <button onClick={handleLogout}
                className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
              >
                Log out
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-[#1B4FD8]">Log in</Link>
                <Link to="/register" className="rounded-full bg-[#1B4FD8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Get started</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 sm:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white sm:hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <Link to="/" onClick={closeMenu} style={logoCropStyle}>
              <img src={logoFull} alt="InternConnect" style={logoImgStyle} />
            </Link>
            <button onClick={closeMenu} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500">✕</button>
          </div>
          <nav className="flex-1 px-4 py-4">
            {[
              ...(user?.role === "COMPANY" ? [
                { label: "Home",       to: "/company/dashboard" },
                { label: "Listings",   to: "/company/listings" },
                { label: "Applicants", to: "/company/applicants" },
                { label: "Profile",    to: "/company/profile" },
              ] : []),
              ...(user?.role === "STUDENT" ? [
                { label: "Home",          to: "/" },
                { label: "Discover",      to: "/internships" },
                { label: "Applications",  to: "/student/dashboard" },
                { label: "Profile",       to: "/student/profile" },
                { label: "Notifications", to: "/notifications", badge: unreadCount },
              ] : []),
              ...(user?.role === "ADMIN" ? [
                { label: "Home",     to: "/admin/dashboard" },
                { label: "Discover", to: "/internships" },
                { label: "Admin",    to: "/admin/dashboard" },
              ] : []),
              ...(!user ? [
                { label: "Home",     to: "/" },
                { label: "Discover", to: "/internships" },
              ] : []),
            ].map((item) => (
              <Link key={item.label} to={item.to} onClick={closeMenu}
                className="flex items-center justify-between rounded-xl px-4 py-4 text-base font-medium text-gray-700 transition hover:bg-blue-50 hover:text-[#1B4FD8]"
              >
                <span>{item.label}</span>
                {"badge" in item && item.badge > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </Link>
            ))}
            {user && (
              <button onClick={handleLogout} className="mt-2 block w-full rounded-xl px-4 py-4 text-left text-base font-medium text-red-500 hover:bg-red-50">
                Log out
              </button>
            )}
          </nav>
          {!user && (
            <div className="border-t border-gray-200 px-4 py-4">
              <Link to="/register" onClick={closeMenu} className="block w-full rounded-full bg-[#1B4FD8] py-4 text-center text-sm font-bold text-white hover:bg-blue-700">
                Get started
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}