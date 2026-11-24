/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

interface ImportMetaEnv {
  /** Origen de la API en producción (F-015). Vacío en desarrollo. */
  readonly VITE_API_URL?: string;
}
