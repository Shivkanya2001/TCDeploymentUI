import { FaTachometerAlt, FaTasks, FaSignOutAlt } from "react-icons/fa";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ activeSection, setActiveSection }) => {
  const { instance } = useMsal();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await instance.logoutPopup({
      postLogoutRedirectUri: "/",
    });
    navigate("/");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-800">TC Dashboard</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-grow">
        <button
          onClick={() => setActiveSection("deployment")}
          className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition ${
            activeSection === "deployment"
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <FaTachometerAlt className="text-lg" />
          Deployment
        </button>

        <button
          onClick={() => setActiveSection("status")}
          className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition ${
            activeSection === "status"
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <FaTachometerAlt className="text-lg" />
          Status
        </button>

        <button
          onClick={() => setActiveSection("logs")}
          className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition ${
            activeSection === "logs"
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <FaTasks className="text-lg" />
          Logs
        </button>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <FaSignOutAlt className="text-lg" />
          Logout
        </button>
        <p className="py-3 text-xs text-gray-400 text-center">
          &copy; 2025 My Dashboard
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
