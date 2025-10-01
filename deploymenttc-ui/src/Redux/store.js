import { configureStore } from "@reduxjs/toolkit";
import hostsReducer from "./slices/hostsSlice";
import deploymentReducer from "./slices/deploymentSlice";
import defaultConfigReducer from "./slices/defaultConfigSlice";

export const store = configureStore({
  reducer: {
    hosts: hostsReducer,
    deployment: deploymentReducer,
    defaultConfig: defaultConfigReducer,
  },
});
