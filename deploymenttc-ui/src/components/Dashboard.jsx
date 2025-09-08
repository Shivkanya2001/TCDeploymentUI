import { useState } from "react";
import Sidebar from "./Sidebar";
import DeploymentWizard from "./DeploymentWizard";
import DeploymentStatus from "./DeploymentStatus";
import Logs from "./Logs";

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("deployment");

  const breadcrumbMap = {
    deployment: "Deployment Wizard",
    status: "Deployment Status",
    logs: "Logs",
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Breadcrumb */}
        <div className="bg-white px-6 py-3 shadow-sm">
          <nav className="text-sm text-gray-500">
            <span className="hover:text-gray-700 cursor-pointer transition">
              Dashboard
            </span>
            <span className="mx-2">/</span>
            <span className="text-blue-600 font-medium">
              {breadcrumbMap[activeSection]}
            </span>
          </nav>
        </div>

        {/* Dynamic Section */}
        <div className="flex-1 p-6">
          {activeSection === "deployment" && <DeploymentWizard />}
          {activeSection === "status" && <DeploymentStatus />}
          {activeSection === "logs" && <Logs />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
