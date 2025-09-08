import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getArtifactFileFromRepo } from "../actions/deploymentActions"; // Import async action to fetch files

export default function RepoFileSelector({ onSelect }) {
  const dispatch = useDispatch();
  const { repoFiles, loading, error } = useSelector(
    (state) => state.deployment
  );

  // Dispatch action to fetch deployment files when the component mounts
  useEffect(() => {
    if (!repoFiles.length) {
      // Fetch only if repoFiles is empty
      dispatch(getArtifactFileFromRepo()); // Fetch files from the API via Redux
    }
  }, [dispatch, repoFiles.length]); // Re-run if repoFiles array changes

  return (
    <div>
      <label className="block mb-2 font-medium">
        Select Deployment File from Repo
      </label>

      {/* Show loading state */}
      {loading && <p>Loading files...</p>}

      {/* Show error state */}
      {error && <p className="text-red-500">Error fetching files: {error}</p>}

      {/* Dropdown to select a file from the repo */}
      {!loading && !error && (
        <select
          className="w-full border rounded p-2"
          onChange={(e) => onSelect(e.target.value)} // Pass selected file to parent component
        >
          <option value="">-- Select File --</option>
          {repoFiles.length > 0 ? (
            repoFiles.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))
          ) : (
            <option>No files found</option>
          )}
        </select>
      )}
    </div>
  );
}
