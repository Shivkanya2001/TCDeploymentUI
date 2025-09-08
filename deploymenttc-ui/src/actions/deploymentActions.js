import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";
import { DEPLOYMENTFILES } from "../endpoints";

// Fetch files from backend with query param (type)
export const getArtifactFileFromRepo = createAsyncThunk(
  "deployment/fetchFiles",
  async (type = "all", { rejectWithValue }) => {
    try {
      // Construct API URL with query param
      const response = await api.get(
        `${DEPLOYMENTFILES.getArtifactFileFromRepo}?type=${type}`
      );

      console.log(`Files received for type=${type}:`, response.data);

      return response.data;
    } catch (error) {
      console.error("Error fetching files:", error);
      return rejectWithValue(
        error.response ? error.response.data : error.message
      );
    }
  }
);
