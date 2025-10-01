// src/redux/slices/configSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  getConfig,
  upsertConfig,
  patchConfig,
  addHost,
  updateHost,
  removeHost,
  toggleDefaultHost,
} from "../actions/defaultConfigActions"; // <-- match your component import casing

const initialState = {
  config: null, // The Mongo-backed config document
  loading: false, // Generic network spinner
  error: null, // Normalized error message
  lastAction: null, // For telemetry / UI cues
};

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    clearConfigError: (state) => {
      state.error = null;
    },
    resetConfigState: () => initialState, // return a fresh copy
  },
  extraReducers: (builder) => {
    // Helpers
    const start = (state, action) => {
      state.loading = true;
      state.error = null;
      state.lastAction = action.type;
    };
    const success = (state, action) => {
      state.loading = false;
      // Back end returns the whole document on success (get / upsert / patch / host ops)
      state.config = action.payload ?? state.config;
      state.lastAction = action.type;
    };
    const fail = (state, action) => {
      state.loading = false;
      // Prefer rejectWithValue payload, fall back to Error.message, then generic
      state.error = action.payload ?? action.error?.message ?? "Request failed";
      state.lastAction = action.type;
    };

    // READ
    builder
      .addCase(getConfig.pending, start)
      .addCase(getConfig.fulfilled, success)
      .addCase(getConfig.rejected, fail);

    // UPSERT
    builder
      .addCase(upsertConfig.pending, start)
      .addCase(upsertConfig.fulfilled, success)
      .addCase(upsertConfig.rejected, fail);

    // PATCH
    builder
      .addCase(patchConfig.pending, start)
      .addCase(patchConfig.fulfilled, success)
      .addCase(patchConfig.rejected, fail);

    // HOSTS: add / update / remove / toggle default
    builder
      .addCase(addHost.pending, start)
      .addCase(addHost.fulfilled, success)
      .addCase(addHost.rejected, fail)
      .addCase(updateHost.pending, start)
      .addCase(updateHost.fulfilled, success)
      .addCase(updateHost.rejected, fail)
      .addCase(removeHost.pending, start)
      .addCase(removeHost.fulfilled, success)
      .addCase(removeHost.rejected, fail)
      .addCase(toggleDefaultHost.pending, start)
      .addCase(toggleDefaultHost.fulfilled, success)
      .addCase(toggleDefaultHost.rejected, fail);
  },
});

export const { clearConfigError, resetConfigState } = configSlice.actions;
export default configSlice.reducer;

/* -------------------------------- SELECTORS -------------------------------- */
export const selectConfig = (s) => s.config?.config ?? null;
export const selectConfigLoading = (s) => !!s.config?.loading;
export const selectConfigError = (s) => s.config?.error ?? null;
export const selectConfigLastAction = (s) => s.config?.lastAction ?? null;
