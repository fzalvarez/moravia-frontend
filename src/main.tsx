import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppLayout } from "./app/layouts/AppLayout";
import { Toaster } from "./components/ui/sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppLayout />
    <Toaster position="bottom-right" richColors duration={3000} />
  </StrictMode>
);
