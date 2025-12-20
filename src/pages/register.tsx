// src/pages/register.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2Icon, Check, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { avatarOptions } from "@/utlis/constants";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatar: avatarOptions[0],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const passwordRequirements = [
    {
      id: "length",
      label: "At least 8 characters",
      valid: form.password.length >= 8,
    },
    {
      id: "upper",
      label: "At least one uppercase letter",
      valid: /[A-Z]/.test(form.password),
    },
    {
      id: "lower",
      label: "At least one lowercase letter",
      valid: /[a-z]/.test(form.password),
    },
  ];

  const validate = () => {
    const newErrors: Partial<typeof form> = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.includes("@")) newErrors.email = "Valid email is required";

    // Password validation
    if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(form.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(form.password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter";
    }

    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!form.avatar) newErrors.avatar = "Please select an avatar";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      setLoading(true);

      e.preventDefault();
      if (!validate()) return;

      const avatarIndex = avatarOptions.indexOf(form.avatar);

      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...form, avatar: avatarIndex }),
      });

      if (response.status == 201) {
        router.push("/login");
      } else {
        console.error("Registration failed:", response);
      }
    } catch (error) {
      console.error("Registration failed:", error);
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
        <Card className="w-full max-w-md shadow-xl border border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Create an account
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Join DevMeet to schedule and host meetings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Avatar Selection */}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <Input name="name" value={form.name} onChange={handleChange} />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                />

                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.confirmPassword}
                  </p>
                )}

                {/* Password Strength Indicators */}
                {form.password && (
                  <div className="mt-2 space-y-1 bg-slate-50 p-2 rounded-md border border-slate-100">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Password requirements:
                    </p>
                    {passwordRequirements.map((req) => (
                      <div key={req.id} className="flex items-center space-x-2">
                        {req.valid ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <X className="w-3 h-3 text-red-400" />
                        )}
                        <span
                          className={`text-xs ${
                            req.valid ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose an avatar
                </label>
                <div className="flex flex-wrap gap-3">
                  {avatarOptions.map((avatar, idx) => (
                    <button
                      type="button"
                      key={avatar}
                      className={`rounded-full border-2 p-1 transition-all bg-white ${
                        form.avatar === avatar
                          ? "border-indigo-500 ring-2 ring-indigo-200"
                          : "border-slate-200 hover:border-indigo-300"
                      }`}
                      onClick={() => setForm((f) => ({ ...f, avatar }))}
                      aria-label={`Choose avatar ${idx + 1}`}
                    >
                      <img
                        src={avatar}
                        alt={`Avatar ${idx + 1}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full mt-2">
                {loading ? <Loader2Icon className="animate-spin" /> : "Sign Up"}
              </Button>

              <p className="text-sm text-center text-muted-foreground mt-3">
                Already have an account?{" "}
                <Link href="/login" className="text-indigo-600 hover:underline">
                  Login here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
