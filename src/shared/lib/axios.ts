import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { refrescarToken } from "@/features/auth/services/refrescarToken.service";
import { API_URL } from "./api-url";

// En desarrollo API_URL es vacío y el proxy de Vite lleva /api al backend (F-103).
const api = axios.create({ baseURL: `${API_URL}/api/v1` });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Ante un 401: renovar una vez y repetir. Si vuelve a fallar, cerrar la
// sesión local (cuenta desactivada, acceso restablecido, cookie vencida).
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _reintento?: boolean }) | undefined;
    if (error.response?.status !== 401 || !original || original._reintento) {
      if (error.response?.status === 401) useAuthStore.getState().clearStore();
      return Promise.reject(error);
    }
    original._reintento = true;
    const token = await refrescarToken();
    if (!token) {
      useAuthStore.getState().clearStore();
      return Promise.reject(error);
    }
    return api(original);
  }
);

export default api;
