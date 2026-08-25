import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { PageViewPing } from "@/components/shared/page-view-ping";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PageViewPing />
      <Navbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
