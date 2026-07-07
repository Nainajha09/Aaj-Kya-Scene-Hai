"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function sendCode(e: FormEvent) {
  e.preventDefault();
  console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("KEY starts with:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 15));
  setLoading(true);
  setError("");
  try {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      console.error("signInWithOtp error:", error);
      setError(error.message || "Something went wrong sending the code.");
      return;
    }
    setStep("code");
  } catch (err) {
    console.error("Unexpected error:", err);
    setError("Couldn't reach Supabase. Check your .env.local keys.");
  } finally {
    setLoading(false);
  }
}

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/profile");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#16151d] text-[#efe9dd] p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">Aaj Kya Scene Hai</h1>
        <p className="text-sm text-[#aca3bd] mb-6">Sign in to see what&apos;s happening.</p>

        {step === "email" && (
          <form onSubmit={sendCode} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-[#1f1d27] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#cf8a5e]"
            />
            <button
              disabled={loading}
              className="w-full rounded-lg bg-[#cf8a5e] text-[#1a1108] font-semibold py-3 text-sm disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send me a code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verifyCode} className="space-y-3">
            <p className="text-xs text-[#aca3bd]">
              Enter the  code we sent to {email}
            </p>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="12345678"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-lg bg-[#1f1d27] border border-white/10 px-4 py-3 text-sm tracking-widest outline-none focus:border-[#cf8a5e]"
            />
            <button
              disabled={loading}
              className="w-full rounded-lg bg-[#cf8a5e] text-[#1a1108] font-semibold py-3 text-sm disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify & continue"}
            </button>
          </form>
        )}

        {error && <p className="text-sm text-[#c97b93] mt-3">{error}</p>}
      </div>
    </main>
  );
}
