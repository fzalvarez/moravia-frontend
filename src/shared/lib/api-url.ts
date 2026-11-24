// Origen de la API. Vacío en desarrollo: el proxy de Vite lleva /api y /health
// al backend (F-103). En producción, el dominio de la API del mismo sitio (F-015).
export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
