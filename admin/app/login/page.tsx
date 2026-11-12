import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Entrar · Uniqueness Admin",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/identidade/logo-icone.png"
            alt="Uniqueness Sports"
            width={44}
            height={44}
            className="size-11 brightness-0"
            priority
          />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Uniqueness Sports
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Uniqueness Admin
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesso restrito à equipe administrativa.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
