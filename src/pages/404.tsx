// src/pages/404.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Custom404() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <p className="text-lg mb-6">
        Oops! The page you&apos;re looking for doesn&apos; exist.
      </p>
      <Button asChild>
        <Link href="/login">Go to Login</Link>
      </Button>
    </div>
  );
}
