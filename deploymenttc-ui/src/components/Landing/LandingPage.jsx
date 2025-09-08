import React, { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { msalConfig } from "../../authConfig";
import heroImg from "../../assets/landingpage.png";
import { useNavigate } from "react-router-dom"; // 👈 ADD THIS

const LandingPage = () => {
  const { instance } = useMsal();
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [activeTab, setActiveTab] = useState("career"); // "career" | "business"

  const navigate = useNavigate(); // 👈 ADD THIS

  const login = async () => {
    setErr(null);
    setIsLoading(true);
    try {
      const response = await instance.loginPopup(msalConfig || {});
      console.log("Logged in successfully:", response);

      // 👇 Navigate to dashboard after successful login
      navigate("/signin");
    } catch (e) {
      console.error("Login failed:", e);
      setErr(e?.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full isolate overflow-hidden">
      {/* Background fills hero */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt="Professional using a laptop near a window"
          className="h-full w-full object-cover object-[30%_center]"
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
        {/* Right scrim */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.14) 40%, rgba(255,255,255,.42) 68%, rgba(255,255,255,.88) 100%)",
            backdropFilter: "blur(1px)",
          }}
        />
      </div>

      {/* Hero content */}
      <div className="relative min-h-[70vh] flex items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full flex flex-col md:flex-row md:justify-end">
          <div className="w-full max-w-xl text-left space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-slate-900 md:max-w-[28ch]">
              PLM Deployment Manager
            </h1>

            {/* Azure AD Login Button */}
            <div>
              <button
                onClick={login}
                disabled={isLoading}
                className="inline-flex items-center gap-3 px-5 sm:px-6 py-3 rounded-xl bg-[#0078D4] hover:bg-[#106EBE] text-white font-semibold shadow-lg transition disabled:opacity-60"
              >
                {/* Microsoft Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 23 23"
                  className="w-5 h-5"
                >
                  <rect width="10" height="10" x="1" y="1" fill="#F35325" />
                  <rect width="10" height="10" x="12" y="1" fill="#81BC06" />
                  <rect width="10" height="10" x="1" y="12" fill="#05A6F0" />
                  <rect width="10" height="10" x="12" y="12" fill="#FFBA08" />
                </svg>
                {isLoading ? "Signing in..." : "Login with Azure AD"}
              </button>

              {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;
