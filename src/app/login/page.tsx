"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Access Denied: " + error.message);
      setLoading(false);
      return;
    }

    // Router handles redirect to dashboard after auth callback or local redirect
    router.push("/auth/callback");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground dark">
      <div className="p-8 border border-primary bg-card rounded-lg shadow-[0_0_20px_rgba(57,255,20,0.3)] max-w-md w-full backdrop-blur-md">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-6 drop-shadow-[0_0_10px_rgba(57,255,20,0.5)] text-center uppercase">
          GuildOS Login
        </h1>
        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="OPERATOR EMAIL"
            className="p-3 bg-black/50 border border-primary/50 text-primary font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="PASSWORD"
            className="p-3 bg-black/50 border border-primary/50 text-primary font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-4 p-3 bg-primary text-black font-bold uppercase tracking-widest hover:bg-primary/80 transition-colors rounded"
          >
            {loading ? "AUTHENTICATING..." : "INITIATE LINK"}
          </button>
        </form>
      </div>
    </div>
  );
}
