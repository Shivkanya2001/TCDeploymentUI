import { createSlice } from "@reduxjs/toolkit";
import {
  getGitRepoConfig,
  getGitRepoConnect,
  getRepoBranches,
} from "../actions/gitConfigActions";

const initialState = {
  config: null,
  loading: false,
  error: null,
  lastAction: null,
};

const configRepo = createSlice({
  name: "config",
  initialState,
  reducers: {
    clearConfigError: (state) => {
      state.error = null;
    },
    resetConfigState: () => initialState,
  },
  extraReducers: (builder) => {
    const start = (state, action) => {
      state.loading = true;
      state.error = null;
      state.lastAction = action.type;
    };
    const success = (state, action) => {
      state.loading = false;
      state.config = action.payload ?? state.config;
      state.lastAction = action.type;
    };
    const fail = (state, action) => {
      state.loading = false;
      state.error = action.payload ?? action.error?.message ?? "Request failed";
      state.lastAction = action.type;
    };

    builder
      .addCase(getGitRepoConfig.pending, start)
      .addCase(getGitRepoConfig.fulfilled, success)
      .addCase(getGitRepoConfig.rejected, fail)
      .addCase(getGitRepoConnect.pending, start)
      .addCase(getGitRepoConnect.fulfilled, success)
      .addCase(getGitRepoConnect.rejected, fail)
      .addCase(getRepoBranches.pending, start)
      .addCase(getRepoBranches.fulfilled, success)
      .addCase(getRepoBranches.rejected, fail);
  },
});

export const { clearConfigError, resetConfigState } = configRepo.actions;
export default configRepo.reducer;

export const selectGitConfig = (state) => state.config?.config ?? null;
export const selectGitConfigLoading = (state) => state.config?.loading ?? false;
export const selectGitConfigError = (state) => state.config?.error ?? null;
export const selectGitConfigLastAction = (state) =>
  state.config?.lastAction ?? null;
