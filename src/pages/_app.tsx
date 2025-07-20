import "@/styles/globals.css";
import NProgress from "nprogress";
import "@/styles/nprogress.css";
import "nprogress/nprogress.css";
import { Toaster } from "sonner";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { avatarAtom, emailAtom, nameAtom } from "@/state/atoms";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useEffect(() => {
    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    NProgress.configure({
      minimum: 0.2, // how early it starts (0–1)
      trickleSpeed: 200, // speed of progress bar trickle
      showSpinner: false,
    });
    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  const [, setEmail] = useAtom(emailAtom);
  const [, setName] = useAtom(nameAtom);
  const [, setAvatar] = useAtom(avatarAtom);

  useEffect(() => {
    const user = window.localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        setEmail(userData.email);
        setName(userData.name);
        setAvatar(userData.avatar || ""); // fallback if avatar not present
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e);
      }
    }
  }, []);

  return (
    <>
      <Toaster />
      <Component {...pageProps} />
    </>
  );
}
