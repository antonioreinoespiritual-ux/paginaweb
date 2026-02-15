"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@studio.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Sign in to Product Strategy Studio</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <Button
            className="w-full"
            onClick={async () => {
              setError("");
              const res = await signIn("credentials", { email, password, redirect: false });
              if (res?.error) {
                setError("Invalid credentials. Check your email and password.");
                return;
              }
              router.push("/dashboard");
            }}
          >
            Sign in
          </Button>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
