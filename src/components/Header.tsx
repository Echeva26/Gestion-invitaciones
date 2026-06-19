import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function Header({
  name,
  role,
  communityName,
}: {
  name: string;
  role: "OWNER" | "ADMIN";
  communityName: string;
}) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏊</span>
          <span className="font-semibold text-slate-800">{communityName}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {role === "ADMIN" && (
            <nav className="flex gap-3">
              <Link href="/admin" className="text-slate-600 hover:text-pool-700">
                Administración
              </Link>
              <Link href="/dashboard" className="text-slate-600 hover:text-pool-700">
                Mi piscina
              </Link>
            </nav>
          )}
          <span className="text-slate-400">·</span>
          <span className="text-slate-600">{name}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
