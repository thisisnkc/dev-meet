// src/pages/register.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();

  const avatarOptions: string[] = [
    "https://randomuser.me/api/portraits/women/44.jpg",
    "https://randomuser.me/api/portraits/men/32.jpg",
    "https://randomuser.me/api/portraits/men/75.jpg",
    "https://randomuser.me/api/portraits/women/68.jpg",
    "https://randomuser.me/api/portraits/men/86.jpg",
  ];

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatar: avatarOptions[0],
  });

  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const validate = () => {
    const newErrors: Partial<typeof form> = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.includes("@")) newErrors.email = "Valid email is required";
    if (form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
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
    e.preventDefault();
    if (!validate()) return;

    // Replace with actual backend call
    console.log("Submitted:", form);
    router.push("/login");
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
                Sign Up
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
