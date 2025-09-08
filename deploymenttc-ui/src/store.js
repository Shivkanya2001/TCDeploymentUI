import { configureStore } from "@reduxjs/toolkit";
import hostsReducer from "./slices/hostsSlice";
import deploymentReducer from "./slices/deploymentSlice";

export const store = configureStore({
  reducer: {
    hosts: hostsReducer,
    deployment: deploymentReducer,
  },
});
