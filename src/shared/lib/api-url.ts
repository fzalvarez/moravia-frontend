// Origen de la API. Vacío en desarrollo: el proxy de Vite lleva /api y /health
// al backend (F-103). En producción, el dominio de la API del mismo sitio (F-015).
// Si se configura sin esquema (moravia-api.odyssoft.com) se asume https.
const valor = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");

export const API_URL = valor && !/^https?:\/\//.test(valor) ? `https://${valor}` : valor;
