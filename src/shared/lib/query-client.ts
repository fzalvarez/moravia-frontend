import { QueryClient } from "@tanstack/react-query";
import { getHttpStatus } from "./http-error";

// F-010. Sin reintentos ante 4xx (permisos, validación, no visible): solo ante
// fallos de red o 5xx, y una vez.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: (intentos, error) => {
        const status = getHttpStatus(error);
        return (status === null || status >= 500) && intentos < 1;
      },
    },
    mutations: { retry: false },
  },
});
