import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  darkMode: localStorage.getItem("theme") === "dark" ? true : false, // Set the initial state based on localStorage
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.darkMode = !state.darkMode;
      // Save the new theme to localStorage
      localStorage.setItem("theme", state.darkMode ? "dark" : "light");
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
