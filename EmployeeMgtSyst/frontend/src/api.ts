import axios from "axios";


export const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  // Try to get token from localStorage (remember me) or sessionStorage (session only)
  const token = localStorage.getItem("lf_token") || sessionStorage.getItem("lf_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
