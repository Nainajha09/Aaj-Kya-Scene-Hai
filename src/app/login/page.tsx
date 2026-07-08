"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { sendOtp, verifyOtpCode } from "./actions";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await sendOtp(email);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStep("code");
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await verifyOtpCode(email, code);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/profile");
      router.refresh();
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#15132a] text-[#f3eefb] p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">Aaj Kya Scene Hai</h1>
        <p className="text-sm text-[#b6abd9] mb-6">Sign in to see what&apos;s happening.</p>

        {step === "email" && (
          <form onSubmit={sendCode} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-[#221f38] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#b298e7]"
            />
            <button
              disabled={loading}
              className="w-full rounded-lg bg-[#b298e7] text-[#1e1830] font-semibold py-3 text-sm disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send me a code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verifyCode} className="space-y-3">
            <p className="text-xs text-[#b6abd9]">
              Enter the code we sent to {email}
            </p>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="e.g. 12345678"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-lg bg-[#221f38] border border-white/10 px-4 py-3 text-sm tracking-widest outline-none focus:border-[#b298e7]"
            />
            <button
              disabled={loading}
              className="w-full rounded-lg bg-[#b298e7] text-[#1e1830] font-semibold py-3 text-sm disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify & continue"}
            </button>
          </form>
        )}

        {error && <p className="text-sm text-[#ef7fa8] mt-3">{error}</p>}
      </div>
    </main>
  );
}
