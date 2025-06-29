import axios from "axios";
import { ElMessage } from "element-plus";
export const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/";

export const api = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || "An error occurred";
    ElMessage.error(message);
    return Promise.reject(error);
  },
);
