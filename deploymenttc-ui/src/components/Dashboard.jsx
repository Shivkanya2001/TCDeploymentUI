import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { FaHome } from "react-icons/fa";

import Sidebar from "./Sidebar";
import DeploymentWizard from "./DeploymentWizard";
import DeploymentStatus from "./DeploymentStatus";
import Logs from "./Logs";
import DefaultConfig from "./DefaultConfig";
import ConfigurationForm from "./ConfigurationForm";

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("deployment");
  const { instance } = useMsal();
  const account = instance.getActiveAccount();

  const breadcrumbMap = {
    deployment: "Deployment Wizard",
    status: "Deployment Status",
    logs: "Logs",
    defaultConfig: "Default Configurations",
    configuration: "Configuration Form",
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header with breadcrumb + profile */}
        <header className="px-6 py-3 bg-white border-b shadow-sm flex items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <FaHome className="text-gray-400 text-sm" />
            <nav className="text-xs sm:text-sm text-gray-500">
              <span className="hover:text-gray-700 cursor-pointer transition">
                Dashboard
              </span>
              <span className="mx-1">/</span>
              <span className="text-blue font-sm">
                {breadcrumbMap[activeSection]}
              </span>
            </nav>
          </div>
        </header>

        {/* Section Content */}
        <section className="flex-1 p-2 bg-white-50">
          {activeSection === "deployment" && <DeploymentWizard />}
          {activeSection === "status" && <DeploymentStatus />}
          {activeSection === "logs" && <Logs />}
          {activeSection === "defaultConfig" && <DefaultConfig />}
          {activeSection === "configuration" && <ConfigurationForm />}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
