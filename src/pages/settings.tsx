import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAtom } from "jotai";
import { avatarOptions } from "@/utlis/constants";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Loader2Icon,
  User,
  Mail,
  Save,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { emailAtom, nameAtom, avatarAtom } from "@/state/atoms";
import { toast } from "sonner";
import NProgress from "nprogress";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useAtom(emailAtom);
  const [name, setName] = useAtom(nameAtom);
  const [avatar, setAvatar] = useAtom(avatarAtom);

  const [localName, setLocalName] = useState(name);
  const [localEmail, setLocalEmail] = useState(email);
  const [localAvatar, setLocalAvatar] = useState(avatar);

  useEffect(() => {
    setLocalName(name);
    setLocalEmail(email);
    setLocalAvatar(avatar);
  }, [name, email, avatar]);

  const handleSave = async () => {
    setLoading(true);
    NProgress.start();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      toast.error("User ID not found. Please log in again.");
      return;
    }
    try {
      const res = await fetch(`/api/users?id=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: localEmail,
          name: localName,
          avatar: localAvatar,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Failed to update user info");
        return;
      }
      setName(localName);
      setEmail(localEmail);
      setAvatar(localAvatar);
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          name: localName,
          email: localEmail,
          avatar: localAvatar,
        })
      );
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while updating profile.");
    } finally {
      NProgress.done();
      setLoading(false);
    }
  };

  // Detect if any changes have been made
  const hasChanges =
    localName !== name || localEmail !== email || localAvatar !== avatar;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Profile Card */}
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Profile Information</CardTitle>
                  <CardDescription className="mt-1">
                    Update your personal details and public profile.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-slate-700"
                  >
                    Display Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <Input
                      id="name"
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      placeholder="Enter your full name"
                      className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={localEmail}
                      onChange={(e) => setLocalEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium text-slate-700 block">
                  Profile Avatar
                </Label>
                <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300">
                  <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                    {Object.entries(avatarOptions).map(([key, url]) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setLocalAvatar(Number(key))}
                        className={`group relative outline-none transition-all duration-200 ${
                          localAvatar === Number(key)
                            ? "scale-110"
                            : "hover:scale-105 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <div
                          className={`p-1 rounded-full transition-all duration-200 ${
                            localAvatar === Number(key)
                              ? "bg-gradient-to-r from-indigo-500 to-violet-500 shadow-md ring-2 ring-indigo-200 ring-offset-2"
                              : "bg-transparent"
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Avatar option ${Number(key) + 1}`}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white bg-white"
                          />
                        </div>
                        {localAvatar === Number(key) && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <Button
                  onClick={handleSave}
                  disabled={loading || !hasChanges}
                  size="lg"
                  className={`
                    min-w-[140px] transition-all duration-200
                    ${
                      loading || !hasChanges
                        ? "bg-slate-100 text-slate-400"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg shadow-indigo-500/20"
                    }
                  `}
                >
                  {loading ? (
                    <>
                      <Loader2Icon className="animate-spin mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Card Placeholder - to show extensibility */}
          <Card className="border-slate-200 shadow-sm opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Sparkles className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-700">
                    App Preferences
                  </CardTitle>
                  <CardDescription>
                    Customize your experience (Coming Soon)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
