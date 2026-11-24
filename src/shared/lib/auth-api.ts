import axios from "axios";
import { API_URL } from "./api-url";

/**
 * Cliente para /auth/*: envía la cookie httpOnly `moravia_refresh` (path
 * /api/v1/auth) y no lleva el interceptor de 401 del cliente general, para
 * no encadenar renovaciones. withCredentials: en producción la API está en otro
 * origen del mismo sitio (F-015).
 */
export const authApi = axios.create({ baseURL: `${API_URL}/api/v1/auth`, withCredentials: true });
