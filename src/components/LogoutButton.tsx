import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.context";

export default function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-[#F8F9FF]"
    >
      Log out
    </button>
  );
}
