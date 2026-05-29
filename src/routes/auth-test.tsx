import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth-test")({
  component: AuthTestPage,
  head: () => ({
    meta: [
      { title: "Supabase Auth Test" },
      { name: "description", content: "Temporary Supabase signup diagnostics page." },
    ],
  }),
});

type TestResult = {
  ok: boolean;
  authResponse?: unknown;
  authError?: string;
  profileResponse?: unknown;
  profileError?: string;
  roleResponse?: unknown;
  roleError?: string;
};

const projectUrl = import.meta.env.VITE_SUPABASE_URL ?? "Missing VITE_SUPABASE_URL";
const anonKeyStatus = import.meta.env.VITE_SUPABASE_ANON_KEY
  ? "VITE_SUPABASE_ANON_KEY is present"
  : import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? "Using VITE_SUPABASE_PUBLISHABLE_KEY from the connected project"
    : "Missing Supabase browser key";

function AuthTestPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    const nextResult: TestResult = { ok: false };

    try {
      const authResult = await supabase.auth.signUp({ email, password });
      nextResult.authResponse = authResult.data;

      if (authResult.error) {
        nextResult.authError = authResult.error.message;
        setResult(nextResult);
        return;
      }

      const userId = authResult.data.user?.id;
      if (!userId) {
        nextResult.authError = "Signup succeeded but no user.id was returned.";
        setResult(nextResult);
        return;
      }

      const profileResult = await supabase
        .from("profiles")
        .upsert({ user_id: userId, email }, { onConflict: "user_id" })
        .select("user_id,email")
        .single();
      nextResult.profileResponse = profileResult.data;
      if (profileResult.error) nextResult.profileError = profileResult.error.message;

      const roleResult = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: "runner" }, { onConflict: "user_id,role" })
        .select("user_id,role")
        .single();
      nextResult.roleResponse = roleResult.data;
      if (roleResult.error) nextResult.roleError = roleResult.error.message;

      nextResult.ok = !profileResult.error && !roleResult.error;
      setResult(nextResult);
    } catch (error) {
      nextResult.authError = error instanceof Error ? error.message : String(error);
      setResult(nextResult);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <div className="mx-auto w-full max-w-2xl space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Supabase Auth Test</h1>
          <div className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
            <div>Project URL: {projectUrl}</div>
            <div>Browser key: {anonKeyStatus}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="auth-test-email">Email</Label>
            <Input
              id="auth-test-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auth-test-password">Password</Label>
            <Input
              id="auth-test-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Create Supabase Test User
          </Button>
        </form>

        {result ? (
          <Alert variant={result.ok ? "default" : "destructive"}>
            {result.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
            <AlertTitle>{result.ok ? "Signup success" : "Signup/profile diagnostic result"}</AlertTitle>
            <AlertDescription>
              <pre className="mt-3 max-h-[480px] overflow-auto whitespace-pre-wrap rounded-md bg-background p-3 text-xs text-foreground">
                {JSON.stringify(result, null, 2)}
              </pre>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </main>
  );
}