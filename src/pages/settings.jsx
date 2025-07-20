import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import { avatarOptions } from "@/utlis/constants";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2Icon } from "lucide-react";
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
      toast("User ID not found. Please log in again.");
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
        toast(data.message || "Failed to update user info");
        return;
      }
      const data = await res.json();
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
      toast("Profile updated successfully!");
    } catch (error) {
      toast("An error occurred while updating profile.");
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
      <div className="max-w-2xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>

        {/* Profile Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700">Profile Info</h3>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {Object.entries(avatarOptions).map(([key, url]) => (
              <button
                type="button"
                key={key}
                className={`rounded-full border-2 p-1 transition-all bg-white ${
                  localAvatar === Number(key)
                    ? "border-indigo-500 ring-2 ring-indigo-200"
                    : "border-slate-200 hover:border-indigo-300"
                }`}
                onClick={() => setLocalAvatar(Number(key))}
                aria-label={`Choose avatar ${key + 1}`}
              >
                <img
                  src={url}
                  alt={`Avatar ${key + 1}`}
                  className="w-12 h-12 rounded-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* <div className="space-y-2">
          <Label>Avatar</Label>
          <div className="flex gap-4">
            {Object.entries(avatarOptions).map(([key, url]) => (
              <img
                key={key}
                src={url}
                onClick={() => setLocalAvatar(Number(key))}
                className={`w-12 h-12 rounded-full border-2 cursor-pointer ${
                  localAvatar === Number(key)
                    ? "border-indigo-500"
                    : "border-transparent"
                }`}
                alt={`Avatar ${key}`}
              />
            ))}
          </div>
        </div> */}
        </div>

        {/* Booking Link */}
        {/* <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700">Booking Link</h3>
        <Input
          disabled
          value={`https://devmeet.com/book/${localEmail?.split("@")[0]}`}
        />
      </div> */}

        <Button
          className="mt-4"
          onClick={handleSave}
          disabled={loading || !hasChanges}
        >
          {loading ? (
            <Loader2Icon className="animate-spin mr-2 inline-block w-4 h-4" />
          ) : null}
          Save Changes
        </Button>
      </div>
    </DashboardLayout>
  );
}
