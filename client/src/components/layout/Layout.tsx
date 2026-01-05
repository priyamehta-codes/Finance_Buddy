import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title = "Dashboard" }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/40 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64 transition-all">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
