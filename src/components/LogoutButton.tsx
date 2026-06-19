"use client";

export default function LogoutButton() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }
  return (
    <button
      onClick={logout}
      className="text-sm text-slate-500 hover:text-slate-800 transition"
    >
      Salir
    </button>
  );
}
