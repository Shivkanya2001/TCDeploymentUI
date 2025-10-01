import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTasks,
  FaSignOutAlt,
  FaBars,
  FaChevronLeft,
  FaCogs,
  FaRegChartBar,
  FaRegFileAlt,
} from "react-icons/fa";
import { useMsal } from "@azure/msal-react";

/** Nav items drive the main page content via activeSection */
const NAV_ITEMS = [
  { key: "status", label: "Status", icon: FaRegChartBar },
  { key: "logs", label: "Logs", icon: FaTasks },
  { key: "deployment", label: "Deployment", icon: FaRegFileAlt },
];

export default function Sidebar({ activeSection, setActiveSection }) {
  const { instance } = useMsal();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [lastLogoutTime, setLastLogoutTime] = useState("");

  // Static profile placeholders (wire to MSAL if desired)
  const displayName = "Shivkanya Doiphode";
  const email = "shivkanyadoiphode@intelizign.com";
  const role = "Project Administrator";

  const initials = useMemo(
    () =>
      displayName
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [displayName]
  );

  const formatDateTime = (dtString) => {
    if (!dtString) return "";
    try {
      const dt = new Date(dtString);
      return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        hour12: true,
      }).format(dt);
    } catch {
      return dtString;
    }
  };

  const handleLogout = async () => {
    const logoutTime = new Date().toISOString();
    localStorage.setItem("lastLogoutTime", logoutTime);
    sessionStorage.setItem("lastLogoutTime", logoutTime);

    await instance.logoutPopup({ postLogoutRedirectUri: "/" });
    navigate("/");
    setLastLogoutTime(logoutTime);
  };

  useEffect(() => {
    const stored =
      localStorage.getItem("lastLogoutTime") ||
      sessionStorage.getItem("lastLogoutTime");
    if (stored) setLastLogoutTime(stored);
  }, []);

  return (
    <aside
      className={`${
        collapsed ? "w-14" : "w-56"
      } bg-slate-950 text-slate-100 h-screen flex flex-col border-r border-slate-800 transition-all duration-300 ease-out`}
      aria-label="Primary Navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2.5 border-b border-slate-800/80 bg-slate-950/90 sticky top-0 z-10">
        {!collapsed ? (
          <span className="text-base font-semibold tracking-wide">
            PLM Deployment Manager
          </span>
        ) : (
          <span className="sr-only">PLM Deployment Manager</span>
        )}

        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <FaBars /> : <FaChevronLeft />}
        </button>
      </div>

      {/* Profile */}
      <div
        className={`px-2 ${
          collapsed ? "py-3" : "py-4"
        } border-b border-slate-800/70`}
      >
        <div className="flex items-start gap-3">
          <div
            className="relative shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold ring-2 ring-blue-500/40 shadow-sm text-sm"
            title={!collapsed ? undefined : `${displayName} • ${role}`}
          >
            {initials}
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div
                className="text-[13px] font-semibold truncate hover:text-blue-400 transition-colors"
                title={displayName}
              >
                {displayName}
              </div>
              <div
                className="text-[10px] text-slate-400 truncate"
                title={email}
              >
                {email}
              </div>
              <div className="text-[10px] text-slate-400">{role}</div>
              <div
                className="mt-1 text-[8px] leading-none text-slate-500"
                title={
                  lastLogoutTime
                    ? formatDateTime(lastLogoutTime)
                    : "Not recorded"
                }
              >
                LL:{" "}
                <span className="text-slate-300">
                  {lastLogoutTime ? formatDateTime(lastLogoutTime) : "—"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="px-1.5 space-y-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = activeSection === key;
            return (
              <li key={key}>
                <button
                  onClick={() => setActiveSection(key)}
                  className={`group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition
                    ${
                      active
                        ? "bg-blue-600/15 text-slate-100 ring-1 ring-inset ring-blue-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                    }`}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? label : undefined}
                >
                  <span
                    className={`h-3.5 w-0.5 rounded-full ${
                      active
                        ? "bg-blue-500"
                        : "bg-transparent group-hover:bg-slate-600"
                    }`}
                    aria-hidden
                  />
                  <Icon className="text-[15px] shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer actions */}
      <div className="mt-auto border-t border-slate-800/80 p-2">
        <div
          className={`flex ${
            collapsed
              ? "flex-col items-center gap-1.5"
              : "items-center justify-between"
          }`}
        >
          {/* Config now opens Defaults in main area */}
          <button
            onClick={() => setActiveSection("defaultConfig")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            title="Default Configurations"
            aria-label="Open configurations"
          >
            <FaCogs className="text-[14px]" />
            {!collapsed && <span>Config</span>}
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] text-red-400 hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500/60"
            title="Logout"
            aria-label="Logout"
          >
            <FaSignOutAlt className="text-[14px]" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapsed micro LL */}
        {collapsed && (
          <div
            className="mt-1.5 text-[9px] text-left text-slate-500 leading-none truncate"
            title={
              lastLogoutTime ? formatDateTime(lastLogoutTime) : "Not recorded"
            }
          >
            LL: {lastLogoutTime ? formatDateTime(lastLogoutTime) : "—"}
          </div>
        )}
      </div>
    </aside>
  );
}
