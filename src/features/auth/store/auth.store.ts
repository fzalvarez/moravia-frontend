import { create } from "zustand";
import type { MeApi } from "../types";

type EstadoSesion = "verificando" | "autenticado" | "anonimo";

interface AuthState {
  /** Solo en memoria (F-004): nunca se persiste en el navegador. */
  token: string | null;
  /** Momento (ms) en que conviene renovar el token, antes de que venza. */
  renovarEn: number | null;
  usuario: MeApi | null;
  estado: EstadoSesion;
  setToken: (token: string, expiresIn: number) => void;
  setUsuario: (usuario: MeApi) => void;
  clearStore: () => void;
}

// Renovar al 80 % de la vigencia (moravia-backend/frontend/ARCHITECTURE.md §4).
const FRACCION_RENOVACION = 0.8;

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  renovarEn: null,
  usuario: null,
  estado: "verificando",

  setToken: (token, expiresIn) =>
    set({ token, renovarEn: Date.now() + expiresIn * 1000 * FRACCION_RENOVACION }),

  setUsuario: (usuario) => set({ usuario, estado: "autenticado" }),

  clearStore: () => set({ token: null, renovarEn: null, usuario: null, estado: "anonimo" }),
}));
