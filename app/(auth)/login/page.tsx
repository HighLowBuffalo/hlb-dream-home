"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    // TODO: Wire up Supabase magic link
    // await supabase.auth.signInWithOtp({ email })
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-12">
          <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-4">
            High, Low, Buffalo
          </p>
          <h1 className="text-3xl font-light leading-tight mb-3">
            Home Vision Tool
          </h1>
          <p className="text-sm font-light text-gray-600 leading-relaxed">
            This tool will walk you through a series of questions about your
            dream home. It takes about 30 minutes, and you can save your
            progress and come back anytime.
          </p>
        </div>

        {submitted ? (
          <div>
            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-3">
              Check your email
            </p>
            <p className="text-sm font-light text-gray-600 leading-relaxed">
              We sent a sign-in link to <span className="text-black">{email}</span>.
              Click the link in the email to continue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-4">
              Email address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
            <div className="mt-8">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send sign-in link"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
