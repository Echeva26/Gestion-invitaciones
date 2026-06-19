"use client";

import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/auth/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMessage(data.message ?? data.error ?? "Revisa tu correo.");
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="text-center space-y-3">
        <div className="text-3xl">📧</div>
        <p className="text-slate-700">{message}</p>
        <p className="text-sm text-slate-400">
          (En desarrollo, el enlace aparece en la consola del servidor.)
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="text-pool-600 text-sm hover:underline"
        >
          Usar otro email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Tu email de propietario
        </label>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@ejemplo.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pool-500"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-pool-600 hover:bg-pool-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 transition"
      >
        {status === "loading" ? "Enviando…" : "Recibir enlace de acceso"}
      </button>
    </form>
  );
}
