"use client";

import { useEffect } from "react";
import { fullResetAuth } from "@/lib/utils/auth-reset";

export default function LogoutPage() {
  useEffect(() => {
    fullResetAuth();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Logging out...</p>
    </div>
  );
}
