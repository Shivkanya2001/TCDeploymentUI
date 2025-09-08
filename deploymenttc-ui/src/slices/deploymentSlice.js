import { createSlice } from "@reduxjs/toolkit";
import { getArtifactFileFromRepo } from "../actions/deploymentActions"; // Import the async action

const initialState = {
  environment: "DEV",
  moduleType: "",
  file: null,
  logs: [],
  status: "idle", // idle | deploying | success | failure
  repoFiles: {
    preferences: [],
    stylesheets: [],
    bmide: [],
  },
  loading: false, // Loading state while fetching files
  error: null, // Error message when fetching fails
};

const deploymentSlice = createSlice({
  name: "deployment",
  initialState,
  reducers: {
    setEnvironment: (state, action) => {
      state.environment = action.payload;
    },
    setModuleType: (state, action) => {
      state.moduleType = action.payload;
    },
    setFile: (state, action) => {
      state.file = action.payload;
    },
    startDeployment: (state) => {
      state.status = "deploying";
      state.logs.push("🚀 Starting deployment...");
    },
    deploymentSuccess: (state) => {
      state.status = "success";
      state.logs.push("✅ Deployment successful!");
    },
    deploymentFailure: (state, action) => {
      state.status = "failure";
      state.logs.push(`❌ Deployment failed: ${action.payload}`);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getArtifactFileFromRepo.pending, (state) => {
        state.loading = true; // Set loading to true when the API request starts
        state.error = null; // Reset error before the API call
      })
      .addCase(getArtifactFileFromRepo.fulfilled, (state, action) => {
        // Ensure the response matches the structure you're expecting
        // { preferences: [], stylesheets: [], bmide: [] }
        const {
          preferences = [],
          stylesheets = [],
          bmide = [],
        } = action.payload;

        state.repoFiles = { preferences, stylesheets, bmide };
        state.loading = false; // Stop loading when the data is received
      })
      .addCase(getArtifactFileFromRepo.rejected, (state, action) => {
        state.loading = false; // Stop loading
        // Set error message if the request fails
        state.error =
          action.payload || "An error occurred while fetching files.";
      });
  },
});

export const {
  setEnvironment,
  setModuleType,
  setFile,
  startDeployment,
  deploymentSuccess,
  deploymentFailure,
} = deploymentSlice.actions;

export default deploymentSlice.reducer;
