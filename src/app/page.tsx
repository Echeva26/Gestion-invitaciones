import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");

  const { error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏊</div>
          <h1 className="text-2xl font-bold text-slate-900">Piscina Abedul</h1>
          <p className="text-slate-500 mt-1">Gestión de invitados</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
              {error}
            </div>
          )}
          <LoginForm />
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Solo los propietarios dados de alta pueden acceder.
        </p>
      </div>
    </main>
  );
}
