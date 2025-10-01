import { createAsyncThunk, isRejectedWithValue } from "@reduxjs/toolkit";
import api from "../../api";
import { repoConfig } from "../../endpoints";

export const getGitRepoConfig = createAsyncThunk(
  "get/getGitRepoConfig", // The action type should be unique
  async ({ provider, token }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `${repoConfig.getGitRepoConfig}?provider=${provider}`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
            "Content-Type": "application/json", // Set the content type as JSON
          },
        }
      );

      // Check if the 'items' key exists and has data
      if (!response.data.items || response.data.items.length === 0) {
        console.log("No items found in the response");
        return rejectWithValue("No items found in the response");
      }

      console.log("Fetched files successfully", response.data.items); // Corrected log to show items
      return response.data.items; // Return the items array from the response
    } catch (error) {
      console.log("Error Fetching files", error); // Log error if fetching fails
      return rejectWithValue(
        // Use rejectWithValue correctly
        error.response ? error.response.data : error.message // Return the error details
      );
    }
  }
);

export const getGitRepoConnect = createAsyncThunk(
  "/get/getGitRepoConnect",
  async ({ provider, token }, { rejectWithValue }) => {
    // Accepting both provider and token
    try {
      const response = await api.post(
        `${repoConfig.gitRepoConnect}`,
        { provider },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Connected with provider successfully", response.data);
      return response.data; // Return the response data
    } catch (error) {
      console.log("Error connecting with provider", error);
      return rejectWithValue(
        error.response ? error.response.data : error.message
      );
    }
  }
);

export const getRepoBranches = createAsyncThunk(
  "get/getRepoBranches",
  async ({ provider, token, repo }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `${repoConfig.getRepoBranches}?provider=${provider}&repo=${repo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
            "Content-Type": "application/json", // Set the content type as JSON
          },
        }
      );

      // Return the response data to be used as the action payload
      return response.data;
    } catch (error) {
      console.log("Error Fetching branches", error);

      // Return the error to be handled by rejected action
      return rejectWithValue(
        error.response ? error.response.data : error.message
      );
    }
  }
);
