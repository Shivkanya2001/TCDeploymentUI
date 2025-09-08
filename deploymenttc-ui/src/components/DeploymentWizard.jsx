import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setEnvironment,
  setModuleType,
  setFile,
  startDeployment,
  deploymentSuccess,
  deploymentFailure,
} from "../slices/deploymentSlice";
import { getArtifactFileFromRepo } from "../actions/deploymentActions";
import Button from "./Button";
import FileUpload from "./FileUpload";
import LogsViewer from "./Logs";

export default function DeploymentWizard() {
  const dispatch = useDispatch();
  const hosts = ["Host1", "Host2", "Host3"];

  const [selectedHost, setSelectedHost] = useState(hosts[0]);
  const [step, setStep] = useState(1);
  const [collapsed, setCollapsed] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const { environment, moduleType, file, logs, status, repoFiles, loading } =
    useSelector((state) => state.deployment);

  useEffect(() => {
    if (step === 3 && moduleType) {
      dispatch(getArtifactFileFromRepo(moduleType));
    }
  }, [step, moduleType, dispatch]);

  const handleSearch = (e) => setSearchTerm(e.target.value.toLowerCase());

  const filterFiles = (files) =>
    !searchTerm
      ? files
      : files.filter((f) => f.toLowerCase().includes(searchTerm));

  const toggleCollapse = (section) =>
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));

  const handleFileSelection = (e, fileName) => {
    const selectedFiles = e.target.checked
      ? [...(file || []), fileName]
      : (file || []).filter((f) => f !== fileName);
    dispatch(setFile([...new Set(selectedFiles)]));
  };

  const handleSectionSelectAll = (sectionFiles, checked) => {
    if (checked) dispatch(setFile([...(file || []), ...sectionFiles]));
    else
      dispatch(setFile((file || []).filter((f) => !sectionFiles.includes(f))));
  };

  const handleGlobalSelectAll = (checked) => {
    const allFiles = [
      ...(repoFiles.preferences || []),
      ...(repoFiles.stylesheets || []),
      ...(repoFiles.bmide || []),
    ];
    dispatch(setFile(checked ? allFiles : []));
  };

  const handleDeploy = async () => {
    try {
      dispatch(startDeployment());
      await new Promise((res) => setTimeout(res, 2000)); // fake API
      dispatch(deploymentSuccess());
    } catch (err) {
      dispatch(deploymentFailure(err.message));
    }
  };

  const renderSection = (title, sectionKey, sectionFiles) => {
    if (!sectionFiles?.length) return null;
    return (
      <div className="mb-6">
        <div
          className="flex justify-between items-center cursor-pointer py-2"
          onClick={() => toggleCollapse(sectionKey)}
        >
          <h4 className="font-medium text-blue-600">{title}</h4>
          <span className="text-sm text-gray-400">
            {sectionFiles.length} files
          </span>
        </div>

        {/* Section Select All */}
        <div className="flex items-center my-2 text-sm">
          <input
            type="checkbox"
            id={`selectAll-${sectionKey}`}
            checked={sectionFiles.every((f) => file?.includes(f))}
            onChange={(e) =>
              handleSectionSelectAll(sectionFiles, e.target.checked)
            }
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor={`selectAll-${sectionKey}`}
            className="ml-2 text-gray-600"
          >
            Select All {title}
          </label>
        </div>

        {!collapsed[sectionKey] && (
          <div className="space-y-2 mt-2 max-h-56 overflow-y-auto border rounded-md p-3 bg-gray-50">
            {filterFiles(sectionFiles).map((f) => (
              <div key={f} className="flex items-center">
                <input
                  type="checkbox"
                  id={f}
                  value={f}
                  checked={file?.includes?.(f)}
                  onChange={(e) => handleFileSelection(e, f)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={f} className="ml-2 text-gray-700 text-sm">
                  {f}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white shadow-sm rounded-xl p-8 border border-gray-100 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">
          🚀 Teamcenter Deployment
        </h2>
        <span className="text-sm font-medium text-gray-400">
          Step {step} of 3
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-8">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${
            step === 1
              ? "w-1/3 bg-blue-500"
              : step === 2
              ? "w-2/3 bg-blue-500"
              : "w-full bg-blue-500"
          }`}
        />
      </div>

      {/* Step 1: Host + Env */}
      {step === 1 && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-600">
            Select Host
          </label>
          <select
            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-sm"
            value={selectedHost}
            onChange={(e) => setSelectedHost(e.target.value)}
          >
            <option value="">-- Choose a Host --</option>
            {hosts.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>

          <label className="block mt-6 mb-2 text-sm font-medium text-gray-600">
            Environment
          </label>
          <select
            className="w-full border rounded-lg p-2.5 mb-6 focus:ring-2 focus:ring-blue-500 text-sm"
            value={environment}
            onChange={(e) => dispatch(setEnvironment(e.target.value))}
          >
            <option>DEV</option>
            <option>TEST</option>
            <option>PROD</option>
          </select>

          <div className="mt-6 text-right">
            <Button
              onClick={() => setStep(2)}
              color="blue"
              disabled={!selectedHost}
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select Module */}
      {step === 2 && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-600">
            Module Type
          </label>
          <select
            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-sm"
            value={moduleType}
            onChange={(e) => dispatch(setModuleType(e.target.value))}
          >
            <option value="">-- Select Module --</option>
            <option value="all">All Modules</option>
            <option value="stylesheets">Stylesheets</option>
            <option value="preferences">Preferences</option>
            <option value="bmide">BMIDE Package</option>
          </select>

          <div className="mt-6 flex justify-between">
            <Button onClick={() => setStep(1)} color="gray">
              ← Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              color="blue"
              disabled={!moduleType}
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Select File */}
      {step === 3 && (
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-4">
            Select Deployment File
          </h3>

          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full border rounded-lg p-2.5 mb-4 focus:ring-2 focus:ring-blue-500 text-sm"
          />

          {loading ? (
            <div className="flex justify-center items-center space-x-2 text-sm text-gray-500">
              <span>Loading files...</span>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {moduleType === "all" ? (
                <>
                  {/* Global Select All */}
                  <div className="mb-4 p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        id="selectAllModules"
                        checked={
                          file?.length ===
                          [
                            ...(repoFiles.preferences || []),
                            ...(repoFiles.stylesheets || []),
                            ...(repoFiles.bmide || []),
                          ].length
                        }
                        onChange={(e) =>
                          handleGlobalSelectAll(e.target.checked)
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="selectAllModules"
                        className="ml-2 font-medium text-blue-600"
                      >
                        Select All Files (Preferences + Stylesheets + BMIDE)
                      </label>
                    </div>
                  </div>

                  {renderSection(
                    "Preferences",
                    "preferences",
                    repoFiles.preferences
                  )}
                  {renderSection(
                    "Stylesheets",
                    "stylesheets",
                    repoFiles.stylesheets
                  )}
                  {renderSection("BMIDE", "bmide", repoFiles.bmide)}
                </>
              ) : (
                renderSection(
                  moduleType.charAt(0).toUpperCase() + moduleType.slice(1),
                  moduleType,
                  repoFiles[moduleType]
                )
              )}
            </div>
          )}

          {/* Upload Option */}
          <FileUpload onChange={(f) => dispatch(setFile(f))} />

          <div className="mt-6 flex justify-between">
            <Button onClick={() => setStep(2)} color="gray">
              ← Back
            </Button>
            <Button
              onClick={handleDeploy}
              color="green"
              disabled={!file || file.length === 0}
            >
              {status === "deploying" ? "Deploying..." : "Deploy 🚀"}
            </Button>
          </div>

          <div className="mt-8">
            <LogsViewer logs={logs} />
          </div>
        </div>
      )}
    </div>
  );
}
