import axios from "axios";

// Use Vite's environment variable (make sure to use VITE_ prefix in the .env file)
const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL, // Accessing the VITE environment variable
  withCredentials: true,
});

export default api;
