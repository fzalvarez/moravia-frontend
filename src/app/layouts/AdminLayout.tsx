import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/shared/components/sidebar/AppSidebar";
import { AppHeader } from "@/shared/components/sidebar/AppHeader";
import { Backdrop } from "@/shared/components/sidebar/Backdrop";

export default function AdminLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const close = () => setIsMobileOpen(false);

  return (
    <div className="min-h-screen bg-[#f8f9fe]">
      <AppSidebar isMobileOpen={isMobileOpen} onNavigate={close} />
      <Backdrop visible={isMobileOpen} onClose={close} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <AppHeader onToggleSidebar={() => setIsMobileOpen((v) => !v)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-360 mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
