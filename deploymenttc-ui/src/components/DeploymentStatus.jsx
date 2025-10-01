import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setEnvironment,
  setModuleType,
  setFile,
  startDeployment,
  deploymentSuccess,
  deploymentFailure,
} from "../Redux/slices/deploymentSlice";
import { getArtifactFileFromRepo } from "../Redux/actions/deploymentActions";
import Button from "./Button";
import FileUpload from "./FileUpload";
import LogsViewer from "./Logs";

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
  } = useSelector((state) => state.deployment);

  useEffect(() => {
    if (step === 3 && repoFiles.preferences?.length === 0) {
      dispatch(getArtifactFileFromRepo());
    }
  }, [step, dispatch, repoFiles.preferences?.length]);

  const handleDeploy = async () => {
    try {
      dispatch(startDeployment());
      await new Promise((res) => setTimeout(res, 1500)); // fake delay
      dispatch(deploymentSuccess());
    } catch (err) {
      dispatch(deploymentFailure(err.message));
    }
  };

  return (
    <div className="w-full h-full bg-white shadow-sm rounded-xl p-8 border border-gray-100 overflow-y-auto">
      {/* Steps */}
      <div className="space-y-8">
        {/* Step 1: Host */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-600">
                Select Host
              </label>
              <select
                value={selectedHost}
                onChange={(e) => setSelectedHost(e.target.value)}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">-- Choose a Host --</option>
                {hosts.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-right">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedHost}
                color="blue"
              >
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Env + Module */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-600">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => dispatch(setEnvironment(e.target.value))}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option>DEV</option>
                <option>TEST</option>
                <option>PROD</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-600">
                Module Type
              </label>
              <select
                value={moduleType}
                onChange={(e) => dispatch(setModuleType(e.target.value))}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">-- Select Module --</option>
                <option value="stylesheet">Stylesheet</option>
                <option value="preferences">Preferences</option>
                <option value="bmide">BMIDE Package</option>
              </select>
            </div>

            <div className="flex justify-between">
              <Button onClick={() => setStep(1)} color="gray">
                ← Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!moduleType}
                color="blue"
              >
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Files */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-700">
              Select Deployment File
            </h3>
            {loading ? (
              <div className="flex justify-center items-center space-x-2 text-sm text-gray-500">
                <span>Loading files...</span>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-gray-50 text-sm text-gray-600">
                {/* File selection UI can go here */}
                {file ? (
                  <p>
                    Selected file: <span className="font-medium">{file}</span>
                  </p>
                ) : (
                  <p>No file selected yet.</p>
                )}
              </div>
            )}
            <FileUpload onChange={(f) => dispatch(setFile(f))} />
            <div className="flex justify-between">
              <Button onClick={() => setStep(2)} color="gray">
                ← Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={!file} color="blue">
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Deploy */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-700">
              Review Deployment
            </h3>

            <div className="p-4 border rounded-lg bg-gray-50 text-sm text-gray-600 space-y-2">
              <p>
                <span className="font-medium text-gray-800">Host:</span>{" "}
                {selectedHost}
              </p>
              <p>
                <span className="font-medium text-gray-800">Environment:</span>{" "}
                {environment}
              </p>
              <p>
                <span className="font-medium text-gray-800">Module:</span>{" "}
                {moduleType}
              </p>
              <p>
                <span className="font-medium text-gray-800">File:</span>{" "}
                {file || "None selected"}
              </p>
            </div>

            <div className="flex justify-between">
              <Button onClick={() => setStep(3)} color="gray">
                ← Back
              </Button>
              <Button onClick={handleDeploy} color="green">
                {status === "deploying" ? "Deploying..." : "Deploy 🚀"}
              </Button>
            </div>

            <div className="pt-4">
              <LogsViewer logs={logs} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
