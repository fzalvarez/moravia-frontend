import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { AppLayout } from "./app/layouts/AppLayout";
import { Toaster } from "./components/ui/sonner";
import { queryClient } from "./shared/lib/query-client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppLayout />
      <Toaster position="bottom-right" richColors duration={3000} />
    </QueryClientProvider>
  </StrictMode>
);
