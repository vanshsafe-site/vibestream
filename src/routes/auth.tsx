import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — VibeStream" },
      { name: "description", content: "Sign in or create your VibeStream account to stream music." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created. You're in!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-2xl">
        <Link to="/" className="block text-center text-2xl font-black text-primary">VibeStream</Link>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email" required placeholder="Email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password" required placeholder="Password" minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <button type="submit" disabled={busy}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60">
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
