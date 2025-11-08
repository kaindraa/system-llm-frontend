"use client";

import type { ReactNode } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";

// Disable static generation for admin pages - they require runtime data fetching
export const dynamic = "force-dynamic";

export default function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
