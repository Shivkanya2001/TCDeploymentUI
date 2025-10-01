import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api";
import { DefaultConfig } from "../../endpoints";
export const getConfig = createAsyncThunk(
  "config/getConfig",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(DefaultConfig.getConfig);
      return data;
    } catch (error) {
      return rejectWithValue(error?.response?.data ?? error.message);
    }
  }
);

// UPSERT (create/update entire document)
export const upsertConfig = createAsyncThunk(
  "config/upsertConfig",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.put(DefaultConfig.upsertConfig, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error?.response?.data ?? error.message);
    }
  }
);

// PATCH (partial update)
export const patchConfig = createAsyncThunk(
  "config/patchConfig",
  async (patch, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(DefaultConfig.patchConfig, patch);
      return data;
    } catch (error) {
      return rejectWithValue(error?.response?.data ?? error.message);
    }
  }
);

// HOSTS: add
export const addHost = createAsyncThunk(
  "config/addHost",
  async (host, { rejectWithValue }) => {
    try {
      const { data } = await api.post(DefaultConfig.addHost, host);
      return data;
    } catch (error) {
      return rejectWithValue(error?.response?.data ?? error.message);
    }
  }
);

// HOSTS: update
export const updateHost = createAsyncThunk(
  "config/updateHost",
  async ({ id, patch }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(DefaultConfig.updateHost(id), patch);
      return data;
    } catch (error) {
      return rejectWithValue(error?.response?.data ?? error.message);
    }
  }
);

// HOSTS: remove
export const removeHost = createAsyncThunk(
  "config/removeHost",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(DefaultConfig.removeHost(id));
      return data;
    } catch (error) {
      return rejectWithValue(error?.response?.data ?? error.message);
    }
  }
);

// HOSTS: toggle default selection
export const toggleDefaultHost = createAsyncThunk(
  "config/toggleDefaultHost",
  async ({ id, selected }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(DefaultConfig.toggleDefaultHost(id), {
        selected,
      });
      return data;
    } catch (error) {
      return rejectWithValue(error?.response?.data ?? error.message);
    }
  }
);
