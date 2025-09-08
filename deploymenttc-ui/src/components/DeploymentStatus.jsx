import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getArtifactFileFromRepo } from "../actions/deploymentActions"; // Import async action
import Button from "./Button";
import FileUpload from "./FileUpload";
import LogsViewer from "./Logs"; // Add logs viewer for step 4

export default function DeploymentWizard() {
  const dispatch = useDispatch();

  const hosts = ["Host1", "Host2", "Host3"];
  const [selectedHost, setSelectedHost] = useState(hosts[0]);
  const [step, setStep] = useState(1);

  const {
    environment,
    moduleType,
    file,
    logs,
    status,
    repoFiles,
    loading,
    error,
  } = useSelector((state) => state.deployment); // Get state from Redux

  useEffect(() => {
    if (step === 3 && repoFiles.preferences.length === 0) {
      dispatch(getArtifactFileFromRepo()); // Trigger API call
    }
  }, [step, dispatch, repoFiles.preferences.length]);

  return (
    <div className="bg-white shadow-lg p-6 rounded-lg">
      <h2 className="text-3xl font-extrabold text-red-800">
        🚀 Teamcenter Deployment
      </h2>
      <p>Step {step} of 4</p>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-10">
        <div
          className={`h-2.5 rounded-full transition-all ${
            step === 1
              ? "w-1/4 bg-blue-500"
              : step === 2
              ? "w-2/4 bg-blue-500"
              : step === 3
              ? "w-3/4 bg-blue-500"
              : "w-full bg-blue-500"
          }`}
        />
      </div>

      {/* Step 1: Select Host */}
      {step === 1 && (
        <div>
          <label>Select Host</label>
          <select
            value={selectedHost}
            onChange={(e) => setSelectedHost(e.target.value)}
            className="w-full border rounded-lg p-3"
          >
            <option value="">-- Choose a Host --</option>
            {hosts.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <Button onClick={() => setStep(2)} disabled={!selectedHost}>
            Next →
          </Button>
        </div>
      )}

      {/* Step 2: Environment + Module */}
      {step === 2 && (
        <div>
          <label>Environment</label>
          <select
            value={environment}
            onChange={(e) => dispatch(setEnvironment(e.target.value))}
            className="w-full border rounded-lg p-3 mb-6"
          >
            <option>DEV</option>
            <option>TEST</option>
            <option>PROD</option>
          </select>

          <label>Module Type</label>
          <select
            value={moduleType}
            onChange={(e) => dispatch(setModuleType(e.target.value))}
            className="w-full border rounded-lg p-3"
          >
            <option value="">-- Select Module --</option>
            <option value="stylesheet">Stylesheet</option>
            <option value="preferences">Preferences</option>
            <option value="bmide">BMIDE Package</option>
          </select>
          <Button onClick={() => setStep(3)} disabled={!moduleType}>
            Next →
          </Button>
        </div>
      )}

      {/* Step 3: Select File */}
      {step === 3 && (
        <div>
          <h3>Select Deployment File</h3>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div>{/* File selection logic */}</div>
          )}
          <FileUpload onChange={(f) => dispatch(setFile(f))} />
          <Button onClick={() => setStep(4)} disabled={!file}>
            Next →
          </Button>
        </div>
      )}

      {/* Step 4: Review + Deploy */}
      {step === 4 && (
        <div>
          <h3>Review Deployment</h3>
          {/* Review deployment details */}
          <Button onClick={handleDeploy}>
            {status === "deploying" ? "Deploying..." : "Deploy 🚀"}
          </Button>
          <LogsViewer logs={logs} />
        </div>
      )}
    </div>
  );
}
