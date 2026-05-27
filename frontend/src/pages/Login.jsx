import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen font-sans">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-1 flex-col bg-slate-900 p-12">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">HealthFlow</span>
        </div>

        {/* Hero text */}
        <div className="mt-auto pb-16">
          <h1 className="text-white text-5xl font-extrabold leading-tight tracking-tight mb-5">
            Patient Workflow<br />Management
          </h1>
          <p className="text-slate-500 text-base leading-relaxed max-w-sm mb-10">
            Track tasks, monitor progress, and manage healthcare workflows in real time.
          </p>
          <div className="flex flex-col gap-4">
            {["Real-time task tracking", "Insurance workflow automation", "Team productivity monitoring"].map((f) => (
              <div key={f} className="flex items-center gap-3 text-slate-400 text-sm">
                <div className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[480px] bg-slate-50 flex items-center justify-center p-10">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Sign in</h2>
          <p className="text-slate-500 text-sm mb-8">Enter your credentials to access the dashboard</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                placeholder="you@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 rounded-xl text-sm transition disabled:opacity-60 mt-2"
            >
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}