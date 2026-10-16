import axios from "axios";

/**
 * Cliente para /auth/*: envía la cookie httpOnly `moravia_refresh` (path
 * /api/v1/auth) y no lleva el interceptor de 401 del cliente general, para
 * no encadenar renovaciones.
 */
export const authApi = axios.create({ baseURL: "/api/v1/auth", withCredentials: true });
