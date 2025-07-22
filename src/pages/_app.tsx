import "@/styles/globals.css";
import "@/styles/nprogress.css";
import "nprogress/nprogress.css";
import NProgress from "nprogress";
import { Toaster } from "sonner";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useAtom } from "jotai";
import { useEffect, useState, useMemo } from "react";
import { avatarAtom, emailAtom, nameAtom } from "@/state/atoms";
import { SocketProvider } from "@/context/SocketContext";

NProgress.configure({
  minimum: 0.2,
  trickleSpeed: 200,
  showSpinner: false,
});

interface UserData {
  id: string;
  email: string;
  name: string;
  avatar: number;
}

function useProgressBar() {
  const router = useRouter();

  useEffect(() => {
    const handleStart = () => NProgress.start();
    const handleComplete = () => NProgress.done();

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);
}

function useUserState() {
  const [, setEmail] = useAtom(emailAtom);
  const [, setName] = useAtom(nameAtom);
  const [, setAvatar] = useAtom(avatarAtom);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const userString = localStorage.getItem("user");
      if (!userString) {
        setUser(null);
        return;
      }

      const userData = JSON.parse(userString);

      setUser((prevUser) => {
        if (!prevUser || prevUser.id !== userData.id) {
          setEmail(userData.email);
          setName(userData.name);
          setAvatar(userData.avatar);
          return userData;
        }
        return prevUser;
      });
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
      setUser(null);
    }
  }, [setEmail, setName, setAvatar]);

  return useMemo(() => user?.id || null, [user?.id]);
}

export default function App({ Component, pageProps }: AppProps) {
  useProgressBar();
  const userId = useUserState();

  return (
    <SocketProvider userId={userId}>
      <Toaster />
      <Component {...pageProps} />
    </SocketProvider>
  );
}
