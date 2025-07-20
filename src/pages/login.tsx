// src/pages/login.tsx
import { useAtom } from "jotai";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { avatarAtom, emailAtom, nameAtom, passwordAtom } from "@/state/atoms";
import { useRouter } from "next/router";
// import { useToast } from "@/components/ui/toast"; // <-- Add this
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useAtom(emailAtom);
  const [, setName] = useAtom(nameAtom);
  const [, setAvatar] = useAtom(avatarAtom);
  const [password, setPassword] = useAtom(passwordAtom);

  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const [loading, setLoading] = useState(false);

  const router = useRouter();
  // const { showToast } = useToast();

  const validate = () => {
    const errors: typeof formErrors = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Invalid email format";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      setLoading(true);
      e.preventDefault();
      if (!validate()) return;

      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.status !== 200) {
        toast("Invalid email or password.", {
          closeButton: true,
          description: "Please try again.",
          duration: 5000,
          style: {
            color: "red",
          },
        });
        console.error("Login failed:", response);
        return;
      } else {
        const data = await response.json();
        setName(data.user.name);
        setAvatar(data.user.avatar);
        toast("Login successful!");
        router.push("/dashboard");

        const user = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar,
        };

        localStorage.setItem("user", JSON.stringify(user));
      }

      // proceed with API call
    } catch {
      toast("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border border-slate-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Welcome to DevMeet
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your credentials to access your meetings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFormErrors({ ...formErrors, email: undefined });
                  }}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFormErrors({ ...formErrors, password: undefined });
                  }}
                />
                {formErrors.password && (
                  <p className="text-sm text-red-500">{formErrors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full mt-2">
                {loading ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  "Login In"
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground mt-4">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-indigo-600 hover:underline"
                >
                  Register here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
