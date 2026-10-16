import api from "@/shared/lib/axios";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import type { ServiceResponse } from "@/shared/types/service.types";
import type { MeApi } from "../types";

export const getMe = async (): Promise<ServiceResponse<MeApi>> => {
  try {
    const { data } = await api.get<MeApi>("/auth/me");
    return { success: true, data };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, "No se pudo cargar la sesión.") };
  }
};
