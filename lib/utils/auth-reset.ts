/**
 * Utility untuk fully reset auth state
 */

export function fullResetAuth() {
  if (typeof window !== "undefined") {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
      document.cookie = `${name}=;expires=${new Date().toUTCString()};path=/`;
    });

    // Redirect ke login
    window.location.href = "/login";
  }
}

export function isTokenValid(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("token");
  return !!token && token.length > 100;
}
