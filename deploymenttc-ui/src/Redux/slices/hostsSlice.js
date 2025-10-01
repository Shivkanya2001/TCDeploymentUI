import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  list: ["tc-dev01", "tc-test01", "tc-prod01"], // can come from API later
  selectedHost: null,
};

const hostsSlice = createSlice({
  name: "hosts",
  initialState,
  reducers: {
    selectHost: (state, action) => {
      state.selectedHost = action.payload;
    },
  },
});

export const { selectHost } = hostsSlice.actions;
export default hostsSlice.reducer;
