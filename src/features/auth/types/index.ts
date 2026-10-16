// Contrato de la API (moravia-backend, app/modules/auth/schemas.py).

export interface TokenApi {
  access_token: string;
  token_type: string;
  /** Segundos de vigencia del access token (15 min por defecto). */
  expires_in: number;
}

export interface MeApi {
  id: string;
  nombre_usuario: string;
  tipo: "personal" | "departamento";
  persona_id: string | null;
  departamento_id: string | null;
  roles: string[];
  permisos: string[];
}
